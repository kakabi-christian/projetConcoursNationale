import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocStatus, Prisma, NotificationType } from '@prisma/client'; 
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DossierService {
  private readonly logger = new Logger(DossierService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService 
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
   * UPDATE STATUS + NOTIFICATION (Version corrigée)
   */
async updateStatus(providedId: string, dto: UpdateDossierStatusDto) {
  // 1. On récupère le dossier ET le userId associé pour garantir la réception de la notif
  const candidate = await this.prisma.candidate.findFirst({
    where: {
      OR: [{ id: providedId }, { userId: providedId }]
    },
    select: { 
      id: true, 
      userId: true,
      user: { select: { nom: true, prenom: true } } // Pour personnaliser le message
    }   
  });

  if (!candidate) throw new NotFoundException("Profil candidat introuvable.");

  // 2. Mise à jour du dossier en base de données
  const updatedDossier = await this.prisma.dossier.update({
    where: { candidateId: candidate.id },
    data: {
      statut: dto.statut,
      commentaire: dto.commentaire || null,
      updatedAt: new Date() 
    },
  });

  // 3. Construction de messages détaillés et polis
  let notifMessage = "";
  let notifType: NotificationType = NotificationType.INFO;
  const userName = `${candidate.user.prenom} ${candidate.user.nom}`;

  switch (dto.statut) {
    case DocStatus.VALIDATED:
      notifType = NotificationType.SUCCESS;
      notifMessage = `Bonjour ${userName}, nous avons le plaisir de vous informer que votre dossier de candidature a été examiné avec succès. Toutes vos pièces justificatives sont conformes. Votre inscription est désormais validée. Nous vous souhaitons bonne chance pour la suite du concours !`;
      break;

    case DocStatus.PENDING:
      notifType = NotificationType.ERROR;
      notifMessage = `Bonjour ${userName}, après examen de votre dossier, nous sommes au regret de vous informer que celui-ci a été rejeté. Motif : ${dto.commentaire || "Certains documents ne correspondent pas aux critères requis."}. Nous vous invitons à rectifier les pièces concernées et à les soumettre de nouveau dans les plus brefs délais.`;
      break;

    case DocStatus.PENDING:
      notifType = NotificationType.WARNING;
      notifMessage = `Bonjour ${userName}, votre dossier a été placé en attente. Nos équipes procèdent actuellement à une vérification complémentaire de vos informations. Vous recevrez une notification dès qu'une décision finale sera prise. Merci de votre patience.`;
      break;

    default:
      notifMessage = `Le statut de votre dossier de candidature a été mis à jour : ${dto.statut}. Connectez-vous à votre espace personnel pour plus de détails.`;
  }

  // 4. Envoi effectif de la notification vers le USER_ID
  try {
    await this.notificationService.create({
      userId: candidate.userId, // Identifiant de connexion du candidat
      message: notifMessage,
      type: notifType,
      isBroadcast: false
    });
    this.logger.log(`Notification envoyée avec succès au candidat : ${userName} (UID: ${candidate.userId})`);
  } catch (e) {
    this.logger.error(`Échec de l'envoi de la notification : ${e.message}`);
  }

  return updatedDossier;
}
  /**
   * RÉSOLUTION D'ID
   */
  private async resolveCandidateId(id: string): Promise<string> {
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        OR: [{ id: id }, { userId: id }]
      },
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
        await this.prisma.dossier.create({ data: { candidateId,
            statut:DocStatus.REJECTED
        } });
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