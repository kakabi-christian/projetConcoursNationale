import { Module } from '@nestjs/common';
import { CentreDepotController } from './centre-depot.controller';
import { CentreDepotService } from './centre-depot.service';
@Module({
  controllers: [CentreDepotController],
  providers:[CentreDepotService],
})
export class CentreDepotModule {}
