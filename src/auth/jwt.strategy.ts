import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    console.log('--- INITIALISATION JWT STRATEGY ---');
    console.log('JWT_SECRET chargé :', secret ? 'OUI' : 'NON (Valeur par défaut utilisée)');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('\n=== NOUVELLE TENTATIVE DE VALIDATION JWT ===');
    
    if (!payload.sub) {
      this.logger.error('Le payload ne contient pas de "sub" (ID utilisateur)');
      throw new UnauthorizedException('Token mal formé (sub manquant)');
    }

    // 1. Recherche de l'utilisateur avec inclusion du profil Candidate et des Roles/Permissions
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        candidate: true, // 👈 INDISPENSABLE pour récupérer le candidateId
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

    if (!user) {
      console.log('❌ ÉCHEC : Utilisateur introuvable dans PostgreSQL');
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.isVerified) {
      console.log('❌ ÉCHEC : Le compte utilisateur n\'est pas vérifié');
      throw new UnauthorizedException('Compte non vérifié');
    }

    // 2. Extraction des noms de permissions à plat
    const permissions = user.roles.flatMap(r => 
      r.role.permissions.map(p => p.permission.name)
    );

    console.log('✅ SUCCÈS : Validation réussie pour', user.email);
    console.log('Permissions détectées :', permissions);
    if (user.candidate) console.log('Profil Candidat détecté ID:', user.candidate.id);

    // 3. Retour de l'objet utilisateur enrichi
    // Cet objet sera disponible dans vos contrôleurs via @Req() req.user
    return {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      permissions: permissions,
      candidateId: user.candidate?.id || null, // 👈 Sera utilisé par ArchiveController
    };
  }
}