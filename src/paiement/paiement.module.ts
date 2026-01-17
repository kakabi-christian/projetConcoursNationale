// src/paiement/paiement.module.ts
import { Module, forwardRef } from '@nestjs/common'; // ✅ Ajout de forwardRef
import { PaiementService } from './paiement.service';
import { PaiementController } from './paiement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; 
import { CampayModule } from 'src/campay/campay.module'; 

@Module({
  imports: [
    PrismaModule, 
    EmailModule, 
    // ✅ Utilisation de forwardRef pour éviter l'erreur de boucle circulaire
    forwardRef(() => CampayModule), 
  ],
  controllers: [PaiementController],
  providers: [PaiementService],
  // ✅ TRÈS IMPORTANT : On exporte le service pour que le CampayController puisse l'utiliser
  exports: [PaiementService], 
})
export class PaiementModule {}