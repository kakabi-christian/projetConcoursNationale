import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { PrismaModule } from '../prisma/prisma.module'; // Assure-toi que le chemin est correct
import { DispatchController } from './dispatch.controller';

@Module({
  imports: [PrismaModule], // Indispensable pour injecter PrismaService dans le DispatchService
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService], // Optionnel : si tu veux l'utiliser dans d'autres modules plus tard
})
export class DispatchModule {}