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
    
    // LOG AU DÉMARRAGE : Vérifie si la clé secrète est bien chargée
    console.log('--- INITIALISATION JWT STRATEGY ---');
    console.log('JWT_SECRET chargé :', secret ? 'OUI (masqué pour sécurité)' : 'NON (ATTENTION : Valeur par défaut utilisée)');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('\n=== NOUVELLE TENTATIVE DE VALIDATION JWT ===');
    console.log('1. Payload extrait du token :', JSON.stringify(payload, null, 2));

    // Vérification de la présence du sub (ID utilisateur)
    if (!payload.sub) {
      this.logger.error('Le payload ne contient pas de "sub" (ID utilisateur)');
      throw new UnauthorizedException('Token mal formé (sub manquant)');
    }

    // Tentative de récupération en base de données
    console.log(`2. Recherche de l'utilisateur ID: ${payload.sub} en base de données...`);
    
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

    // Étape 3 : Vérification de l'existence
    if (!user) {
      console.log('❌ ÉCHEC : Utilisateur introuvable dans PostgreSQL');
      throw new UnauthorizedException('Utilisateur introuvable dans la base de données');
    }
    console.log('✅ SUCCÈS : Utilisateur trouvé :', user.email);

    // Étape 4 : Vérification du statut de vérification
    console.log('3. Vérification du statut "isVerified" :', user.isVerified);
    if (!user.isVerified) {
      console.log('❌ ÉCHEC : Le compte utilisateur n\'est pas vérifié');
      throw new UnauthorizedException('Compte non vérifié');
    }

    // Étape 5 : Log des permissions chargées (utile pour le PermissionsGuard)
    const permissions = user.roles.flatMap(r => 
      r.role.permissions.map(p => p.permission.name)
    );
    console.log('4. Permissions détectées pour cet appel :', permissions);

    console.log('=== VALIDATION RÉUSSIE : Accès autorisé ===\n');
    return user;
  }
}