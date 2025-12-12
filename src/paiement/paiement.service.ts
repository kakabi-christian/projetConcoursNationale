// src/paiement/paiement.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PaiementService {
  constructor(private prisma: PrismaService) {}

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

    // Contenu du QR Code : un JSON avec les infos de l'utilisateur et du paiement
    const qrContent = JSON.stringify({
      nomComplet: createPaiementDto.nomComplet,
      email: createPaiementDto.email,
      telephone: createPaiementDto.telephone,
      numeroTransaction,
      numeroRecu,
      concours: concours.intitule,
      montant: concours.montant
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
  async findRecuByEmail(email: string) {
  // Cherche le paiement correspondant à cet email
  const recu = await this.prisma.recu.findFirst({
    where: {
      paiement: {
        email: email,
      },
    },
    include: {
      paiement: true, // inclure les infos du paiement si besoin
    },
  });

  if (!recu) throw new NotFoundException('Aucun reçu trouvé pour cet email');

  return recu;
}

}
