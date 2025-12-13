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
      include: { filiere: true, specialite: true, niveau: true, archives: true },
    });
  }

  async findOne(id: string) {
    const epreuve = await this.prisma.epreuve.findUnique({
      where: { id },
      include: { filiere: true, specialite: true, niveau: true, archives: true },
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

  // 🔹 Récupérer toutes les épreuves d'une spécialité avec leurs relations
  async findBySpecialite(specialiteId: string) {
    // Vérifier que la spécialité existe
    const specialite = await this.prisma.specialite.findUnique({
      where: { id: specialiteId },
    });
    if (!specialite) throw new NotFoundException('Spécialité non trouvée');

    return this.prisma.epreuve.findMany({
      where: { specialiteId },
      include: { filiere: true, niveau: true, archives: true },
      orderBy: { nomEpreuve: 'asc' },
    });
  }
}
