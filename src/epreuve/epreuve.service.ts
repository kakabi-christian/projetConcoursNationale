import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { UpdateEpreuveDto } from './dto/update-epreuve.dto';

@Injectable()
export class EpreuveService {
  constructor(private prisma: PrismaService) {}

  async create(createEpreuveDto: CreateEpreuveDto) {
    return this.prisma.epreuve.create({
      data: createEpreuveDto,
    });
  }

  /**
   * Récupère les épreuves avec pagination et recherche
   */
  async findAll(query: { page: number; limit: number; search?: string; filiereId?: string }) {
    const { page, limit, search, filiereId } = query;
    const skip = (page - 1) * limit;

    // Construction dynamique du filtre WHERE
    const where: any = {};
    
    if (search) {
      where.nomEpreuve = {
        contains: search,
        mode: 'insensitive', // Recherche insensible à la casse
      };
    }

    if (filiereId) {
      where.filiereId = filiereId;
    }

    // Exécution parallèle pour plus de rapidité
    const [data, total] = await Promise.all([
      this.prisma.epreuve.findMany({
        where,
        skip,
        take: limit,
        include: { 
          filiere: true, 
          specialite: true, 
          niveau: true, 
          _count: { select: { archives: true } } // Compte le nombre d'archives sans tout charger
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.epreuve.count({ where }),
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
    const epreuve = await this.prisma.epreuve.findUnique({
      where: { id },
      include: { filiere: true, specialite: true, niveau: true, archives: true },
    });
    if (!epreuve) throw new NotFoundException('Épreuve non trouvée');
    return epreuve;
  }

  async update(id: string, updateEpreuveDto: UpdateEpreuveDto) {
    return this.prisma.epreuve.update({
      where: { id },
      data: updateEpreuveDto,
    });
  }

  async remove(id: string) {
    return this.prisma.epreuve.delete({
      where: { id },
    });
  }

  async findBySpecialite(specialiteId: string) {
    const specialite = await this.prisma.specialite.findUnique({
      where: { id: specialiteId },
    });
    if (!specialite) throw new NotFoundException('Spécialité non trouvée');

    return this.prisma.epreuve.findMany({
      where: { specialiteId },
      include: { filiere: true, niveau: true, archives: true },
      orderBy: { nomEpreuve: 'asc' },
    });
  }
}