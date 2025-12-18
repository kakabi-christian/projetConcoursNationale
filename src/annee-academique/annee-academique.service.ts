import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnneeService {
  constructor(private prisma: PrismaService) {}

  async create(createAnneeDto: CreateAnneeDto) {
    const data = {
      ...createAnneeDto,
      dateDebut: createAnneeDto.dateDebut
        ? new Date(createAnneeDto.dateDebut)
        : undefined,
      dateFin: createAnneeDto.dateFin
        ? new Date(createAnneeDto.dateFin)
        : undefined,
    };

    return this.prisma.annee.create({ data });
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ET RECHERCHE ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Construction du filtre de recherche
    const where: Prisma.AnneeWhereInput = search ? {
      libelle: { contains: search, mode: 'insensitive' as const },
    } : {};

    // Exécution simultanée du comptage et de la récupération
    const [total, data] = await Promise.all([
      this.prisma.annee.count({ where }),
      this.prisma.annee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Optionnel : inclure le nombre de concours rattachés
        include: {
          _count: {
            select: { concours: true }
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
    const annee = await this.prisma.annee.findUnique({ 
      where: { id },
      include: { concours: true } // Inclus les concours pour la vue détaillée
    });
    if (!annee) throw new NotFoundException('Année académique non trouvée');
    return annee;
  }

  async update(id: string, updateAnneeDto: UpdateAnneeDto) {
    await this.findOne(id); // Vérifie l'existence
    
    const data = {
      ...updateAnneeDto,
      dateDebut: updateAnneeDto.dateDebut
        ? new Date(updateAnneeDto.dateDebut)
        : undefined,
      dateFin: updateAnneeDto.dateFin
        ? new Date(updateAnneeDto.dateFin)
        : undefined,
    };
    
    return this.prisma.annee.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence
    return this.prisma.annee.delete({ where: { id } });
  }
}