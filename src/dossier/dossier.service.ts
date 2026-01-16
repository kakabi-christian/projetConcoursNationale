import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocStatus, Prisma, NotificationType } from '@prisma/client'; 
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import * as QRCode from 'qrcode';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class DossierService {
  private readonly logger = new Logger(DossierService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private whatsappService: WhatsappService,
    private emailService: EmailService, // 2. Injecte le service ici
    
  ) {}

  /**
   * COMPTEUR ADMIN : Dossiers en attente de validation
   */
  async countPendingDossiers() {
    const count = await this.prisma.dossier.count({
      where: { statut: DocStatus.PENDING }
    });
    return { pendingCount: count };
  }

  /**
   * UPDATE STATUS + GÉNÉRATION QR CODE + NOTIFICATIONS
   */
async updateStatus(providedId: string, dto: UpdateDossierStatusDto) {
  this.logger.log('--------------------------------------------------------');
  this.logger.log(`🚀 [DEBUT] Mise à jour du dossier pour l'ID: ${providedId}`);
  this.logger.debug(`📦 Payload reçu: ${JSON.stringify(dto)}`);

  // 1. Recherche du candidat avec email et relations
  this.logger.debug(`🔍 Recherche du candidat et de son dossier en base...`);
  const candidate = await this.prisma.candidate.findFirst({
    where: { OR: [{ id: providedId }, { userId: providedId }] },
    include: { 
      user: { select: { nom: true, prenom: true, telephone: true, email: true } }, // ✅ Email ajouté ici
      dossier: true,
      enrollements: {
        include: { concours: true },
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }   
  });

  if (!candidate) {
    this.logger.error(`❌ [ERREUR] Candidat non trouvé pour l'ID: ${providedId}`);
    throw new NotFoundException("Profil candidat introuvable.");
  }

  const concoursNom = candidate.enrollements[0]?.concours?.intitule || "votre concours";
  const userName = `${candidate.user.prenom} ${candidate.user.nom}`;
  const userEmail = candidate.user.email;
  
  this.logger.log(`👤 Candidat identifié: ${userName} | Concours: ${concoursNom}`);

  // 2. Mise à jour du statut du dossier en base de données
  this.logger.debug(`💾 Sauvegarde du nouveau statut (${dto.statut}) en base de données...`);
  const updatedDossier = await this.prisma.dossier.update({
    where: { candidateId: candidate.id },
    data: {
      statut: dto.statut,
      commentaire: dto.commentaire || null,
      updatedAt: new Date() 
    },
  });
  this.logger.log(`✅ Dossier mis à jour avec succès dans la table Dossier.`);

  // 3. Logique spécifique si le dossier est VALIDÉ (Génération du QR Code Final)
  if (dto.statut === DocStatus.VALIDATED) {
    this.logger.log(`⚙️ [QR-LOGIC] Statut VALIDÉ détecté. Préparation du QR Code d'examen...`);
    
    try {
      const validationUrl = `${process.env.BACKEND_URL}/dossiers/verify/${candidate.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(validationUrl);
      
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { qrCode: qrCodeDataUrl }
      });
      this.logger.log(`✅ QR Code d'examen enregistré.`);
    } catch (err) {
      this.logger.error(`❌ [ERREUR QR-CODE]: ${err.message}`);
    }
  }

  // 4. Préparation et envoi des notifications
  this.logger.log(`📢 Initialisation des notifications pour le candidat...`);
  let messageBody = "";
  let notifType: NotificationType = NotificationType.INFO;

  if (dto.statut === DocStatus.VALIDATED) {
    notifType = NotificationType.SUCCESS;
    messageBody = `Félicitations ${userName} ! Votre dossier pour le concours "${concoursNom}" a été VALIDÉ. Votre carte d'examen est maintenant disponible.`;
  } else {
    const raison = dto.commentaire ? `Raison: ${dto.commentaire}` : "Certains documents ne sont pas conformes.";
    notifType = NotificationType.ERROR;
    messageBody = `Bonjour ${userName}, votre dossier pour le concours "${concoursNom}" a été REJETÉ. ${raison} Veuillez modifier vos fichiers.`;
  }

  // A. Notification Dashboard
  try {
    this.logger.debug(`🖥️ Envoi notification Dashboard à l'UID: ${candidate.userId}`);
    await this.notificationService.create({
      userId: candidate.userId,
      message: messageBody,
      type: notifType,
      isBroadcast: false
    });
    this.logger.log(`🔔 Notification Dashboard transmise.`);
  } catch (e) {
    this.logger.error(`⚠️ [ERREUR NOTIF] Dashboard: ${e.message}`);
  }

  // B. Notification Email (Nouvelle intégration)
  if (userEmail) {
    try {
      this.logger.debug(`📧 Envoi de l'email de notification à : ${userEmail}`);
      await this.emailService.sendDossierStatusUpdate(
        userEmail,
        userName,
        dto.statut,
        concoursNom,
        dto.commentaire
      );
      this.logger.log(`✅ Notification Email envoyée avec succès.`);
    } catch (e) {
      this.logger.error(`❌ [ERREUR EMAIL]: ${e.message}`);
    }
  }

  this.logger.log(`🏁 [FIN] Processus updateStatus terminé pour ${userName}.`);
  this.logger.log('--------------------------------------------------------');
  
  return updatedDossier;
}

  /**
   * RÉSOLUTION D'ID
   */
  private async resolveCandidateId(id: string): Promise<string> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { OR: [{ id: id }, { userId: id }] },
      select: { id: true }
    });
    if (!candidate) throw new NotFoundException("Profil candidat introuvable.");
    return candidate.id;
  }

  /**
   * RÉCUPÉRATION DOSSIER COMPLET
   */
