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
import * as path from 'path';
import * as fs from 'fs';

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
    const dateRecu = new Date();

    // Le QR Code pointe toujours vers cette URL Ngrok
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
        createdAt: dateRecu,
      },
    });

    return { paiement, recu };
  }

  // --- LOGIQUE PDF DYNAMIQUE (PHOTO + CNI SI VALIDÉ) ---
  async generatePdf(recuData: any, res: Response) {
    // 1. Chercher si un dossier validé existe pour cet utilisateur
    const dossier = await this.prisma.dossier.findFirst({
      where: { 
        candidate: { 
          user: { email: recuData.paiement.email } 
        } 
      },
      include: { 
        candidate: { 
          include: { user: true } 
        } 
      }
    });

    const isValidated = dossier?.statut === 'VALIDATED';
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    const prefix = isValidated ? 'ADMISSION' : 'RECU';
    res.setHeader('Content-Disposition', `inline; filename=${prefix}-${recuData.paiement.numeroTransaction}.pdf`);

    doc.pipe(res);

    // --- ENTÊTE ---
    if (isValidated) {
      doc.fillColor('#1a5a96').fontSize(22).text('CARTE D\'ADMISSION AU CONCOURS', { align: 'center' });
      doc.fontSize(10).fillColor('green').text('DOSSIER VÉRIFIÉ ET ADMISSIBLE', { align: 'center' });
    } else {
      doc.fontSize(20).fillColor('black').text('REÇU DE PAIEMENT', { align: 'center' });
      doc.fontSize(10).fillColor('orange').text('INSCRIPTION EN COURS DE TRAITEMENT', { align: 'center' });
    }

    doc.moveDown();
    doc.strokeColor('#eeeeee').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- INSERTION PHOTO DE PROFIL (Si validé) ---
    if (isValidated && dossier.photoProfil) {
      try {
        const photoPath = path.join(process.cwd(), dossier.photoProfil);
        if (fs.existsSync(photoPath)) {
          doc.image(photoPath, 430, 120, { width: 110, height: 130 });
          doc.rect(430, 120, 110, 130).stroke(); // Cadre
        }
      } catch (e) {
        console.error("Erreur insertion photo PDF:", e);
      }
    }

    // --- INFORMATIONS DU CANDIDAT ---
    doc.fillColor('black').fontSize(12);
    doc.text(`Nom: ${recuData.paiement.nomComplet.toUpperCase()}`, 50, 130);
    doc.text(`Prénom: ${recuData.paiement.prenom || recuData.paiement.Prenom}`);
    doc.text(`Email: ${recuData.paiement.email}`);
    doc.text(`Téléphone: ${recuData.paiement.telephone}`);
    doc.moveDown();
    doc.fontSize(14).text(`CONCOURS: ${recuData.concours}`, { bold: true });
    
    if (isValidated) {
      doc.fillColor('#1a5a96').text(`MATRICULE: ${dossier.candidate.matricule || 'N/A'}`);
    }

    doc.moveDown(2);
    doc.fillColor('black').fontSize(10).text(`Numéro de transaction: ${recuData.paiement.numeroTransaction}`);
    doc.text(`Numéro de reçu: ${recuData.numeroRecu}`);

    const dateFormatee = new Date(recuData.createdAt).toLocaleString('fr-FR');
    doc.text(`Date du paiement: ${dateFormatee}`);

    // --- INSERTION CNI (Si validé - en bas de page) ---
    if (isValidated && dossier.photoCni) {
      doc.moveDown(4);
      doc.fontSize(12).text('PIÈCE D\'IDENTITÉ (CNI) :', { underline: true });
      doc.moveDown();
      try {
        const cniPath = path.join(process.cwd(), dossier.photoCni);
        if (fs.existsSync(cniPath)) {
          doc.image(cniPath, { fit: [300, 200] });
        }
      } catch (e) {
        doc.text("[Image CNI non disponible]");
      }
    }

    // --- QR CODE (Bas de page) ---
    if (recuData.qrCode) {
      const qrImage = recuData.qrCode.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(qrImage, 'base64');
      doc.image(buffer, 460, 720, { width: 80 });
      doc.fontSize(8).text("Authenticité garantie", 455, 805);
    }

    doc.end();
  }

  // --- AUTRES MÉTHODES (Gardées telles quelles) ---

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;
    const recu = await this.prisma.recu.findFirst({ where: { paiement: { email } } });
    if (!recu) throw new NotFoundException('Aucun reçu trouvé pour cet email');
    await this.prisma.otp.deleteMany({ where: { email, isUsed: false } });
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.otp.create({ data: { email, code, expiresAt } });
    await this.emailService.sendOtpEmail(email, code);
    return { message: 'Code de vérification envoyé à votre email', email };
  }

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

  async getRecuByTransaction(numeroTransaction: string) {
    return this.prisma.recu.findFirst({
      where: { paiement: { numeroTransaction } },
      include: { paiement: true },
    });
  }

  async verifyRecuForRegistration(numeroRecu: string) {
    const recu = await this.prisma.recu.findUnique({
      where: { numeroRecu },
      include: { paiement: { include: { concours: true } } },
    });
    if (!recu) throw new NotFoundException('Numéro de reçu invalide');
    if (recu.estUtilise) throw new BadRequestException('Ce reçu a déjà été utilisé');
    return {
      message: 'Reçu valide',
      numeroRecu: recu.numeroRecu,
      paiement: {
        nomComplet: recu.paiement?.nomComplet ?? 'N/A',
        prenom: recu.paiement?.prenom ?? 'N/A',
        email: recu.paiement?.email ?? 'N/A',
        telephone: recu.paiement?.telephone ?? 'N/A',
        concours: recu.paiement?.concours?.intitule ?? recu.concours,
        montant: recu.montant,
      },
    };
  }

  async getPaiementInfoByRecu(numeroRecu: string) {
    const recu = await this.prisma.recu.findUnique({
      where: { numeroRecu },
      include: { paiement: { include: { concours: true } } },
    });
    if (!recu) throw new NotFoundException('Reçu introuvable');
    return {
      nom: recu.paiement?.nomComplet ?? '',
      prenom: recu.paiement?.prenom ?? '',
      email: recu.paiement?.email ?? '',
      telephone: recu.paiement?.telephone ?? '',
      concours: recu.paiement?.concours?.intitule ?? '',
      montant: recu.montant,
    };
  }
}