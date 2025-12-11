// backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  // C'est cette ligne qui résout le problème.
  // Elle exporte le PrismaService pour qu'il soit injectable dans d'autres modules.
  exports: [PrismaService],
})
export class PrismaModule {}
