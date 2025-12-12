import { Module } from '@nestjs/common';
import { AnneeController } from './annee-academique.controller';
import { AnneeService } from './annee-academique.service';
import { PrismaService } from '../prisma/prisma.service'; // <- n’oublie pas le service Prisma

@Module({
  controllers: [AnneeController], // <- ici il faut le controller, pas le module
  providers: [AnneeService, PrismaService], // <- ajoute PrismaService
})
export class AnneeAcademiqueModule {}
