// src/network/network.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access, constants, createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class NetworkService implements OnModuleInit {
  private readonly logger = new Logger(NetworkService.name);
  private sharePath: string;
  private username: string;
  private password: string; 
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.sharePath = this.getValidatedConfig('NETWORK_SHARE_PATH');
    this.username = this.getValidatedConfig('NETWORK_SHARE_USER');
    this.password = this.getValidatedConfig('NETWORK_SHARE_PASSWORD');
  }

  private getValidatedConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`La variable de entorno ${key} no está configurada`);
    }
    return value;
  }

  async onModuleInit(): Promise<void> {
    await this.connectToNetworkShare();
  }

  private async connectToNetworkShare(): Promise<void> {
    try {
      // Primero intentamos conectar sin mapear
      await this.testConnection();
      this.isConnected = true;
      this.logger.log('Conexión establecida sin necesidad de mapear unidad');
      return;
    } catch (error) {
      this.logger.warn(`Intento directo fallido: ${error.message}`);
    }

    try {
      // Si falla, intentamos mapear la unidad
      await this.mapNetworkDrive();
      this.isConnected = true;
      this.logger.log('Unidad de red mapeada con éxito');
    } catch (error) {
      this.logger.error(`Error al mapear unidad: ${error.message}`);
      throw new Error('No se pudo conectar al recurso compartido de red');
    }
  }

  private async testConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      access(this.sharePath, constants.F_OK, (err) => {
        if (err) reject(new Error(`No se puede acceder al recurso: ${err.message}`));
        else resolve();
      });
    });
  }

  private async mapNetworkDrive(): Promise<void> {
    try {
      // Comando para mapear unidad de red en Windows
      const { stdout, stderr } = await execAsync(
        `net use ${this.sharePath} /user:${this.username} ${this.password}`
      );

      if (stderr) {
        throw new Error(stderr);
      }

      this.logger.log(`Resultado del mapeo: ${stdout}`);
    } catch (error) {
      throw new Error(`Error al mapear unidad: ${error.message}`);
    }
  }

  // Métodos para FileService
  async fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      access(filePath, constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }

  getBasePath(): string {
    return this.sharePath;
  }


  createReadStream(filePath: string): NodeJS.ReadableStream {
    if (!existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe`);
    }
    return createReadStream(filePath);
  }

  getFileStats(filePath: string): { size: number; mtime: Date } {
    const stats = statSync(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  getFullPath(filename: string): string {
    return join(this.sharePath, filename);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  }
}