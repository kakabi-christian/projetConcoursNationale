import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCentreExamenDto } from './dto/create-centre-examen.dto';
import { UpdateCentreExamenDto } from './dto/update-centre-examen.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CentreExamenService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCentreExamenDto) {
    return this.prisma.centreExamen.create({ data: dto });
  }

  // --- VERSION AVEC PAGINATION ET RECHERCHE ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Filtre de recherche sur intitule et lieuCentre
    const where: Prisma.CentreExamenWhereInput = search ? {
      OR: [
        { intitule: { contains: search, mode: 'insensitive' as const } },
        { lieuCentre: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    // Exécution du comptage et de la récupération en parallèle
    const [total, data] = await Promise.all([
      this.prisma.centreExamen.count({ where }),
      this.prisma.centreExamen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Optionnel : inclure le nombre d'enrôlements
        include: {
          _count: {
            select: { enrollements: true }
          }
        }
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

  async findOne(id: string) {
    const centre = await this.prisma.centreExamen.findUnique({ 
      where: { id },
      include: { enrollements: true } 
    });
    if (!centre) throw new NotFoundException('Centre d\'examen non trouvé');
    return centre;
  }

  async update(id: string, dto: UpdateCentreExamenDto) {
    await this.findOne(id);
    return this.prisma.centreExamen.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.centreExamen.delete({ where: { id } });
  }
}