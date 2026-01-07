import { Module } from '@nestjs/common';
import { DossierController } from './dossier.controller';
import { DossierService } from './dossier.service';
import { NotificationModule } from 'src/notification/notification.module';
@Module({
  controllers: [DossierController],
  providers: [DossierService],
  imports: [NotificationModule]
})
export class DossierModule {}
