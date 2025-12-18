import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSpecialiteDto } from './dto/create-specialite.dto';
import { UpdateSpecialiteDto } from './dto/update-specialite.dto';
import { Prisma } from '@prisma/client';

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

  // --- VERSION AVEC PAGINATION ET RECHERCHE ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.SpecialiteWhereInput = search ? {
      OR: [
        { libelle: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.specialite.count({ where }),
      this.prisma.specialite.findMany({
        where,
        skip,
        take: limit,
        include: { filiere: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ✅ NOUVELLE MÉTHODE PAGINÉE : spécialités par filière
  async findByFiliere(filiereId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const filiere = await this.prisma.filiere.findUnique({
      where: { id: filiereId },
    });
    if (!filiere) {
      throw new NotFoundException('Filière non trouvée');
    }

    const [total, data] = await Promise.all([
      this.prisma.specialite.count({ where: { filiereId } }),
      this.prisma.specialite.findMany({
        where: { filiereId },
        skip,
        take: limit,
        orderBy: { libelle: 'asc' },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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