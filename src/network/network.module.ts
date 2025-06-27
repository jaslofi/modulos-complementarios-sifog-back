import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [NetworkService],
  exports:[NetworkService]
})
export class NetworkModule {}
