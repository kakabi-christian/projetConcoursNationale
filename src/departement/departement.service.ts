import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Injectable()
export class DepartementService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDepartementDto) {
    return this.prisma.departement.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.departement.findMany();
  }

  findOne(id: string) {
    return this.prisma.departement.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDepartementDto) {
    return this.prisma.departement.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.departement.delete({
      where: { id },
    });
  }
}
