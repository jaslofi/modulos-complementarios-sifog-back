import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Viatico } from './entities/viatico.entity';
import { ViaticosController } from './viatico.controller';
import { ViaticosService } from './viatico.service';


@Module({
  imports: [TypeOrmModule.forFeature([Viatico])],
  controllers: [ViaticosController],
  providers: [ViaticosService],
})
export class ViaticoModule {}
