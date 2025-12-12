import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';

@Injectable()
export class NiveauService {
  constructor(private prisma: PrismaService) {}

  async create(createNiveauDto: CreateNiveauDto) {
    return this.prisma.niveau.create({
      data: createNiveauDto,
    });
  }

  async findAll() {
    return this.prisma.niveau.findMany();
  }

  async findOne(id: string) {
    return this.prisma.niveau.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateNiveauDto: UpdateNiveauDto) {
    return this.prisma.niveau.update({
      where: { id },
      data: updateNiveauDto,
    });
  }

  async remove(id: string) {
    return this.prisma.niveau.delete({
      where: { id },
    });
  }
}
