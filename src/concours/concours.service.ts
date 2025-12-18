import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { UpdateConcoursDto } from './dto/update-concours.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConcoursService {
  constructor(private prisma: PrismaService) {}

  async create(createConcoursDto: CreateConcoursDto) {
    const { anneeId, sessionId, pieceDossierIds, ...rest } = createConcoursDto;

    return this.prisma.concours.create({
      data: {
        ...rest,
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        session: sessionId ? { connect: { id: sessionId } } : undefined,
        piecesDossier: pieceDossierIds?.length
          ? { connect: pieceDossierIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { session: true, piecesDossier: true, annee: true },
    });
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ET RECHERCHE ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Filtre de recherche sur le code ou l'intitule
    const where: Prisma.ConcoursWhereInput = search ? {
      OR: [
        { code: { contains: search, mode: 'insensitive' as const } },
        { intitule: { contains: search, mode: 'insensitive' as const } },
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
          _count: {
            select: { enrollements: true }
          }
        },
        orderBy: { createdAt: 'desc' },
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
    const concours = await this.prisma.concours.findUnique({
      where: { id },
      include: { session: true, piecesDossier: true, annee: true },
    });
    if (!concours) throw new NotFoundException('Concours non trouvé');
    return concours;
  }

  async update(id: string, updateConcoursDto: UpdateConcoursDto) {
    await this.findOne(id);
    const { anneeId, sessionId, pieceDossierIds, ...rest } = updateConcoursDto;

    return this.prisma.concours.update({
      where: { id },
      data: {
        ...rest,
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        session: sessionId ? { connect: { id: sessionId } } : undefined,
        piecesDossier: pieceDossierIds?.length
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