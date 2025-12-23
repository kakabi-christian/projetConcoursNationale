// src/common/guards/user-type.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import { USER_TYPES_KEY } from '../decorators/user-types.decorator';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Récupérer les types autorisés via le décorateur
    const requiredTypes = this.reflector.getAllAndOverride<UserType[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun type n'est spécifié, on laisse passer (ou on bloque par défaut selon ton choix)
    if (!requiredTypes) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    // 2. Vérifier si le userType de l'utilisateur est dans la liste autorisée
    const hasType = requiredTypes.includes(user.userType);

    if (!hasType) {
      throw new ForbiddenException(
        `Accès restreint aux types : ${requiredTypes.join(', ')}`,
      );
    }

    return true;
  }
}