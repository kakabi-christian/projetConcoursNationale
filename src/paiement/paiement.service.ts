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
import axios from 'axios';

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
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    
    return `TX-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
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

    try {
      console.log(`[NotchPay] Initialisation : ${numeroTransaction}`);
      
      const response = await axios.post(
        'https://api.notchpay.co/payments/initialize',
        {
          amount: concours.montant,
          currency: 'XAF',
          customer: {
            email: createPaiementDto.email,
            name: `${createPaiementDto.nomComplet} ${createPaiementDto.prenom}`,
            phone: createPaiementDto.telephone,
          },
          description: `Paiement pour le concours : ${concours.intitule}`,
          callback: `${process.env.BACKEND_URL}/paiement/callback`, 
          reference: numeroTransaction,
          item_reference: numeroTransaction, 
        },
        {
          headers: {
            Authorization: process.env.NOTCHPAY_PUBLIC_KEY,
            'Accept': 'application/json',
          },
        }
      );

      const paiement = await this.prisma.paiement.create({
        data: {
          ...createPaiementDto,
          montantTotal: concours.montant,
          statut: 'PENDING',
          numeroTransaction,
        },
      });

      return { 
        paiement, 
        authorization_url: response.data.authorization_url 
      };

    } catch (error) {
      console.error("Erreur NotchPay Init :", error.response?.data || error.message);
      throw new BadRequestException(`NotchPay Error: ${error.response?.data?.message || "Erreur service de paiement"}`);
    }
  }

async finalizePaiement(reference: string) {
  console.log(`[Finalize] Vérification référence : ${reference}`);

  // 1. Recherche par notre référence interne "TX-..."
  let paiement = await this.prisma.paiement.findFirst({
    where: { numeroTransaction: reference },
    include: { concours: true },
  });

  // 2. SÉCURITÉ : Si non trouvé (on a reçu trx...), on interroge l'API NotchPay
  if (!paiement && reference.startsWith('trx.')) {
    try {
      console.log(`[NotchPay] Appel API secours pour ${reference}...`);
      
      const secretKey = process.env.NOTCHPAY_SECRET_KEY?.trim();
      if (!secretKey) throw new Error("Clé secrète manquante");

      const notchRes = await axios.get(`https://api.notchpay.co/payments/${reference}`, {
        headers: { 
          // Utilisation de la clé directe (souvent sans Bearer pour NotchPay GET)
          'Authorization': secretKey, 
          'Accept': 'application/json',
          'NOTCH-API-KEY': secretKey // Header alternatif parfois requis
        }
      });
      
      const maRefClient = notchRes.data.payment.item_reference;
      console.log(`[NotchPay] Référence client récupérée : ${maRefClient}`);

      paiement = await this.prisma.paiement.findFirst({
        where: { numeroTransaction: maRefClient },
        include: { concours: true },
      });
    } catch (e) {
      console.error(`[NotchPay] Échec API secours (401?) :`, e.response?.data || e.message);
    }
  }

  if (!paiement) {
    console.error(`[NotchPay] Transaction ${reference} introuvable en base.`);
    return;
  }

  if (paiement.statut === 'SUCCESS') {
    console.log(`[NotchPay] Déjà traité : ${paiement.numeroTransaction}`);
    return;
  }

  // 3. Mise à jour et génération du reçu
  try {
    const updatedPaiement = await this.prisma.paiement.update({
      where: { id: paiement.id },
      data: { statut: 'SUCCESS' },
    });

    const numeroRecu = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pdfUrl = `${process.env.BACKEND_URL}/paiement/recu/${updatedPaiement.numeroTransaction}/pdf`;
    const qrCodeDataUrl = await QRCode.toDataURL(pdfUrl);

    const recu = await this.prisma.recu.create({
      data: {
        paiementId: updatedPaiement.id,
        montant: updatedPaiement.montantTotal,
        numeroRecu: numeroRecu,
        telephone: updatedPaiement.telephone,
        concours: updatedPaiement.candidatId || "Concours inconnu",
        qrCode: qrCodeDataUrl,
      },
    });

    console.log(`✅ Paiement Validé ! Reçu : ${numeroRecu}`);

    // 4. Envoi de l'email
    if (updatedPaiement.email) {
      // const message = `Félicitations ! Votre paiement pour le concours ${updatedPaiement.concoursId?} est validé. Reçu : ${numeroRecu}. Téléchargement : ${pdfUrl}`;
      // await this.emailService.sendOtpEmail(updatedPaiement.email, message).catch(err => console.error("Email Error:", err.message));
    }

    return { paiement: updatedPaiement, recu };
  } catch (err) {
    console.error("Erreur lors de la finalisation :", err.message);
  }
}

  // --- MÉTHODES PDF ---

  async generatePdf(recuData: any, res: Response) {
    const dossier = await this.prisma.dossier.findFirst({
      where: { candidate: { user: { email: recuData.paiement.email } } },
      include: { candidate: { include: { user: true } } }
    });

    const isValidated = dossier?.statut === 'VALIDATED';
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    const filename = `${isValidated ? 'ADMISSION' : 'RECU'}-${recuData.paiement.numeroTransaction}.pdf`;
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);

    doc.pipe(res);

    if (isValidated) {
      doc.fillColor('#1a5a96').fontSize(22).text('CARTE D\'ADMISSION AU CONCOURS', { align: 'center' });
      doc.fontSize(10).fillColor('green').text('DOSSIER VÉRIFIÉ ET ADMISSIBLE', { align: 'center' });
    } else {
      doc.fontSize(20).fillColor('black').text('REÇU DE PAIEMENT', { align: 'center' });
      doc.fontSize(10).fillColor('orange').text('INSCRIPTION EN COURS DE TRAITEMENT', { align: 'center' });
    }

    doc.moveDown().strokeColor('#eeeeee').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    if (isValidated && dossier.photoProfil) {
      try {
        const photoPath = path.join(process.cwd(), dossier.photoProfil);
        if (fs.existsSync(photoPath)) doc.image(photoPath, 430, 120, { width: 110, height: 130 });
      } catch (e) {}
    }

    doc.fillColor('black').fontSize(12);
    doc.text(`Nom: ${recuData.paiement.nomComplet.toUpperCase()}`, 50, 130);
    doc.text(`Prénom: ${recuData.paiement.prenom || ''}`);
    doc.text(`Email: ${recuData.paiement.email}`);
    doc.text(`Téléphone: ${recuData.paiement.telephone}`);
    doc.moveDown().fontSize(14).text(`CONCOURS: ${recuData.concours}`, { bold: true });
    
    if (isValidated) doc.fillColor('#1a5a96').text(`MATRICULE: ${dossier.candidate.matricule || 'N/A'}`);

    doc.moveDown(2).fillColor('black').fontSize(10);
    doc.text(`Référence Transaction: ${recuData.paiement.numeroTransaction}`);
    doc.text(`Numéro de Reçu: ${recuData.numeroRecu}`);
    doc.text(`Date de paiement: ${new Date(recuData.createdAt).toLocaleString('fr-FR')}`);

    if (recuData.qrCode) {
      const qrImage = recuData.qrCode.replace(/^data:image\/png;base64,/, '');
      doc.image(Buffer.from(qrImage, 'base64'), 460, 700, { width: 90 });
      doc.fontSize(8).text("Scanner pour vérifier", 465, 795);
    }

    doc.end();
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
    if (!recu) throw new NotFoundException('Reçu invalide');
    if (recu.estUtilise) throw new BadRequestException('Ce reçu a déjà été utilisé');
    
    return {
      message: 'Valide',
      numeroRecu: recu.numeroRecu,
      paiement: {
        nomComplet: recu.paiement?.nomComplet,
        concours: recu.paiement?.concours?.intitule || recu.concours,
        montant: recu.montant,
      },
    };
  }

  async getPaiementInfoByRecu(reference: string) {
    const recu = await this.prisma.recu.findFirst({
      where: { OR: [{ numeroRecu: reference }, { paiement: { numeroTransaction: reference } }] },
      include: { paiement: { include: { concours: true } } },
    });

    if (!recu) throw new NotFoundException('Reçu introuvable');
    
    return {
      ...recu,
      nom: recu.paiement?.nomComplet || '',
      prenom: recu.paiement?.prenom || '',
      email: recu.paiement?.email || '',
      telephone: recu.paiement?.telephone || '',
      concours: recu.paiement?.concours?.intitule || recu.concours,
      paiement: recu.paiement
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;
    const recu = await this.prisma.recu.findFirst({ where: { paiement: { email } } });
    if (!recu) throw new NotFoundException('Aucun reçu trouvé');
    
    const code = this.generateOtpCode();
    await this.prisma.otp.create({ 
      data: { email, code, expiresAt: new Date(Date.now() + 600000) } 
    });
    
    await this.emailService.sendOtpEmail(email, code);
    return { message: 'Code envoyé' };
  }

  async verifyOtpAndGetRecu(verifyOtpDto: VerifyOtpDto) {
    const otp = await this.prisma.otp.findFirst({
      where: { email: verifyOtpDto.email, code: verifyOtpDto.code, isUsed: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp || new Date() > otp.expiresAt) throw new BadRequestException('OTP invalide ou expiré');
    
    await this.prisma.otp.update({ where: { id: otp.id }, data: { isUsed: true } });
    
    return this.prisma.recu.findFirst({
      where: { paiement: { email: verifyOtpDto.email } },
      include: { paiement: true },
    });
  }
}