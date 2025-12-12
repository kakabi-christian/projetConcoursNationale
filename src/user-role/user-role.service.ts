import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UserRoleService {
  constructor(private prisma: PrismaService) {}

  // Ajouter un rôle à un utilisateur
  create(dto: CreateUserRoleDto) {
    return this.prisma.userRole.create({
      data: {
        userId: dto.userId,
        roleId: dto.roleId,
      },
    });
  }

  // Lister tous les rôles d'un utilisateur
  findByUser(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  // Lister tous les utilisateurs d'un rôle
  findByRole(roleId: string) {
    return this.prisma.userRole.findMany({
      where: { roleId },
      include: { user: true },
    });
  }

  // Supprimer un rôle d'un utilisateur
  remove(id: string) {
    return this.prisma.userRole.delete({ where: { id } });
  }
}
