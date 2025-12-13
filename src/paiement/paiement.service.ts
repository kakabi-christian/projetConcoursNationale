// src/paiement/paiement.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verifiy-otopdto';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

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

  // Création du paiement avec QR code pointant vers le PDF
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
    const dateRecu = new Date(); // <-- Date du reçu

    // Générer QR code qui contient l'URL vers le PDF
    const pdfUrl = `${process.env.BACKEND_URL}/paiement/recu/${numeroTransaction}/pdf`;
    const qrCodeDataUrl = await QRCode.toDataURL(pdfUrl);

    const recu = await this.prisma.recu.create({
      data: {
        paiementId: paiement.id,
        montant: concours.montant,
        numeroRecu,
        telephone: createPaiementDto.telephone,
        concours: concours.intitule,
        qrCode: qrCodeDataUrl,
        createdAt: dateRecu, // <-- stocker la date du reçu
      },
    });

    return { paiement, recu };
  }

  // 🔐 Demander un OTP
  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    const recu = await this.prisma.recu.findFirst({
      where: { paiement: { email } },
    });

    if (!recu) throw new NotFoundException('Aucun reçu trouvé pour cet email');

    await this.prisma.otp.deleteMany({
      where: { email, isUsed: false },
    });

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.create({ data: { email, code, expiresAt } });

    await this.emailService.sendOtpEmail(email, code);

    return { message: 'Code de vérification envoyé à votre email', email };
  }

  // 🔐 Vérifier OTP et récupérer le reçu
  async verifyOtpAndGetRecu(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;

    const otp = await this.prisma.otp.findFirst({
      where: { email, code, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Code OTP invalide');
    if (new Date() > otp.expiresAt) throw new BadRequestException('Code OTP expiré');

    await this.prisma.otp.update({ where: { id: otp.id }, data: { isUsed: true } });

    const recu = await this.prisma.recu.findFirst({
      where: { paiement: { email } },
      include: { paiement: true },
    });

    if (!recu) throw new NotFoundException('Aucun reçu trouvé');

    return recu;
  }

  // 📄 Récupérer le reçu par numéro de transaction
  async getRecuByTransaction(numeroTransaction: string) {
    const recu = await this.prisma.recu.findFirst({
      where: { paiement: { numeroTransaction } },
      include: { paiement: true },
    });
    return recu;
  }

  // 📄 Générer PDF et l’envoyer via la réponse HTTP
  generatePdf(recuData: any, res: Response) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=recu-${recuData.paiement.numeroTransaction}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Reçu de Paiement', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Nom: ${recuData.paiement.nomComplet}`);
    doc.text(`Email: ${recuData.paiement.email}`);
    doc.text(`Téléphone: ${recuData.paiement.telephone}`);
    doc.text(`Concours: ${recuData.concours}`);
    doc.text(`Montant: ${recuData.montant} FCFA`);
    doc.text(`Numéro de transaction: ${recuData.paiement.numeroTransaction}`);
    doc.text(`Numéro de reçu: ${recuData.numeroRecu}`);

    // Ajouter la date du reçu
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    const dateFormatee = new Date(recuData.createdAt).toLocaleString('fr-FR', dateOptions);
    doc.text(`Date du reçu: ${dateFormatee}`);

    doc.moveDown();

    // Ajouter QR code existant si présent
    if (recuData.qrCode) {
      const qrImage = recuData.qrCode.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(qrImage, 'base64');
      doc.image(buffer, { fit: [150, 150], align: 'center' });
    }

    doc.end();
  }
  async verifyRecuForRegistration(numeroRecu: string) {
    // Chercher le reçu
    const recu = await this.prisma.recu.findUnique({
      where: { numeroRecu },
      include: {
        paiement: {
          include: {
            concours: true,
          },
        },
      },
    });

    // Vérifier si le reçu existe
    if (!recu) {
      throw new NotFoundException('Numéro de reçu invalide');
    }

    // Vérifier si le reçu n'a pas déjà été utilisé
    if (recu.estUtilise) {
      throw new BadRequestException('Ce reçu a déjà été utilisé pour une inscription');
    }

    // Retourner les infos du reçu + paiement (pour pré-remplir le formulaire)
    return {
    message: 'Reçu valide',
      numeroRecu: recu.numeroRecu,
      paiement: {
        nomComplet: recu.paiement?.nomComplet ?? 'N/A',
        email: recu.paiement?.email ?? 'N/A',
        telephone: recu.paiement?.telephone ?? 'N/A',
        concours: recu.paiement?.concours?.intitule ?? recu.concours,
        montant: recu.montant,
      },
    }
  }
}
