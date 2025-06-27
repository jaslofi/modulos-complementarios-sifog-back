import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { ComprobantesModule } from 'src/comprobantes/comprobantes.module';
import { NetworkModule } from 'src/network/network.module';

@Module({
  imports: [ComprobantesModule,NetworkModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
