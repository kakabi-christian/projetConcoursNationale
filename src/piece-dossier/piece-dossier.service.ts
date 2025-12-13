// src/piecedossier/piecedossier.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePieceDossierDto } from './dto/create-piecedossier.dto';
import { UpdatePieceDossierDto } from './dto/update-piecedossier.dto';

@Injectable()
export class PieceDossierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePieceDossierDto) {
    return this.prisma.pieceDossier.create({ data: dto });
  }

  async findAll() {
    return this.prisma.pieceDossier.findMany();
  }

  async findOne(id: string) {
    const piece = await this.prisma.pieceDossier.findUnique({ where: { id } });
    if (!piece) throw new NotFoundException('Pièce non trouvée');
    return piece;
  }

  async update(id: string, dto: UpdatePieceDossierDto) {
    await this.findOne(id); // vérifier que ça existe
    return this.prisma.pieceDossier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie que la pièce existe
    return this.prisma.pieceDossier.delete({ where: { id } });
  }
}

