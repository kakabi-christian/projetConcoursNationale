import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: dto,
    });
  }

  // --- AJOUT DE LA PAGINATION ---
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' }, // Tri par nom pour s'y retrouver plus facilement
      }),
      this.prisma.permission.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  // ------------------------------

  findOne(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  update(id: string, dto: UpdatePermissionDto) {
    return this.prisma.permission.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}