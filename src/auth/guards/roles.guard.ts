import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard pour vérifier les rôles requis
 * S'exécute après JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupère les rôles requis depuis le décorateur @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun rôle n'est requis, on autorise l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupère l'utilisateur de la requête (ajouté par JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifie si l'utilisateur existe
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérifie si l'utilisateur a les rôles requis
    const userRoles = user.roles || [];
    
    // Extrait les noms des rôles depuis la relation
    const userRoleNames = userRoles.map((ur: any) => ur.role?.name || ur.name);

    // Vérifie si au moins un rôle correspond
    const hasRole = requiredRoles.some((role) =>
      userRoleNames.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé. Rôles requis: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}