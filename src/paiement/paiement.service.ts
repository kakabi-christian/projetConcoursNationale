// src/paiement/paiement.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PaiementService {
  constructor(private prisma: PrismaService) {}

  // Générer le numéro de transaction basé uniquement sur la date et l'heure
  private generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `TX-${year}${month}${day}-${hours}${minutes}`;
  }

  async createPaiement(createPaiementDto: CreatePaiementDto) {
    console.log('[PaiementService] Début création paiement', createPaiementDto);

    // Vérifier si le concours existe
    const concours = await this.prisma.concours.findUnique({
      where: { id: createPaiementDto.concoursId },
    });
    if (!concours) {
      console.error('[PaiementService] Concours introuvable :', createPaiementDto.concoursId);
      throw new NotFoundException('Concours introuvable');
    }

    // Générer le numéro de transaction
    const numeroTransaction = this.generateTransactionNumber();
    console.log('[PaiementService] Numéro de transaction généré :', numeroTransaction);

    // Créer le paiement
    const paiement = await this.prisma.paiement.create({
      data: {
        ...createPaiementDto,
        montantTotal: concours.montant,
        statut: 'PENDING',
        numeroTransaction,
      },
    });
    console.log('[PaiementService] Paiement créé :', paiement);

    // Générer le numéro de reçu
    const numeroRecu = `REC-${Math.floor(Math.random() * 1000000)}`;
    console.log('[PaiementService] Numéro de reçu généré :', numeroRecu);

    // Générer le QR Code (contenu = numéro du reçu)
    const qrCodeDataUrl = await QRCode.toDataURL(numeroRecu);

    // Créer le reçu associé
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
    console.log('[PaiementService] Reçu créé :', recu);

    console.log('[PaiementService] Fin création paiement');

    // Retour clair pour le frontend
    return {
      paiement, // contient numeroTransaction
      recu,     // contient qrCode, numeroRecu, etc.
    };
  }
}
