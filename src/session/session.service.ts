import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async create(createSessionDto: CreateSessionDto) {
    const data = {
      ...createSessionDto,
      dateDebut: new Date(createSessionDto.dateDebut),
      dateFin: new Date(createSessionDto.dateFin),
    };
    return this.prisma.session.create({ 
      data,
      include: { concours: true } 
    });
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ET RECHERCHE ---
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Filtre de recherche sur le nom de la sessions
    const where: Prisma.SessionWhereInput = search ? {
      nom: { contains: search, mode: 'insensitive' as const },
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.session.count({ where }),
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        include: { 
          concours: true,
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
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { 
        concours: true,
        _count: {
          select: { enrollements: true }
        }
      },
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

    return this.prisma.session.update({ 
      where: { id }, 
      data,
      include: { concours: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.session.delete({ where: { id } });
  }
}