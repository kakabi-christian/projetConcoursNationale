import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';

@Injectable()
export class SalleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une salle avec génération automatique du code (ex: CF100)
   */
  async create(createSalleDto: CreateSalleDto) {
    const { batimentId, capacite } = createSalleDto;

    // 1. Vérifier si le bâtiment existe et récupérer son code (ex: "CF")
    const batiment = await this.prisma.batiment.findUnique({
      where: { id: batimentId },
      include: { _count: { select: { salles: true } } }
    });

    if (!batiment) {
      throw new NotFoundException(`Le bâtiment avec l'ID ${batimentId} n'existe pas.`);
    }

    // 2. Générer le code unique (Préfixe + (100 + nombre de salles existantes))
    // Si le bâtiment a 0 salles -> CF100, 1 salle -> CF101...
    const nextNumber = 100 + batiment._count.salles;
    const generatedCode = `${batiment.code}${nextNumber}`;

    // 3. Création dans la base de données
    return this.prisma.salle.create({
      data: {
        codeClasse: generatedCode,
        capacite: capacite || 50, // 50 par défaut si non fourni
        batimentId: batimentId,
      },
      include: {
        batiment: true // Pour retourner les infos du bâtiment avec la salle
      }
    });
  }

  /**
   * Liste paginée des salles
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.salle.findMany({
        skip,
        take: limit,
        include: { batiment: true },
        orderBy: { codeClasse: 'asc' },
      }),
      this.prisma.salle.count(),
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
   * Trouver une salle par son ID
   */
  async findOne(id: string) {
    const salle = await this.prisma.salle.findUnique({
      where: { id },
      include: { batiment: true },
    });

    if (!salle) {
      throw new NotFoundException(`Salle avec l'ID ${id} introuvable.`);
    }

    return salle;
  }

  /**
   * Mettre à jour une salle
   * Note: On ne modifie généralement pas le codeClasse car il est généré
   */
  async update(id: string, updateSalleDto: UpdateSalleDto) {
    const existing = await this.findOne(id);

    return this.prisma.salle.update({
      where: { id },
      data: updateSalleDto,
    });
  }

  /**
   * Supprimer une salle
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.salle.delete({
      where: { id },
    });
  }
  async getBatimentsForSelect() {
    return this.prisma.batiment.findMany({
      select: {
        id: true,
        nom: true,
        code: true, // Optionnel, mais utile si on veut afficher "Nom (CODE)" dans le select
      },
      orderBy: {
        nom: 'asc',
      },
    });
  }
}