import { Injectable, NotFoundException } from '@nestjs/common';
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
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { departement: true },
    });
    if (!filiere) throw new NotFoundException('Filière non trouvée');
    return filiere;
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

  // 🔹 Récupérer les filières d'un département (pour React)
  async findByDepartement(departementId: string) {
    return this.prisma.filiere.findMany({
      where: { departementId },
      include: { departement: true },
    });
  }
}
