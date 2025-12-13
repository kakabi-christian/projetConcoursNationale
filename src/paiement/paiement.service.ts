// src/paiement/paiement.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import * as QRCode from 'qrcode';
import { VerifyOtpDto } from './dto/verifiy-otopdto';

@Injectable()
export class PaiementService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `TX-${year}${month}${day}-${hours}${minutes}`;
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createPaiement(createPaiementDto: CreatePaiementDto) {
    const concours = await this.prisma.concours.findUnique({
      where: { id: createPaiementDto.concoursId },
    });
    if (!concours) throw new NotFoundException('Concours introuvable');

    const numeroTransaction = this.generateTransactionNumber();

    const paiement = await this.prisma.paiement.create({
      data: {
        ...createPaiementDto,
        montantTotal: concours.montant,
        statut: 'PENDING',
        numeroTransaction,
      },
    });

    const numeroRecu = `REC-${Math.floor(Math.random() * 1000000)}`;

    const qrContent = JSON.stringify({
      nomComplet: createPaiementDto.nomComplet,
      email: createPaiementDto.email,
      telephone: createPaiementDto.telephone,
      numeroTransaction,
      numeroRecu,
      concours: concours.intitule,
      montant: concours.montant,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrContent);

    const recu = await this.prisma.recu.create({
      data: {
        paiementId: paiement.id,
        montant: concours.montant,
        numeroRecu,
        telephone: createPaiementDto.telephone,
        concours: concours.intitule,
        qrCode: qrCodeDataUrl,
      },
    });

    return { paiement, recu };
  }

  // 🔐 ÉTAPE 1 : Demander un OTP
  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    // Vérifier si un reçu existe pour cet email
    const recu = await this.prisma.recu.findFirst({
      where: {
        paiement: { email },
      },
    });

    if (!recu) {
      throw new NotFoundException('Aucun reçu trouvé pour cet email');
    }

    // Supprimer les anciens OTP non utilisés pour cet email
    await this.prisma.otp.deleteMany({
      where: {
        email,
        isUsed: false,
      },
    });

    // Générer un nouveau code OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Enregistrer l'OTP dans la BD
    await this.prisma.otp.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Envoyer l'OTP par email
    await this.emailService.sendOtpEmail(email, code);

    return {
      message: 'Code de vérification envoyé à votre email',
      email,
    };
  }

  // 🔐 ÉTAPE 2 : Vérifier l'OTP et retourner le reçu
  async verifyOtpAndGetRecu(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;

    // Trouver l'OTP correspondant
    const otp = await this.prisma.otp.findFirst({
      where: {
        email,
        code,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new BadRequestException('Code OTP invalide');
    }

    // Vérifier si le code a expiré
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Code OTP expiré. Veuillez en demander un nouveau.');
    }

    // Marquer l'OTP comme utilisé
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Récupérer le reçu
    const recu = await this.prisma.recu.findFirst({
      where: {
        paiement: { email },
      },
      include: {
        paiement: true,
      },
    });

    if (!recu) {
      throw new NotFoundException('Aucun reçu trouvé');
    }

    return recu;
  }
}