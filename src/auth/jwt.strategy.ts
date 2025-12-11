import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Lire le chemin de la clé publique défini dans .env
    const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');
    if (!publicKeyPath) {
      throw new Error(
        'JWT_PUBLIC_KEY_PATH is missing in environment variables.',
      );
    }

    // Charger la clé publique depuis le fichier
    const publicKey = readFileSync(join(process.cwd(), publicKeyPath), 'utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: publicKey,
    });
  }

  async validate(payload: any) {
    // Vérifier que la langue est bien présente dans le token
    if (!payload.languageId) {
      throw new UnauthorizedException(
        'User language not found in the token payload',
      );
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Récupérer la langue associée
    const language = await this.prisma.language.findUnique({
      where: { id: payload.languageId },
    });

    if (!language) {
      throw new UnauthorizedException(
        'Language linked to this user was not found in database',
      );
    }

    // 🔥 Ce qui est retourné ici sera accessible via req.user
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      languageId: language.id, // 🔹 ajouté


      language: {
        id: language.id,
        name: language.name,
        code: language.languageCode,
      },
    };
  }
}
