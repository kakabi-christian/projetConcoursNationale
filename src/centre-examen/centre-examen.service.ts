import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCentreExamenDto } from './dto/create-centre-examen.dto';
import { UpdateCentreExamenDto } from './dto/update-centre-examen.dto';

@Injectable()
export class CentreExamenService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCentreExamenDto) {
    return this.prisma.centreExamen.create({ data: dto });
  }

  async findAll() {
    return this.prisma.centreExamen.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const centre = await this.prisma.centreExamen.findUnique({ where: { id } });
    if (!centre) throw new NotFoundException('Centre non trouvé');
    return centre;
  }

  async update(id: string, dto: UpdateCentreExamenDto) {
    await this.findOne(id);
    return this.prisma.centreExamen.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.centreExamen.delete({ where: { id } });
  }
}
