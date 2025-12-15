import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { UpdateConcoursDto } from './dto/update-concours.dto';

@Injectable()
export class ConcoursService {
  constructor(private prisma: PrismaService) {}

  async create(createConcoursDto: CreateConcoursDto) {
    const { anneeId, sessionId, pieceDossierIds, ...rest } = createConcoursDto;

    return this.prisma.concours.create({
      data: {
        ...rest,
        // Lier l'année si fournie
        annee: anneeId ? { connect: { id: anneeId } } : undefined,
        // Lier la session si fournie
        session: sessionId ? { connect: { id: sessionId } } : undefined,
        // Lier les pièces de dossier si fournies
        piecesDossier: pieceDossierIds?.length
          ? { connect: pieceDossierIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { session: true, piecesDossier: true },
    });
  }

  async findAll() {
    return this.prisma.concours.findMany({
      include: { session: true, piecesDossier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const concours = await this.prisma.concours.findUnique({
      where: { id },
      include: { session: true, piecesDossier: true },
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
          ? { set: pieceDossierIds.map((id) => ({ id })) } // remplace les anciennes
          : undefined,
      },
      include: { session: true, piecesDossier: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.concours.delete({ where: { id } });
  }
}
