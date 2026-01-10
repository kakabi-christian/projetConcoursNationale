import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendTestMessage(to: string) {
    const url = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to.replace('+', ''), // Nettoie le numéro
      type: 'template',
      template: {
        name: 'jaspers_market_plain_text_v1', // Template de test de ton curl
        language: { code: 'en_US' }
      }
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
        })
      );
      this.logger.log(`✅ Message envoyé à ${to}`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ Erreur WhatsApp:', error.response?.data || error.message);
      throw error;
    }
  }
}