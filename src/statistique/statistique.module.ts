import { Module } from '@nestjs/common';
import { StatistiqueController } from './statistique.controller';
import { StatistiqueService } from './statistique.service';

@Module({
  controllers: [StatistiqueController],
  providers: [StatistiqueService]
})
export class StatistiqueModule {}
