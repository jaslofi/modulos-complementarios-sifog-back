// src/network/network.service.ts
import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, statSync, access, constants } from 'fs';
import { join } from 'path';

@Injectable()
export class NetworkService {
  private readonly localPath: string;

  constructor() {
  this.localPath = join(process.cwd(), 'src', 'documentos');
  console.log('[NetworkService] Ruta a documentos:', this.localPath);
}

  async fileExists(filename: string): Promise<boolean> {
    const filePath = this.getFullPath(filename);
    return new Promise((resolve) => {
      access(filePath, constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }

  getBasePath(): string {
    return this.localPath;
  }

  getFullPath(filename: string): string {
    return join(this.localPath, filename);
  }

  createReadStream(filename: string): NodeJS.ReadableStream {
    const filePath = this.getFullPath(filename);
    if (!existsSync(filePath)) {
      throw new Error(`El archivo ${filename} no existe`);
    }
    return createReadStream(filePath);
  }


  getFileStats(filename: string): { size: number; mtime: Date } {
    const filePath = this.getFullPath(filename);
    const stats = statSync(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  async verifyConnection(): Promise<boolean> {
    return existsSync(this.localPath);
  }
}
