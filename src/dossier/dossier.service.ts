import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocStatus, Prisma, NotificationType } from '@prisma/client'; 
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

@Injectable()
export class DossierService {
  private readonly logger = new Logger(DossierService.name);

  // CORRECTION : L'injection se fait obligatoirement ici dans le constructeur
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private whatsappService: WhatsappService // Ajouté ici
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
   * UPDATE STATUS + NOTIFICATION DASHBOARD + WHATSAPP
   */
  async updateStatus(providedId: string, dto: UpdateDossierStatusDto) {
    this.logger.debug(`🚀 Début updateStatus pour ID: ${providedId}`);
    this.logger.debug(`📦 Données reçues: ${JSON.stringify(dto)}`);

    // 1. Recherche du candidat et de ses informations
    const candidate = await this.prisma.candidate.findFirst({
      where: { OR: [{ id: providedId }, { userId: providedId }] },
      select: { 
        id: true, 
        userId: true,
        user: { select: { nom: true, prenom: true, telephone: true } },
        enrollements: {
          include: { concours: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }   
    });

    if (!candidate) {
      this.logger.error(`❌ Candidat non trouvé pour l'ID: ${providedId}`);
      throw new NotFoundException("Profil candidat introuvable.");
    }

    const concoursNom = candidate.enrollements[0]?.concours?.intitule || "votre concours";
    this.logger.log(`🔍 Candidat trouvé: ${candidate.user.prenom} ${candidate.user.nom} - Concours: ${concoursNom}`);

    // 2. Mise à jour en Base de données
    const updatedDossier = await this.prisma.dossier.update({
      where: { candidateId: candidate.id },
      data: {
        statut: dto.statut,
        commentaire: dto.commentaire || null,
        updatedAt: new Date() 
      },
    });
    this.logger.log(`✅ Base de données mise à jour. Nouveau statut: ${dto.statut}`);

    // 3. Préparation des messages personnalisés
    let messageBody = "";
    let notifType: NotificationType = NotificationType.INFO;
    const userName = `${candidate.user.prenom} ${candidate.user.nom}`;

    if (dto.statut === DocStatus.VALIDATED) {
      notifType = NotificationType.SUCCESS;
      messageBody = `Félicitations ${userName} ! Votre dossier pour le concours "${concoursNom}" a été VALIDÉ. Connectez-vous pour la suite.`;
    } else {
      const raison = dto.commentaire ? `Raison: ${dto.commentaire}` : "Certains documents ne sont pas conformes.";
      notifType = NotificationType.ERROR;
      messageBody = `Bonjour ${userName}, votre dossier pour le concours "${concoursNom}" a été REJETÉ. ${raison} Veuillez vous connecter pour mettre à jour vos fichiers.`;
    }

    // 4. Notification Dashboard
    try {
      this.logger.debug(`🖥️ Tentative d'envoi notification Dashboard à l'UID: ${candidate.userId}`);
      await this.notificationService.create({
        userId: candidate.userId,
        message: messageBody,
        type: notifType,
        isBroadcast: false
      });
      this.logger.log(`🔔 Notification Dashboard envoyée.`);
    } catch (e) {
      this.logger.error(`⚠️ Erreur Notification Dashboard: ${e.message}`);
    }

    // 5. Notification WhatsApp avec préfixe +237
    if (candidate.user.telephone) {
      try {
        const rawNumber = candidate.user.telephone.replace(/\s+/g, '');
        const formattedPhone = rawNumber.startsWith('+') ? rawNumber : `+237${rawNumber}`;
        
        this.logger.debug(`📱 Préparation envoi WhatsApp vers: ${formattedPhone}`);
        
        // Envoi via le service
        await this.whatsappService.sendTestMessage(formattedPhone);
        
        this.logger.log(`📲 Signal WhatsApp envoyé avec succès au ${formattedPhone}`);
      } catch (e) {
        this.logger.error(`❌ Erreur WhatsApp (Vérifiez le numéro ou le Token): ${e.message}`);
      }
    } else {
      this.logger.warn(`⚠️ Aucun numéro de téléphone trouvé pour cet utilisateur.`);
    }

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
   * RÉCUPÉRATION DOSSIER
   */
  async getDossier(providedId: string) {
    const candidateId = await this.resolveCandidateId(providedId);
    try {
      const dossier = await this.prisma.dossier.findUnique({
        where: { candidateId },
        include: {
          candidate: {
            include: {
              user: { select: { nom: true, prenom: true, email: true } },
              enrollements: {
                include: { concours: { include: { piecesDossier: true } } },
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      });

      if (!dossier) {
        await this.prisma.dossier.create({ data: { candidateId, statut: DocStatus.PENDING } });
        return this.getDossier(candidateId);
      }

      const activeConcours = dossier.candidate.enrollements?.[0]?.concours || null;
      return {
        ...dossier,
        concours: activeConcours,
        piecesRequises: activeConcours?.piecesDossier || []
      };
    } catch (error) {
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
}