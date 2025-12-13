// src/specialite/specialite.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSpecialiteDto } from './dto/create-specialite.dto';
import { UpdateSpecialiteDto } from './dto/update-specialite.dto';

@Injectable()
export class SpecialiteService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSpecialiteDto) {
    const { filiereId, ...rest } = dto;

    if (filiereId) {
      const filiere = await this.prisma.filiere.findUnique({
        where: { id: filiereId },
      });
      if (!filiere) {
        throw new BadRequestException('Filière invalide');
      }
    }

    return this.prisma.specialite.create({
      data: {
        ...rest,
        filiere: filiereId ? { connect: { id: filiereId } } : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.specialite.findMany({
      include: { filiere: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ NOUVELLE MÉTHODE
  async findByFiliere(filiereId: string) {
    // Vérifier que la filière existe
    const filiere = await this.prisma.filiere.findUnique({
      where: { id: filiereId },
    });
    if (!filiere) {
      throw new NotFoundException('Filière non trouvée');
    }

    return this.prisma.specialite.findMany({
      where: { filiereId },
      orderBy: { libelle: 'asc' },
    });
  }

  async findOne(id: string) {
    const specialite = await this.prisma.specialite.findUnique({
      where: { id },
      include: { filiere: true },
    });
    if (!specialite) throw new NotFoundException('Spécialité non trouvée');
    return specialite;
  }

  async update(id: string, dto: UpdateSpecialiteDto) {
    await this.findOne(id);
    const { filiereId, ...rest } = dto;

    if (filiereId) {
      const filiere = await this.prisma.filiere.findUnique({
        where: { id: filiereId },
      });
      if (!filiere) {
        throw new BadRequestException('Filière invalide');
      }
    }

    return this.prisma.specialite.update({
      where: { id },
      data: {
        ...rest,
        filiere: filiereId
          ? { connect: { id: filiereId } }
          : filiereId === null
          ? { disconnect: true }
          : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.specialite.delete({ where: { id } });
  }
}
