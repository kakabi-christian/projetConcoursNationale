import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCentreDepotDto } from './dto/update-centre-depot.dto';
import { CreateCentreDepotDto } from './dto/create-centre-depot.dto';
import { Prisma } from '@prisma/client'; // Importez Prisma pour le typage strict

@Injectable()
export class CentreDepotService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCentreDepotDto) {
    return this.prisma.centreDepot.create({ data: dto });
  }

  // --- VERSION CORRIGÉE AVEC LES BONS CHAMPS ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Utilisation des champs réels : intitule et lieuDepot
    const where: Prisma.CentreDepotWhereInput = search ? {
      OR: [
        { intitule: { contains: search, mode: 'insensitive' } },
        { lieuDepot: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [total, centres] = await Promise.all([
      this.prisma.centreDepot.count({ where }),
      this.prisma.centreDepot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: centres,
      pagination: {
        total,
        page,
        lastPage,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const centre = await this.prisma.centreDepot.findUnique({ where: { id } });
    if (!centre) throw new NotFoundException('Centre de dépôt non trouvé');
    return centre;
  }

  async update(id: string, dto: UpdateCentreDepotDto) {
    await this.findOne(id);
    return this.prisma.centreDepot.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.centreDepot.delete({ where: { id } });
  }
}