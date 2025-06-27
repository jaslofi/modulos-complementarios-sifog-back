import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ViaticoModule } from './viatico/viatico.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantesModule } from './comprobantes/comprobantes.module';
import { join } from 'path';
import { NetworkModule } from './network/network.module';
import { FileModule } from './file/file.module';



@Module({
  imports: [
     ConfigModule.forRoot(),
     TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      //entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      entities: [join(__dirname, '**/*.entity.{ts,js}')],
    }),
    ViaticoModule,
    ComprobantesModule,
    NetworkModule,
    FileModule
  ],
})
export class AppModule {}

