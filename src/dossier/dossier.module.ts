import { Module } from '@nestjs/common';
import { DossierController } from './dossier.controller';
import { DossierService } from './dossier.service';
import { NotificationModule } from 'src/notification/notification.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { EmailModule } from 'src/email/email.module';
import { EmailService } from 'src/email/email.service';
@Module({
  controllers: [DossierController],
  providers: [DossierService],
  imports: [NotificationModule, WhatsappModule,EmailModule],
})
export class DossierModule {}
