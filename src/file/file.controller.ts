// src/file/file.controller.ts
import { Controller, Get, Query, Res, HttpException, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { FileService } from './file.service';
import { Response } from 'express';
import * as path from 'path';
import { NetworkService } from 'src/network/network.service';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly networkService: NetworkService,
  ) {}

  
  @Get()
  async getFiles(
    @Query('search') search: string,
    @Query('exactMatch') exactMatch: boolean
  ) {
    try {
      return await this.fileService.getFiles(search || '', exactMatch);
    } catch (error) {
      throw new HttpException('Error al buscar comprobantes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('download-multiple')
  async downloadMultiple(@Query('filenames') filenames: string, @Res() res: Response) {
    try {
      const list = filenames.split(',');
      await this.fileService.zipFiles(list, res);
    } catch (error) {
      throw new HttpException('Error al generar el archivo ZIP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
@Get('preview/:filename')
async previewFile(@Param('filename') filename: string, @Res() res: Response) {
  if (!await this.networkService.fileExists(filename)) {
    throw new NotFoundException('Archivo no encontrado');
  }

  res.setHeader('Content-Type', 'application/pdf');
  const stream = this.networkService.createReadStream(filename);
  stream.pipe(res);
}

}