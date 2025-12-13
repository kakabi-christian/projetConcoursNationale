import { Module } from '@nestjs/common';
import { PieceDossierController } from './piece-dossier.controller';
import { PieceDossierService } from './piece-dossier.service';

@Module({
  controllers: [PieceDossierController],
  providers: [PieceDossierService]
})
export class PieceDossierModule {}
