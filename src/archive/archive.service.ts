// src/archive/archive.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';

@Injectable()
export class ArchiveService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔹 Créer une archive
  async create(createArchiveDto: CreateArchiveDto) {
    return this.prisma.archive.create({
      data: createArchiveDto,
    });
  }

  // 🔹 Récupérer toutes les archives
  async findAll() {
    return this.prisma.archive.findMany({
      include: {
        epreuve: true,
        annee: true,
      },
    });
  }

  // 🔹 Récupérer une archive par ID
  async findOne(id: string) {
    const archive = await this.prisma.archive.findUnique({
      where: { id },
      include: { epreuve: true, annee: true },
    });
    if (!archive) {
      throw new NotFoundException(`Archive with ID ${id} not found`);
    }
    return archive;
  }

  // 🔹 Mettre à jour une archive
  async update(id: string, updateArchiveDto: UpdateArchiveDto) {
    await this.findOne(id); // vérifie que l'archive existe
    return this.prisma.archive.update({
      where: { id },
      data: updateArchiveDto,
    });
  }

  // 🔹 Supprimer une archive
  async remove(id: string) {
    await this.findOne(id); // vérifie que l'archive existe
    return this.prisma.archive.delete({
      where: { id },
    });
  }

  // 🔹 Récupérer toutes les archives d'une épreuve
  async findByEpreuve(epreuveId: string) {
    return this.prisma.archive.findMany({
      where: { epreuveId },
      include: { epreuve: true, annee: true },
    });
  }
}
