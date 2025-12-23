import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: dto,
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // On récupère les données et le compte total en parallèle
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Optionnel: pour voir les plus récents en premier
        include: {
          _count: {
            select: { permissions: true, users: true }
          }
        }
      }),
      this.prisma.role.count(),
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

  findOne(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
  async assignPermissions(roleId: string, permissionIds: string[]) {
    // On utilise une transaction pour nettoyer les anciennes permissions 
    // et ajouter les nouvelles (synchronisation)
    return this.prisma.$transaction(async (tx) => {
      // 1. Supprimer les anciennes liaisons
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Créer les nouvelles liaisons
      const data = permissionIds.map((pId) => ({
        roleId,
        permissionId: pId,
      }));

      return tx.rolePermission.createMany({
        data,
      });
    });
  }
  async findOneWithPermissions(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }
  
}
