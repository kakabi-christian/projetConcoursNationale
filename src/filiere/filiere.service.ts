import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';

@Injectable()
export class FiliereService {
  constructor(private prisma: PrismaService) {}

  async create(createFiliereDto: CreateFiliereDto) {
    return this.prisma.filiere.create({
      data: createFiliereDto,
    });
  }

  async findAll() {
    return this.prisma.filiere.findMany({
      include: { departement: true }, // inclut le département associé
    });
  }

  async findOne(id: string) {
    return this.prisma.filiere.findUnique({
      where: { id },
      include: { departement: true },
    });
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
}
