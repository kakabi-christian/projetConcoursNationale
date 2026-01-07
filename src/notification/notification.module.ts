import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService] // On exporte le SERVICE pour que DossierService puisse l'utiliser
})
export class NotificationModule {}