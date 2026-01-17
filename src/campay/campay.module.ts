// src/campay/campay.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CampayService } from './campay.service';
import { CampayController } from './campay.controller';
import { PaiementModule } from '../paiement/paiement.module'; // 👈 Import du module

@Module({
  imports: [
    forwardRef(() => PaiementModule) // 👈 Ajoute ceci pour résoudre la dépendance
  ],
  providers: [CampayService],
  controllers: [CampayController],
  exports: [CampayService],
})
export class CampayModule {}