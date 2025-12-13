import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: { filiere: true, niveau: true, archives: true }, // inclut relations et archives
    });
  }

  async findOne(id: string) {
    const epreuve = await this.prisma.epreuve.findUnique({
      where: { id },
      include: { filiere: true, niveau: true, archives: true },
    });
    if (!epreuve) throw new NotFoundException('Épreuve non trouvée');
    return epreuve;
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

  // 🔹 Récupérer toutes les épreuves d'une filière avec leurs archives et niveau
  async findByFiliere(filiereId: string) {
    return this.prisma.epreuve.findMany({
      where: { filiereId },
      include: { niveau: true, archives: true },
    });
  }
}
