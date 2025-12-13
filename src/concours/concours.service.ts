import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { UpdateConcoursDto } from './dto/update-concours.dto';

@Injectable()
export class ConcoursService {
  constructor(private prisma: PrismaService) {}

  async create(createConcoursDto: CreateConcoursDto) {
    const { anneeId, sessionIds, pieceDossierIds, ...rest } = createConcoursDto;

    return this.prisma.concours.create({
      data: {
        ...rest,
        // Lier l'année si fournie
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        // Lier les sessions si fournies
        sessions: sessionIds?.length
          ? { connect: sessionIds.map((id) => ({ id })) }
          : undefined,
        // Lier les pièces de dossier si fournies
        piecesDossier: pieceDossierIds?.length
          ? { connect: pieceDossierIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { sessions: true, piecesDossier: true },
    });
  }

  async findAll() {
    return this.prisma.concours.findMany({
      include: { sessions: true, piecesDossier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const concours = await this.prisma.concours.findUnique({
      where: { id },
      include: { sessions: true, piecesDossier: true },
    });
    if (!concours) throw new NotFoundException('Concours non trouvé');
    return concours;
  }

  async update(id: string, updateConcoursDto: UpdateConcoursDto) {
    await this.findOne(id);
    const { anneeId, sessionIds, pieceDossierIds, ...rest } = updateConcoursDto;

    return this.prisma.concours.update({
      where: { id },
      data: {
        ...rest,
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        sessions: sessionIds?.length
          ? { set: sessionIds.map((id) => ({ id })) } // remplace les anciennes
          : undefined,
        piecesDossier: pieceDossierIds?.length
          ? { set: pieceDossierIds.map((id) => ({ id })) } // remplace les anciennes
          : undefined,
      },
      include: { sessions: true, piecesDossier: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.concours.delete({ where: { id } });
  }
}
