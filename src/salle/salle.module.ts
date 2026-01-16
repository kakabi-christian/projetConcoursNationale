import { Module } from '@nestjs/common';
import { SalleController } from './salle.controller';
import { SalleService } from './salle.service';

@Module({
  controllers: [SalleController],
  providers: [SalleService]
})
export class SalleModule {}
