import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { UpdateConcoursDto } from './dto/update-concours.dto';
import { Prisma, ConcoursStatus } from '@prisma/client';

@Injectable()
export class ConcoursService {
  constructor(private prisma: PrismaService) {}

  /**
   * AUTOMATISATION : Ferme les concours dont la date de fin est dépassée.
   */
  private async autoCloseExpiredConcours() {
    const now = new Date();
    await this.prisma.concours.updateMany({
      where: {
        statut: ConcoursStatus.OUVERT,
        dateFinInscription: {
          lt: now,
        },
      },
      data: {
        statut: ConcoursStatus.CLOTURE,
      },
    });
  }

  /**
   * POUR LES CANDIDATS : Liste paginée des concours actifs
   */
  async findActive(page: number = 1, limit: number = 10) {
    await this.autoCloseExpiredConcours();
    
    const now = new Date();
    const skip = (page - 1) * limit;

    const where: Prisma.ConcoursWhereInput = {
      statut: ConcoursStatus.OUVERT,
      OR: [
        { dateFinInscription: { gte: now } },
        { dateFinInscription: null },
      ],
    };

    const [total, data] = await Promise.all([
      this.prisma.concours.count({ where }),
      this.prisma.concours.findMany({
        where,
        skip,
        take: limit,
        include: { 
          session: true, 
          piecesDossier: true, 
          annee: true 
        },
        orderBy: { dateFinInscription: 'asc' },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * DROPDOWN : Liste simplifiée pour les filtres (Appelée par /concours/list)
   */
  async findAllSimple() {
    return this.prisma.concours.findMany({
      select: {
        id: true,
        intitule: true,
        code: true,
      },
      orderBy: { intitule: 'asc' },
    });
  }

  /**
   * SESSIONS : Récupère les sessions liées à un concours spécifique
   * Correction de l'erreur TS(2561) via le filtrage par relation
   */
  async findSessionsByConcours(concoursId: string) {
    // Vérifier si le concours existe
    const concoursExists = await this.prisma.concours.findUnique({
      where: { id: concoursId },
    });

    if (!concoursExists) throw new NotFoundException('Concours non trouvé');

    // Récupérer les sessions en filtrant par l'objet relation 'concours'
    return this.prisma.session.findMany({
      where: {
        concours: {
          some: { id: concoursId } // Si une session peut avoir plusieurs concours
          // id: concoursId (Si relation 1:1, utilisez la syntaxe adaptée à votre schéma)
        }
      },
      orderBy: { nom: 'asc' }
    });
  }

  /**
   * ADMIN : Liste complète avec recherche et pagination
   */
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    await this.autoCloseExpiredConcours();

    const skip = (page - 1) * limit;

    const where: Prisma.ConcoursWhereInput = search ? {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { intitule: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.concours.count({ where }),
      this.prisma.concours.findMany({
        where,
        skip,
        take: limit,
        include: { 
          session: true, 
          piecesDossier: true, 
          annee: true,
          _count: { select: { enrollements: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const concours = await this.prisma.concours.findUnique({
      where: { id },
      include: { session: true, piecesDossier: true, annee: true },
    });
    if (!concours) throw new NotFoundException('Concours non trouvé');
    return concours;
  }

  async create(createConcoursDto: CreateConcoursDto) {
    const { anneeId, sessionId, pieceDossierIds, ...rest } = createConcoursDto;

    return this.prisma.concours.create({
      data: {
        ...rest,
        statut: rest.statut as ConcoursStatus,
        dateDebutInscription: rest.dateDebutInscription ? new Date(rest.dateDebutInscription) : new Date(),
        dateFinInscription: rest.dateFinInscription ? new Date(rest.dateFinInscription) : null,
        annee: { connect: { id: anneeId } },
        session: sessionId ? { connect: { id: sessionId } } : undefined,
        piecesDossier: pieceDossierIds?.length
          ? { connect: pieceDossierIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { session: true, piecesDossier: true, annee: true },
    });
  }

  async update(id: string, updateConcoursDto: UpdateConcoursDto) {
    await this.findOne(id);
    const { anneeId, sessionId, pieceDossierIds, ...rest } = updateConcoursDto;

    return this.prisma.concours.update({
      where: { id },
      data: {
        ...rest,
        statut: rest.statut ? (rest.statut as ConcoursStatus) : undefined,
        dateDebutInscription: rest.dateDebutInscription ? new Date(rest.dateDebutInscription) : undefined,
        dateFinInscription: rest.dateFinInscription ? new Date(rest.dateFinInscription) : undefined,
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        session: sessionId ? { connect: { id: sessionId } } : undefined,
        piecesDossier: pieceDossierIds 
          ? { set: pieceDossierIds.map((id) => ({ id })) } 
          : undefined,
      },
      include: { session: true, piecesDossier: true, annee: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.concours.delete({ where: { id } });
  }
}