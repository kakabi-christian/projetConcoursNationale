import { Module } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { PaiementController } from './paiement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; // ✅ Ajouter

@Module({
  imports: [PrismaModule, EmailModule], // ✅ Ajouter EmailModule
  controllers: [PaiementController],
  providers: [PaiementService],
})
export class PaiementModule {}