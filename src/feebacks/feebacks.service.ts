import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste le chemin selon ton projet
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre un nouveau feedback (Commentaire + Note)
   */
  async create(createFeedbackDto: CreateFeedbackDto) {
  const { userId, comment, note } = createFeedbackDto;

  return this.prisma.feedback.upsert({
    where: {
      userId: userId, // On cherche par l'ID unique de l'utilisateur
    },
    update: {
      comment: comment,
      note: note,
      updatedAt: new Date(), // On force la mise à jour de la date
    },
    create: {
      userId: userId,
      comment: comment,
      note: note,
    },
    include: {
      user: {
        select: {
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
  });
}

  /**
   * Récupère tous les feedbacks pour l'administration
   */
  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            userType: true
          }
        }
      }
    });
  }

  /**
   * Calculer la moyenne de satisfaction (Optionnel mais utile)
   */
  async getAverageRating() {
    const aggregate = await this.prisma.feedback.aggregate({
      _avg: {
        note: true,
      },
    });
    return { average: aggregate._avg.note || 0 };
  }
}