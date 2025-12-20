import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';

@Injectable()
export class NiveauService {
  constructor(private prisma: PrismaService) {}

  async create(createNiveauDto: CreateNiveauDto) {
    return this.prisma.niveau.create({
      data: createNiveauDto,
    });
  }

  /**
   * Récupère les niveaux avec pagination et recherche
   */
  async findAll(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    // Filtre de recherche sur l'intitulé ou le code
    const where: any = {};
    if (search) {
      where.OR = [
        { intitule: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exécution simultanée pour optimiser les performances
    const [data, total] = await Promise.all([
      this.prisma.niveau.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ordre: 'asc' }, // Tri alphabétique ou par priorité
      }),
      this.prisma.niveau.count({ where }),
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
    const niveau = await this.prisma.niveau.findUnique({
      where: { id },
      include: { epreuves: true }, // Inclure les épreuves liées si nécessaire
    });
    
    if (!niveau) throw new NotFoundException(`Niveau avec l'ID ${id} non trouvé`);
    return niveau;
  }

  async update(id: string, updateNiveauDto: UpdateNiveauDto) {
    return this.prisma.niveau.update({
      where: { id },
      data: updateNiveauDto,
    });
  }

  async remove(id: string) {
    // Note : Prisma lèvera une erreur si des épreuves sont liées (contrainte d'intégrité)
    return this.prisma.niveau.delete({
      where: { id },
    });
  }
}