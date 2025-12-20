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

  // 🔹 Récupérer toutes les archives avec pagination et filtres
  async findAll(params: { 
    page: number; 
    limit: number; 
    search?: string; 
    epreuveId?: string; 
    anneeId?: string 
  }) {
    const { page, limit, search, epreuveId, anneeId } = params;
    const skip = (page - 1) * limit;

    // Construction dynamique du filtre WHERE
    const where: any = {};
    
    if (epreuveId) where.epreuveId = epreuveId;
    if (anneeId) where.anneeId = anneeId;
    
    if (search) {
      where.epreuve = {
        nomEpreuve: {
          contains: search,
          mode: 'insensitive', // Recherche insensible à la casse
        },
      };
    }

    // Exécution des requêtes en parallèle (Performance)
    const [data, total] = await Promise.all([
      this.prisma.archive.findMany({
        where,
        skip,
        take: limit,
        include: {
          epreuve: { include: { filiere: true } },
          annee: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.archive.count({ where }),
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
    await this.findOne(id); // vérifie l'existence
    return this.prisma.archive.update({
      where: { id },
      data: updateArchiveDto,
    });
  }

  // 🔹 Supprimer une archive
  async remove(id: string) {
    await this.findOne(id); // vérifie l'existence
    return this.prisma.archive.delete({
      where: { id },
    });
  }

  // 🔹 Récupérer les archives d'une épreuve (Version paginée)
  async findByEpreuve(epreuveId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.archive.findMany({
        where: { epreuveId },
        skip,
        take: limit,
        include: { epreuve: true, annee: true },
        orderBy: { annee: { libelle: 'desc' } }, // Trier par année la plus récente
      }),
      this.prisma.archive.count({ where: { epreuveId } }),
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
}