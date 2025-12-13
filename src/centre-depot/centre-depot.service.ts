import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCentreDepotDto } from './dto/update-centre-depot.dto';
import { CreateCentreDepotDto } from './dto/create-centre-depot.dto';

@Injectable()
export class CentreDepotService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCentreDepotDto) {
    return this.prisma.centreDepot.create({ data: dto });
  }

  async findAll() {
    return this.prisma.centreDepot.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const centre = await this.prisma.centreDepot.findUnique({ where: { id } });
    if (!centre) throw new NotFoundException('Centre non trouvé');
    return centre;
  }

  async update(id: string, dto: UpdateCentreDepotDto) {
    await this.findOne(id);
    return this.prisma.centreDepot.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.centreDepot.delete({ where: { id } });
  }
}
