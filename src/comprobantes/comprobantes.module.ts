import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comprobante } from './entities/comprobante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comprobante])],
  exports: [TypeOrmModule],
})
export class ComprobantesModule {}
