import { Module } from '@nestjs/common';
import { BatimentService } from './batiment.service';
import { BatimentController } from './batiment.controller';

@Module({
  providers: [BatimentService],
  controllers: [BatimentController]
})
export class BatimentModule {}
