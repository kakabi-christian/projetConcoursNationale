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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Role } from '@prisma/client';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class AuthService {
  private otpCache = new Map<string, { otp: string; expiration: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ✅ Génère un OTP à 6 chiffres
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ✅ Hash du mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
  // ==================== REGISTER ADMIN ====================
  async registerAdmin(dto: RegisterAdminDto) {
    const { email, password, nom, prenom, telephone, region, departementId, roleId } = dto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Cet email existe déjà.');

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(password);

    // Créer le User avec isVerified = true
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        region,
        userType: 'ADMIN',
        isVerified: true, // automatique pour admin
      },
    });

    // Créer l'Admin lié
    const admin = await this.prisma.admin.create({
      data: {
        userId: user.id,
        departementId,
      },
    });

    // Assigner le rôle si fourni
    if (roleId) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId,
        },
      });
    }
    return { message: 'Admin créé avec succès', user, admin };
  }

async login(loginDto: LoginDto, userType: 'ADMIN' | 'CANDIDATE') {
  // 1. Récupérer l'utilisateur avec ses rôles et permissions
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

  // 2. Vérifier le type d'utilisateur
  if (user.userType !== userType) {
    throw new UnauthorizedException(`Utilisateur n'est pas un ${userType.toLowerCase()}.`);
  }

  // 3. Vérifier le mot de passe (pour les admins)
  if (userType === 'ADMIN') {
    const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatching) throw new UnauthorizedException('Mot de passe incorrect.');
  }

  // 4. Vérifier si le compte est activé
  if (!user.isVerified) throw new UnauthorizedException('Compte non vérifié.');

  // 5. Extraire toutes les permissions de tous les rôles
  const permissions =
    user.roles?.flatMap((userRole) =>
      userRole.role.permissions.map((p) => p.permission.name),
    ) || [];

  // 6. Construire le payload JWT
  const payload: any = {
    sub: user.id,
    email: user.email,
    userType: user.userType,
    permissions,
  };

  // Ajouter info département pour les admins
  if (userType === 'ADMIN' && user.admin?.departement) {
    payload.departement = user.admin.departement.nomDep;
  }

  // 7. Générer le token JWT
  const access_token = await this.jwtService.signAsync(payload);

  return { access_token, permissions, user };
}

  // ✅ Enregistrement d’un utilisateur + création wallet chiffré
// async register(registerDto: RegisterDto) {
//   const { firstName, lastName, email, phone, password } = registerDto;

//   // Vérifier si l'utilisateur existe déjà
//   const existingUser = await this.prisma.user.findUnique({ where: { email } });
//   if (existingUser) throw new ConflictException('Email already exists.');

//   // Hash du mot de passe
//   const hashedPassword = await this.hashCredentials(password);

//   // Génération de l’OTP
//   const otp = this.generateOtp();
//   const expiration = new Date();
//   expiration.setMinutes(expiration.getMinutes() + 10);
//   this.otpCache.set(email, { otp, expiration });

//   // ✅ Création de l'utilisateur
  

//   // ---------------- Notification bienvenue ----------------
  

//   // ✅ Envoi de l’email de vérification
//   await this.emailService.sendVerificationEmail(email, otp);

//   return { message: 'User created successfully. Check your email for the OTP.' };
// }


  // ✅ Vérification de l’OTP
 // ✅ Vérification de l’OTP
async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string; redirect: string }> {
  const { email, otp } = verifyOtpDto;

  const storedOtp = this.otpCache.get(email);
  if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiration < new Date()) {
    throw new BadRequestException('Invalid or expired OTP.');
  }

  await this.prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  this.otpCache.delete(email);

  return { message: 'Account verified successfully!', redirect: '/login' };
}


  // ✅ Réenvoi d’un OTP
  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found.');

    const otp = this.generateOtp();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    this.otpCache.set(email, { otp, expiration });

    await this.emailService.resendVerificationEmail(email, otp);
    return { message: 'OTP resent successfully.' };
  }
}