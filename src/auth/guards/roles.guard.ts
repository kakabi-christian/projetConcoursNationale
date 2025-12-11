import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestWithUser } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ✅ ÉTAPE 1 : Vérifier si la route est publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      console.log('✅ Route publique détectée dans RolesGuard');
      return true; // Laisser passer sans vérifier les rôles
    }

    // ✅ ÉTAPE 2 : Récupérer les rôles requis depuis @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // ✅ ÉTAPE 3 : Si pas de rôles requis, laisser passer
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // ✅ ÉTAPE 4 : Vérifier si l'utilisateur a le bon rôle
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      console.error('❌ Aucun utilisateur trouvé dans la requête');
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      console.error(
        `❌ Accès refusé pour ${user.email} (rôle: ${user.role}). Rôles requis: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    console.log(`✅ Accès autorisé pour ${user.email} (rôle: ${user.role})`);
    return true;
  }
}