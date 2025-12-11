import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../jwt/jwt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '@prisma/client'; // enum Role { USER, ADMIN }

// ✅ Type pour Request avec user
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    language?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

// ✅ Type pour payload JWT
interface JwtPayload {
  sub: string; // UUID
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ✅ Type pour user incluant la relation language
type UserWithLanguage = {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  language?: {
    id: string;
    name: string;
    code: string;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    // 🔹 Vérifier si la route est publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      console.log('✅ Route publique détectée :', req.url);
      return true;
    }

    // 🔹 Vérifier si le token est présent
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;

    try {
      // 🔹 Vérifier et décoder le token JWT
      payload = this.jwtService.verifyAccessToken(token) as JwtPayload;
    } catch (err) {
      console.error('JWT verification failed', err);
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // 🔹 Vérifier si l'utilisateur existe dans la base avec sa langue
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { language: true }, // ✅ Relation Language incluse
    });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Utilisateur non trouvé ou non vérifié');
    }

    // 🔹 Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language
        ? {
            id: user.language.id,
            name: user.language.name,
            code: user.language.languageCode, // attention au nom du champ dans Language
          }
        : undefined,
    };

    return true;
  }
}
