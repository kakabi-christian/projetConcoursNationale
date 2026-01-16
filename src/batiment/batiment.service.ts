import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatimentDto } from './dto/create-batiment.dto';
import { UpdateBatimentDto } from './dto/update-batiment.dto';

@Injectable()
export class BatimentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau bâtiment
   */
  async create(createBatimentDto: CreateBatimentDto) {
    const codeUpper = createBatimentDto.code.toUpperCase();

    // Vérifier si le code existe déjà
    const existing = await this.prisma.batiment.findUnique({
      where: { code: codeUpper },
    });

    if (existing) {
      throw new ConflictException(`Le code bâtiment "${codeUpper}" est déjà utilisé.`);
    }

    return this.prisma.batiment.create({
      data: {
        nom: createBatimentDto.nom,
        code: codeUpper,
      },
    });
  }

  /**
   * Liste paginée des bâtiments avec leurs salles
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Récupération simultanée des données et du total pour la pagination
    const [data, total] = await Promise.all([
      this.prisma.batiment.findMany({
        skip: skip,
        take: limit,
        include: {
          _count: {
            select: { salles: true }, // Compte le nombre de salles sans toutes les charger
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.batiment.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Trouver un bâtiment par ID
   */
  async findOne(id: string) {
    const batiment = await this.prisma.batiment.findUnique({
      where: { id },
      include: { salles: true },
    });

    if (!batiment) {
      throw new NotFoundException(`Bâtiment avec l'ID ${id} introuvable.`);
    }

    return batiment;
  }

  /**
   * Mettre à jour un bâtiment
   */
  async update(id: string, updateBatimentDto: UpdateBatimentDto) {
    // Vérifier l'existence
    await this.findOne(id);

    // Si le code est fourni, vérifier les doublons (en ignorant l'actuel)
    if (updateBatimentDto.code) {
      const codeUpper = updateBatimentDto.code.toUpperCase();
      const existing = await this.prisma.batiment.findFirst({
        where: {
          code: codeUpper,
          NOT: { id: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Le code "${codeUpper}" est déjà utilisé par un autre bâtiment.`);
      }
      updateBatimentDto.code = codeUpper;
    }

    return this.prisma.batiment.update({
      where: { id },
      data: updateBatimentDto,
    });
  }

  /**
   * Supprimer un bâtiment
   */
  async remove(id: string) {
    const batiment = await this.findOne(id);
    
    // Note: Si tu as des salles liées, Prisma bloquera la suppression 
    // à cause des contraintes d'intégrité (ce qui est une bonne chose).
    return this.prisma.batiment.delete({
      where: { id },
    });
  }
}