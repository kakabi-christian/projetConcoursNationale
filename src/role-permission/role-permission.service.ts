import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRolePermissionDto) {
    return this.prisma.rolePermission.create({
      data: {
        roleId: dto.roleId,
        permissionId: dto.permissionId,
      },
    });
  }

  findAll() {
    return this.prisma.rolePermission.findMany({
      include: { role: true, permission: true },
    });
  }

  findByRole(roleId: string) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }

  remove(id: string) {
    return this.prisma.rolePermission.delete({ where: { id } });
  }
}
