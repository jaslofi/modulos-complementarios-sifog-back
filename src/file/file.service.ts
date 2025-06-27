// src/file/file.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Comprobante } from '../comprobantes/entities/comprobante.entity';
import * as archiver from 'archiver';
import { NetworkService } from '../network/network.service';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(Comprobante)
    private readonly comprobanteRepository: Repository<Comprobante>,
    private readonly networkService: NetworkService,
  ) {}

  async getFiles(search: string, exactMatch: boolean): Promise<Comprobante[]> {
    const query = this.comprobanteRepository.createQueryBuilder('c');
    
    if (exactMatch) {
      query.where('c.folioComprobante LIKE :search', { search: `${search}%` });
    } else {
      query.where('c.folioComprobante LIKE :search', { search: `%${search}%` });
    }

    return query
      .select(['c.idComprobante', 'c.folioComprobante', 'c.url'])
      .orderBy('c.folioComprobante', 'ASC')
      .limit(100)
      .getMany();
  }

  async downloadFile(filename: string, res: Response): Promise<void> {
    try {
      const filePath = this.networkService.getFullPath(filename);
      
      if (!(await this.networkService.fileExists(filePath))) {
        throw new Error('Archivo no encontrado');
      }

      const stats = await this.networkService.getFileStats(filePath);
      const fileStream = this.networkService.createReadStream(filePath);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': stats.size,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      });

      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`Error al descargar: ${error.message}`);
      throw error;
    }
  }

  async zipFiles(fileNames: string[], res: Response): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 },
        forceLocalTime: true,
      });

      archive.on('error', reject);
      archive.on('end', resolve);

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=archivos_seleccionados.zip',
      });

      archive.pipe(res);

      for (const filename of fileNames) {
        const filePath = this.networkService.getFullPath(filename);

        try {
          if (await this.networkService.fileExists(filePath)) {
            const comprobante = await this.comprobanteRepository.findOne({
              where: { url: filename },
            });

            const displayName = comprobante
              ? `${comprobante.folioComprobante}${filename.substring(filename.lastIndexOf('.'))}`
              : filename;

            archive.file(filePath, { name: displayName });
          }
        } catch (error) {
          this.logger.warn(`Error con archivo ${filename}: ${error.message}`);
        }
      }

      archive.finalize();
    });
  }

  async previewFile(filename: string, res: Response): Promise<void> {
    const filePath = this.networkService.getFullPath(filename);
    
    if (!(await this.networkService.fileExists(filePath))) {
      throw new Error('Archivo no encontrado');
    }

    res.setHeader('Content-Type', 'application/pdf');
    this.networkService.createReadStream(filePath).pipe(res);
  }
}