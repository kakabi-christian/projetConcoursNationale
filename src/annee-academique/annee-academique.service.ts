import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
@Injectable()
export class AnneeService {
  constructor(private prisma: PrismaService) {}

  async create(createAnneeDto: CreateAnneeDto) {
    const data = {
      ...createAnneeDto,
      dateDebut: createAnneeDto.dateDebut
        ? new Date(createAnneeDto.dateDebut)
        : undefined,
      dateFin: createAnneeDto.dateFin
        ? new Date(createAnneeDto.dateFin)
        : undefined,
    };

    return this.prisma.annee.create({ data });
  }

  async findAll() {
    return this.prisma.annee.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const annee = await this.prisma.annee.findUnique({ where: { id } });
    if (!annee) throw new NotFoundException('Année académique non trouvée');
    return annee;
  }

  async update(id: string, updateAnneeDto: UpdateAnneeDto) {
    await this.findOne(id); // Vérifie existence
    const data = {
      ...updateAnneeDto,
      dateDebut: updateAnneeDto.dateDebut
        ? new Date(updateAnneeDto.dateDebut)
        : undefined,
      dateFin: updateAnneeDto.dateFin
        ? new Date(updateAnneeDto.dateFin)
        : undefined,
    };
    return this.prisma.annee.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id); // Vérifie existence
    return this.prisma.annee.delete({ where: { id } });
  }
}
