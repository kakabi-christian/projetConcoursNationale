import { Module } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { PaiementController } from './paiement.controller';

@Module({
  providers: [PaiementService],
  controllers: [PaiementController]
})
export class PaiementModule {}
