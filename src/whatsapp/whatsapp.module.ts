import { Module, Global } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';

@Global() // Rend le service disponible dans toute l'application sans ré-import
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [WhatsappService],
  exports: [WhatsappService], // Permet d'injecter WhatsappService ailleurs
})
export class WhatsappModule {}