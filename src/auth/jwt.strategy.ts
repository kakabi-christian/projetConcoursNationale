import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Stratégie JWT pour valider et décoder les tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extrait le token du header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Ne pas ignorer l'expiration du token
      ignoreExpiration: false,
      
      // Clé secrète pour vérifier la signature du token
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Méthode appelée après validation du token
   * Le payload contient les données encodées dans le JWT
   */
  async validate(payload: any) {
    // payload contient: { sub: userId, email: user.email, iat: ..., exp: ... }
    
    // Recherche l'utilisateur dans la BD avec ses relations
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Si l'utilisateur n'existe pas ou n'est pas vérifié
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Compte non vérifié');
    }

    // Retourne l'utilisateur qui sera attaché à request.user
    return user;
  }
}