async getDossier(providedId: string) {
  const candidateId = await this.resolveCandidateId(providedId);
  try {
    const dossier = await this.prisma.dossier.findUnique({
      where: { candidateId },
      include: {
        candidate: {
          include: {
            user: { 
              select: { 
                nom: true, 
                prenom: true, 
                email: true 
              } 
            },
            // ✅ AJOUT : Récupération des spécialités avec la filière
            specialites: {
              include: {
                specialite: {
                  include: {
                    filiere: true  // Pour récupérer l'intitulé de la filière
                  }
                }
              }
            },
            enrollements: {
              include: { 
                concours: { 
                  include: { 
                    piecesDossier: true 
                  } 
                } 
              },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!dossier) {
      this.logger.warn(`⚠️ Aucun dossier trouvé pour candidateId: ${candidateId}. Création automatique...`);
      await this.prisma.dossier.create({ 
        data: { 
          candidateId, 
          statut: DocStatus.DRAFT 
        } 
      });
      return this.getDossier(candidateId);
    }

    const activeConcours = dossier.candidate.enrollements?.[0]?.concours || null;
    return {
      ...dossier,
      concours: activeConcours,
      piecesRequises: activeConcours?.piecesDossier || []
    };
  } catch (error) {
    this.logger.error(`❌ Erreur getDossier: ${error.message}`);
    throw new InternalServerErrorException("Erreur lors de la récupération du dossier.");
  }
}
  /**
   * UPLOAD FICHIER (Mapping Dynamique)
   */
  async uploadFile(providedId: string, field: string, fileUrl: string) {
    const candidateId = await this.resolveCandidateId(providedId);
    const dossierInfo = await this.getDossier(candidateId);
    
    if (!dossierInfo.concours) throw new BadRequestException("Aucun concours associé.");

    const pieceRequise = dossierInfo.piecesRequises.find(p => 
      p.code.toLowerCase() === field.toLowerCase()
    );

    if (!pieceRequise) throw new BadRequestException(`Document "${field}" non requis.`);

    let prismaField = pieceRequise.code.toLowerCase() === 'photo' 
      ? 'photoProfil' 
      : this.normalizePrismaFieldName(pieceRequise.code);

    return this.prisma.dossier.update({
      where: { candidateId },
      data: {
        [prismaField]: fileUrl,
        updatedAt: new Date()
      },
    });
  }

  /**
   * LISTE DES DOSSIERS (Pagination)
   */
  async findAll(page: number = 1, limit: number = 10, statut?: DocStatus) {
    const skip = (page - 1) * limit;
    const where: Prisma.DossierWhereInput = statut ? { statut } : {};

    const [total, data] = await Promise.all([
      this.prisma.dossier.count({ where }),
      this.prisma.dossier.findMany({
        where, skip, take: limit,
        include: {
          candidate: {
            include: { 
              user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
              enrollements: {
                include: { concours: { include: { piecesDossier: true } } },
                take: 1, orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const formattedData = data.map(dossier => ({
      ...dossier,
      concours: dossier.candidate?.enrollements?.[0]?.concours || null,
      piecesRequises: dossier.candidate?.enrollements?.[0]?.concours?.piecesDossier || []
    }));

    return { 
      data: formattedData, 
      pagination: { total, page, lastPage: Math.ceil(total / limit) } 
    };
  }

  private normalizePrismaFieldName(code: string): string {
    const clean = code.toLowerCase();
    if (clean.startsWith('photo')) {
      return 'photo' + clean.replace('photo', '').charAt(0).toUpperCase() + clean.replace('photo', '').slice(1);
    }
    return 'photo' + clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  async getQrCode(userId: string) {
  const candidate = await this.prisma.candidate.findFirst({
    where: { userId: userId },
    select: { qrCode: true }
  });
  if (!candidate) throw new NotFoundException("Candidat introuvable");
  return { qrCode: candidate.qrCode };
}
}