import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async create(createSessionDto: CreateSessionDto) {
    const data = {
      ...createSessionDto,
      dateDebut: new Date(createSessionDto.dateDebut),
      dateFin: new Date(createSessionDto.dateFin),
    };
    return this.prisma.session.create({ data });
  }

  async findAll() {
    return this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: { concours: true }, // inclure relation Concours
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { concours: true },
    });
    if (!session) throw new NotFoundException('Session non trouvée');
    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto) {
    await this.findOne(id);
    const data = {
      ...updateSessionDto,
      dateDebut: updateSessionDto.dateDebut
        ? new Date(updateSessionDto.dateDebut)
        : undefined,
      dateFin: updateSessionDto.dateFin
        ? new Date(updateSessionDto.dateFin)
        : undefined,
    };
    return this.prisma.session.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.session.delete({ where: { id } });
  }
}
