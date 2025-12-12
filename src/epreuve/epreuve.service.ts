import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { UpdateEpreuveDto } from './dto/update-epreuve.dto';

@Injectable()
export class EpreuveService {
  constructor(private prisma: PrismaService) {}

  async create(createEpreuveDto: CreateEpreuveDto) {
    return this.prisma.epreuve.create({
      data: createEpreuveDto,
    });
  }

  async findAll() {
    return this.prisma.epreuve.findMany({
      include: { filiere: true, niveau: true }, // inclut les relations
    });
  }

  async findOne(id: string) {
    return this.prisma.epreuve.findUnique({
      where: { id },
      include: { filiere: true, niveau: true },
    });
  }

  async update(id: string, updateEpreuveDto: UpdateEpreuveDto) {
    return this.prisma.epreuve.update({
      where: { id },
      data: updateEpreuveDto,
    });
  }

  async remove(id: string) {
    return this.prisma.epreuve.delete({
      where: { id },
    });
  }
}
