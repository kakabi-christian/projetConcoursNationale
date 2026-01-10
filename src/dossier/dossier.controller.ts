import { 
  Controller, Get, Post, Body, Patch, Param, Query, 
  UseInterceptors, UploadedFile, BadRequestException, Res, Logger, NotFoundException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express'; 
import * as fs from 'fs';
import { DossierService } from './dossier.service';
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { DocStatus } from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';

// Importation spécifique pour éviter l'erreur "is not a constructor"
const PDFDocument = require('pdfkit');

@Controller('dossiers')
export class DossierController {
  private readonly logger = new Logger(DossierController.name);

  constructor(private readonly dossierService: DossierService) {}

@Public()
@Get('verify/:candidateId')
@Public()
@Get('verify/:candidateId')
@Public()
@Get('verify/:candidateId')
async verifyDossier(@Param('candidateId') candidateId: string, @Res() res: Response) {
  this.logger.log(`🔍 Scan QR Code : Vérification du candidat ${candidateId}`);
  
  try {
    const dossier = await this.dossierService.getDossier(candidateId);
    if (!dossier) throw new NotFoundException("Dossier introuvable");

    const candidate = dossier.candidate;
    const user = candidate.user;
    const concours = dossier.concours;

    // Récupérer la filière et spécialité via la table de liaison
    let filiere = 'Non renseignée';
    let specialite = 'Non renseignée';
    
    if (candidate.specialites && candidate.specialites.length > 0) {
      const candidatSpec = candidate.specialites[0];
      if (candidatSpec.specialite) {
        specialite = candidatSpec.specialite.libelle || 'Non renseignée';
        // Récupérer la filière depuis la spécialité
        if (candidatSpec.specialite.filiere) {
          filiere = candidatSpec.specialite.filiere.intitule || 'Non renseignée';
        }
      }
    }

    // 1. INITIALISATION A4 PORTRAIT
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=verification-${candidateId}.pdf`);
    doc.pipe(res);

    // --- ENTÊTE OFFICIEL ---
    doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold');
    doc.text('REPUBLIQUE DU CAMEROUN', 40, 40, { align: 'left' });
    doc.text('Paix - Travail - Patrie', 40, 52, { align: 'left' });
    
    doc.text('REPUBLIC OF CAMEROON', 40, 40, { align: 'right' });
    doc.text('Peace - Work - Fatherland', 40, 52, { align: 'right' });

    doc.moveDown(2);
    doc.lineWidth(1).moveTo(40, 80).lineTo(555, 80).stroke('#bdc3c7');

    // --- TITRE DU DOCUMENT ---
    doc.moveDown(2);
    doc.fillColor('#2c3e50').fontSize(18).font('Helvetica-Bold')
       .text('FICHE DE VÉRIFICATION CANDIDAT', { align: 'center', underline: true });
    doc.fontSize(12).text(concours?.intitule?.toUpperCase() || 'SESSION 2024-2025', { align: 'center' });

    // --- SECTION PHOTO DE PROFIL (À DROITE) ---
    const photoY = 150;
    const photoX = 430;
    if (dossier.photoProfil) {
      try {
        const photoPath = join(process.cwd(), dossier.photoProfil);
        if (fs.existsSync(photoPath)) {
          // Cadre de la photo
          doc.rect(photoX - 5, photoY - 5, 110, 130).lineWidth(1).stroke('#2c3e50');
          doc.image(photoPath, photoX, photoY, { width: 100, height: 120 });
        }
      } catch (e) {
        doc.rect(photoX, photoY, 100, 120).stroke();
        doc.fontSize(8).text('PHOTO NON DISPONIBLE', photoX + 5, photoY + 50);
        this.logger.error(`Erreur chargement photo profil: ${e.message}`);
      }
    }

    // --- INFORMATIONS DU CANDIDAT (À GAUCHE) ---
    const infoX = 60;
    const startY = 160;
    const gap = 25;

    const drawLine = (label: string, value: string, y: number) => {
      doc.fillColor('#7f8c8d').font('Helvetica').fontSize(10).text(label, infoX, y);
      doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(11).text(value || 'Non renseigné', infoX + 130, y);
    };

    drawLine('MATRICULE :', candidate.matricule || 'En cours...', startY);
    drawLine('NOM :', user.nom?.toUpperCase() || 'Non renseigné', startY + gap);
    drawLine('PRÉNOM :', user.prenom || 'Non renseigné', startY + gap * 2);
    
    const dateNais = candidate.dateNaissance 
      ? new Date(candidate.dateNaissance).toLocaleDateString('fr-FR') 
      : 'Non renseignée';
    drawLine('NÉ(E) LE :', dateNais, startY + gap * 3);
    
    drawLine('SEXE :', candidate.sexe || 'Non renseigné', startY + gap * 4);
    drawLine('FILIÈRE :', filiere, startY + gap * 5);
    drawLine('SPÉCIALITÉ :', specialite, startY + gap * 6);

    // --- ZONE DE STATUT ---
    doc.moveDown(4);
    const isValide = dossier.statut === 'VALIDATED';
    doc.rect(60, startY + gap * 8, 475, 40).fill(isValide ? '#e8f5e9' : '#fff3e0');
    doc.fillColor(isValide ? '#2e7d32' : '#ef6c00').font('Helvetica-Bold').fontSize(14)
       .text(`STATUT DU DOSSIER : ${dossier.statut}`, 60, startY + gap * 8 + 12, { align: 'center', width: 475 });

    // --- SECTION PIÈCE D'IDENTITÉ (CNI) ---
    const cniY = startY + gap * 10;
    doc.moveDown(6);
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(12)
       .text('PIÈCE D\'IDENTITÉ (CNI) :', 60, cniY);
    
    if (dossier.photoCni) {
      try {
        const cniPath = join(process.cwd(), dossier.photoCni);
        if (fs.existsSync(cniPath)) {
          // Image CNI sans le grand cadre
          doc.image(cniPath, 60, cniY + 25, { width: 475, height: 140 }); 
        } else {
          doc.fillColor('#e74c3c').font('Helvetica').fontSize(10)
             .text('CNI non disponible - Fichier introuvable', 60, cniY + 25);
        }
      } catch (e) {
        doc.fillColor('#e74c3c').font('Helvetica').fontSize(10)
           .text('Erreur de chargement de la CNI', 60, cniY + 25);
        this.logger.error(`Erreur chargement CNI: ${e.message}`);
      }
    } else {
      doc.fillColor('#95a5a6').font('Helvetica-Oblique').fontSize(10)
         .text('Aucune pièce d\'identité téléversée', 60, cniY + 25);
    }

    // --- FOOTER AVEC QR CODE ET INFORMATIONS DE VÉRIFICATION ---
    const footerY = doc.page.height - 200;
    doc.lineWidth(0.5).moveTo(40, footerY).lineTo(555, footerY).stroke('#bdc3c7');
    
    // QR Code en bas à droite
    if (candidate.qrCode) {
      try {
        // Le QR code est stocké en base64, on l'utilise directement
        const qrX = 455;
        const qrY = footerY + 10;
        doc.image(candidate.qrCode, qrX, qrY, { width: 80, height: 80 });
        
        // Texte sous le QR code
        doc.fillColor('#7f8c8d').fontSize(7).font('Helvetica')
           .text('Scannez pour vérifier', qrX - 5, qrY + 82, { width: 90, align: 'center' });
      } catch (e) {
        this.logger.error(`Erreur chargement QR Code: ${e.message}`);
      }
    }
    
    // Informations de vérification à gauche
    doc.fillColor('#95a5a6').fontSize(8).font('Helvetica')
       .text(`Document de vérification généré le ${new Date().toLocaleString('fr-FR')}`, 40, footerY + 10);
    doc.text(`ID Vérification: ${candidateId.toUpperCase()}`, 40, footerY + 22);
    
    doc.fillColor('#2c3e50').font('Helvetica-Oblique')
       .text('Ce document sert uniquement à la vérification de l\'identité du candidat.', 40, footerY + 40, { width: 400 });

    doc.end();

  } catch (error) {
    this.logger.error(`❌ Erreur Scan QR Code: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).send("Erreur lors de la génération du document de vérification.");
    }
  }
}
  @Get('count/pending')
  getPendingCount() {
    return this.dossierService.countPendingDossiers();
  }

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string, @Query('statut') statut?: DocStatus) {
    return this.dossierService.findAll(+page || 1, +limit || 10, statut);
  }

  @Patch(':candidateId/status')
  updateStatus(@Param('candidateId') candidateId: string, @Body() dto: UpdateDossierStatusDto) {
    return this.dossierService.updateStatus(candidateId, dto);
  }

  @Post('upload/:candidateId/:field')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/dossiers',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@Param('candidateId') candidateId: string, @Param('field') field: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    const fileUrl = `uploads/dossiers/${file.filename}`;
    return this.dossierService.uploadFile(candidateId, field, fileUrl);
  }

  @Get('my-dossier/:candidateId')
  getDossier(@Param('candidateId') candidateId: string) {
    return this.dossierService.getDossier(candidateId);
  }
  @Get('candidate/qrcode/:userId')
async getCandidateQrCode(@Param('userId') userId: string) {
  // On appelle la méthode du service au lieu de prisma directement
  return this.dossierService.getQrCode(userId);
}
}