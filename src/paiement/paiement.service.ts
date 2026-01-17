// src/paiement/paiement.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CampayService } from '../campay/campay.service'; // 🆕 Importation de Campay
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verifiy-otopdto';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

@Injectable()
export class PaiementService {
  private readonly logger = new Logger(PaiementService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private campayService: CampayService, // 🆕 Injection du service Campay
  ) {}

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 🔹 1. INITIER LE PAIEMENT
   * Crée la ligne en base de données et déclenche le push Campay
   */
  async createPaiement(createPaiementDto: CreatePaiementDto) {
    const concours = await this.prisma.concours.findUnique({
      where: { id: createPaiementDto.concoursId },
    });
    if (!concours) throw new NotFoundException('Concours introuvable');

    // Déclenchement du paiement réel via Campay
    const campayResult = await this.campayService.requestPayment(
      concours.montant || 0,
      createPaiementDto.telephone,
      `Frais Concours: ${concours.intitule}`,
    );

    // Création du paiement avec statut PENDING (On ne crée PAS de reçu ici)
    const paiement = await this.prisma.paiement.create({
      data: {
        ...createPaiementDto,
        montantTotal: concours.montant,
        statut: 'PENDING',
        external_reference: campayResult.externalReference, // 🔑 Lien crucial pour le Webhook
        numeroTransaction: campayResult.campayResponse.reference, 
      },
    });

    return { 
      message: 'Veuillez confirmer le paiement sur votre téléphone',
      externalReference: campayResult.externalReference,
      paiementId: paiement.id 
    };
  }

  /**
   * 🔹 2. GÉNÉRER LE REÇU FINAL
   * Appelé uniquement quand le paiement est SUCCESSFUL
   */
  async generateFinalRecu(externalReference: string) {
    const paiement = await this.prisma.paiement.findFirst({
      where: { external_reference: externalReference },
      include: { concours: true }
    });

    if (!paiement) throw new NotFoundException('Paiement introuvable');

    // Éviter les doublons de reçus
    const existingRecu = await this.prisma.recu.findUnique({
      where: { paiementId: paiement.id }
    });
    if (existingRecu) return existingRecu;

    const numeroRecu = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // QR Code pointant vers l'URL de téléchargement du PDF
    const pdfUrl = `${process.env.BACKEND_URL}/paiement/recu/${paiement.numeroTransaction}/pdf`;
    const qrCodeDataUrl = await QRCode.toDataURL(pdfUrl);

    const recu = await this.prisma.recu.create({
      data: {
        paiementId: paiement.id,
        montant: paiement.montantTotal,
        numeroRecu,
        telephone: paiement.telephone,
        concours: paiement.concours?.intitule || "Concours",
        qrCode: qrCodeDataUrl,
      },
    });

    this.logger.log(`✅ Reçu généré : ${numeroRecu} pour ${externalReference}`);
    return recu;
  }

  /**
   * 🔹 3. RÉCUPÉRER LE REÇU (Pour polling frontend)
   */
  async getRecuByExternalRef(externalReference: string) {
    return await this.prisma.recu.findFirst({
      where: { paiement: { external_reference: externalReference } },
      include: { paiement: true },
    });
  }

  /**
   * 🔹 4. GESTION DU PDF
   */
  generatePdf(recuData: any, res: Response) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=recu-${recuData.paiement.numeroTransaction}.pdf`);

    doc.pipe(res);
    doc.fontSize(20).text('Reçu de Paiement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nom: ${recuData.paiement.nomComplet}`);
    doc.text(`Prénom: ${recuData.paiement.prenom}`);
    doc.text(`Email: ${recuData.paiement.email}`);
    doc.text(`Téléphone: ${recuData.paiement.telephone}`);
    doc.text(`Concours: ${recuData.concours}`);
    doc.text(`Montant: ${recuData.montant} FCFA`);
    doc.text(`Numéro de transaction: ${recuData.paiement.numeroTransaction}`);
    doc.text(`Numéro de reçu: ${recuData.numeroRecu}`);
    
    const dateFormatee = new Date(recuData.createdAt).toLocaleString('fr-FR');
    doc.text(`Date du reçu: ${dateFormatee}`);

    doc.moveDown();
    if (recuData.qrCode) {
      const qrImage = recuData.qrCode.replace(/^data:image\/png;base64,/, '');
      doc.image(Buffer.from(qrImage, 'base64'), { fit: [150, 150], align: 'center' });
    }
    doc.end();
  }

  /**
   * 🔹 5. RÉCUPÉRATION ET VÉRIFICATION (Méthodes existantes)
   */
  async getRecuByTransaction(numeroTransaction: string) {
    return await this.prisma.recu.findFirst({
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
    if (recu.estUtilise) throw new BadRequestException('Reçu déjà utilisé');

    return {
      message: 'Reçu valide',
      numeroRecu: recu.numeroRecu,
      paiement: {
        nomComplet: recu.paiement?.nomComplet,
        prenom: recu.paiement?.prenom,
        email: recu.paiement?.email,
        telephone: recu.paiement?.telephone,
        concours: recu.paiement?.concours?.intitule,
        montant: recu.montant,
      },
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;
    const recu = await this.prisma.recu.findFirst({ where: { paiement: { email } } });
    if (!recu) throw new NotFoundException('Aucun reçu trouvé');

    await this.prisma.otp.deleteMany({ where: { email, isUsed: false } });
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.otp.create({ data: { email, code, expiresAt } });
    await this.emailService.sendOtpEmail(email, code);
    return { message: 'OTP envoyé', email };
  }

  async verifyOtpAndGetRecu(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;
    const otp = await this.prisma.otp.findFirst({
      where: { email, code, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || new Date() > otp.expiresAt) throw new BadRequestException('OTP invalide');

    await this.prisma.otp.update({ where: { id: otp.id }, data: { isUsed: true } });
    return await this.prisma.recu.findFirst({
      where: { paiement: { email } },
      include: { paiement: true },
    });
  }

  async getPaiementInfoByRecu(numeroRecu: string) {
    const recu = await this.prisma.recu.findUnique({
      where: { numeroRecu },
      include: { paiement: { include: { concours: true } } },
    });
    if (!recu) throw new NotFoundException('Reçu introuvable');
    return {
      nom: recu.paiement?.nomComplet,
      prenom: recu.paiement?.prenom,
      email: recu.paiement?.email,
      telephone: recu.paiement?.telephone,
      concours: recu.paiement?.concours?.intitule,
      montant: recu.montant,
    };
  }
}