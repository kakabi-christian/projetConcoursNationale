import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { Prisma } from '@prisma/client'; // Importez Prisma pour les types

@Injectable()
export class DepartementService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartementDto) {
    return this.prisma.departement.create({
      data: dto,
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Utilisation du champ EXACT : nomDep
    const where: Prisma.DepartementWhereInput = search ? {
      nomDep: { contains: search, mode: 'insensitive' },
    } : {};

    const [total, departements] = await Promise.all([
      this.prisma.departement.count({ where }),
      this.prisma.departement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nomDep: 'asc' }, 
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: departements,
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
    const departement = await this.prisma.departement.findUnique({ 
      where: { id },
      include: { filieres: true }
    });
    
    if (!departement) throw new NotFoundException('Département non trouvé');
    return departement;
  }

  async update(id: string, dto: UpdateDepartementDto) {
    await this.findOne(id); 
    return this.prisma.departement.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); 
    return this.prisma.departement.delete({
      where: { id },
    });
  }
}