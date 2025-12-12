import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur personnalisé pour extraire l'utilisateur authentifié de la requête
 * Usage: @GetUser() user: User
 * Usage avec champ spécifique: @GetUser('email') email: string
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si un champ spécifique est demandé (ex: @GetUser('email'))
    if (data) {
      return user?.[data];
    }

    // Sinon retourne l'objet user complet
    return user;
  },
);