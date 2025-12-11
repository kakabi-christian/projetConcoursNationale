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
import { CryptoService } from '../crypto/crypto.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private otpCache = new Map<string, { otp: string; expiration: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly cryptoService: CryptoService,
  ) {}

  // ✅ Génère un OTP à 6 chiffres
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ✅ Hash du mot de passe
  private async hashCredentials(credentials: string): Promise<string> {
    return bcrypt.hash(credentials, 10);
  }

  // ✅ Enregistrement d’un utilisateur + création wallet chiffré
async register(registerDto: RegisterDto) {
  const { firstName, lastName, email, phone, password } = registerDto;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await this.prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ConflictException('Email already exists.');

  // Hash du mot de passe
  const hashedPassword = await this.hashCredentials(password);

  // Génération de l’OTP
  const otp = this.generateOtp();
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 10);
  this.otpCache.set(email, { otp, expiration });

  // ✅ Création de l'utilisateur
  const user = await this.prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      passwordHash: hashedPassword,
      isVerified: false,
    },
  });

  // ---------------- Point initial à 0 ----------------
  const point = await this.prisma.point.create({
    data: {
      userId: user.id,
      value: 0,
    },
  });

  // ---------------- Ranking initial dans la division avec order = 1 ----------------
  const initialDivision = await this.prisma.division.findFirst({
    where: { order: 1 },
  });
  if (!initialDivision) throw new NotFoundException('Initial division not found');

  await this.prisma.ranking.create({
    data: {
      userId: user.id,
      pointId: point.id,
      divisionId: initialDivision.id,
      rank: 1,
      periodStart: new Date(),
      periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  // ---------------- Notification bienvenue ----------------
  await this.prisma.notification.create({
    data: {
      userId: user.id,
      type: 'Welcome',
      message: `Bienvenue ${firstName} ! Votre compte KmerLinguo a été créé avec succès profitez-en pour apprendre ta langue maternelle.`,
      isRead: false,
      isBroadcast: false,
      sentAt: new Date(),
    },
  });

  // ✅ Envoi de l’email de vérification
  await this.emailService.sendVerificationEmail(email, otp);

  return { message: 'User created successfully. Check your email for the OTP.' };
}


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

  // ✅ Connexion de l'utilisateur
async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  const user = await this.prisma.user.findUnique({
    where: { email },
    include: {
      preferences: {
        include: { targetLanguage: true }
      }
    }
  });

  if (!user) throw new UnauthorizedException('Mot de passe invalide.');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedException('Mot de passe invalide.');

  if (!user.isVerified)
    throw new BadRequestException('Veuillez vérifier votre compte avant de vous connecter.');

  // 🔹 Récupération de la langue de l’utilisateur
  const pref = user.preferences?.[0]; // première préférence si elle existe
  const lang = pref?.targetLanguage
    ? {
        id: pref.targetLanguage.id,
        name: pref.targetLanguage.name,
        code: pref.targetLanguage.languageCode,
      }
    : null;

  // 🔹 Payload du token avec la langue
  const payload = { 
    sub: user.id, 
    email: user.email, 
    role: user.role,
    languageId: lang?.id,       // id de la langue
    languageCode: lang?.code,   // code de la langue
  };
  const token = await this.jwtService.signAsync(payload);

  return {
    access_token: token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: lang, // pour affichage côté Flutter
    }
  };
}


}
