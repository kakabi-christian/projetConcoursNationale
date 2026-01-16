import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService], // Optionnel : permet d'utiliser l'IA dans d'autres modules si besoin
})
export class AiModule {}