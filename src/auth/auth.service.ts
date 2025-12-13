// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Hash du mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ==================== REGISTER ADMIN ====================
  async registerAdmin(dto: RegisterAdminDto) {
    const { email, password, nom, prenom, telephone, region, departementId, roleId } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Cet email existe déjà.');

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        region,
        userType: 'ADMIN',
        isVerified: true,
      },
    });

    const admin = await this.prisma.admin.create({
      data: {
        userId: user.id,
        departementId,
      },
    });

    if (roleId) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId },
      });
    }

    return { message: 'Admin créé avec succès', user, admin };
  }

  // ==================== REGISTER CANDIDATE STEP 1 ====================
  async registerCandidateStep1(dto: CreateUserStep1Dto) {
    const { nom, prenom, email, telephone, region } = dto;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Cet email existe déjà.');

    // Créer l'utilisateur sans lier le reçu (déjà validé à l'étape précédente)
    const user = await this.prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        region,
        userType: 'CANDIDATE',
        isVerified: true,
      },
    });

    return { message: 'Inscription étape 1 réussie', user };
  }

  // ==================== LOGIN ====================
  async login(loginDto: LoginDto, userType: 'ADMIN' | 'CANDIDATE') {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
        admin: { include: { departement: true } },
      },
    });

    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect.');
    if (user.userType !== userType) {
      throw new UnauthorizedException(`Utilisateur n'est pas un ${userType.toLowerCase()}.`);
    }

    if (userType === 'ADMIN') {
      const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordMatching) throw new UnauthorizedException('Mot de passe incorrect.');
    }

    if (!user.isVerified) throw new UnauthorizedException('Compte non vérifié.');

    const permissions =
      user.roles?.flatMap((userRole) =>
        userRole.role.permissions.map((p) => p.permission.name),
      ) || [];

    const payload: any = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      permissions,
    };

    if (userType === 'ADMIN' && user.admin?.departement) {
      payload.departement = user.admin.departement.nomDep;
    }

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, permissions, user };
  }
}
