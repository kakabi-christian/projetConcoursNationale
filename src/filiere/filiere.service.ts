import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';

@Injectable()
export class FiliereService {
  constructor(private prisma: PrismaService) {}

  async create(createFiliereDto: CreateFiliereDto) {
   return this.prisma.filiere.create({
    data: createFiliereDto,
    include: { departement: true }, // Ajoutez ceci pour recevoir le nom du département direct après création
  });
  }

// --- VERSION AVEC PAGINATION ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Construction du filtre de recherche
    // On cherche dans l'intitule ou la description
    const where = search ? {
      OR: [
        { intitule: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    // Exécution de la requête en parallèle pour plus de performance
    const [total, filieres] = await Promise.all([
      this.prisma.filiere.count({ where }),
      this.prisma.filiere.findMany({
        where,
        skip,
        take: limit,
        // C'est cette ligne qui permet de récupérer l'objet département associé
        include: { 
          departement: true 
        },
        orderBy: { intitule: 'asc' },
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: filieres,
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
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { departement: true },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
  }

  async update(id: string, updateFiliereDto: UpdateFiliereDto) {
    return this.prisma.filiere.update({
      where: { id },
      data: updateFiliereDto,
    });
  }

  async remove(id: string) {
    return this.prisma.filiere.delete({
      where: { id },
    });
  }

  // 🔹 Récupérer les filières d'un département avec pagination
  async findByDepartement(departementId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [total, filieres] = await Promise.all([
      this.prisma.filiere.count({ where: { departementId } }),
      this.prisma.filiere.findMany({
        where: { departementId },
        skip,
        take: limit,
        include: {
          departement: true,
          specialites: true,
        },
        orderBy: { intitule: 'asc' },
      }),
    ]);

    return {
      data: filieres,
      pagination: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}