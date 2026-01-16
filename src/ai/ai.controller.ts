import { Controller, Post, Body, Req } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { message: string, userId?: string }, @Req() req: any) {
    
    // PRIORITÉ : 
    // 1. On regarde si le userId est dans le body (ce que ton nouveau AiService.js envoie)
    // 2. Sinon on regarde dans req.user (au cas où un Guard est ajouté plus tard)
    // 3. Sinon null
    const userId = body.userId || req.user?.id || null; 

    console.log(`[AI-CHAT] 📩 Message: "${body.message}" | UserID: ${userId || 'Anonyme'}`);

    // Appel au service avec les deux paramètres
    const response = await this.aiService.getChatResponse(body.message, userId);

    return {
      success: true,
      reply: response,
    };
  }
}

