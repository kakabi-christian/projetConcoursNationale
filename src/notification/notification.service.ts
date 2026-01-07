import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * CRÉER une notification
   */
  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notifications.create({
      data: {
        userId: createNotificationDto.userId,
        message: createNotificationDto.message,
        type: createNotificationDto.type,
        isBroadcast: createNotificationDto.isBroadcast || false,
        sentAt: new Date(),
      },
    });
  }

  /**
   * LISTER avec PAGINATION
   * @param userId ID de l'utilisateur
   * @param page Numéro de la page (défaut 1)
   * @param limit Nombre d'éléments par page (défaut 10)
   */
  async findAllByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // On récupère les données et le total en parallèle pour la performance
    const [notifications, total] = await Promise.all([
      this.prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      this.prisma.notifications.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * RÉCUPÉRER une notification spécifique
   */
  async findOne(id: string) {
    const notification = await this.prisma.notifications.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification introuvable');
    return notification;
  }

  /**
   * COMPTEUR des non lus (pour la Sidebar)
   */
  async countUnread(userId: string) {
    const count = await this.prisma.notifications.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * MARQUER COMME LU
   */
  async markAsRead(id: string) {
    await this.findOne(id); // Vérifie si elle existe
    return this.prisma.notifications.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * TOUT MARQUER COMME LU
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * SUPPRIMER une notification
   */
  async remove(id: string) {
    await this.findOne(id); // Vérifie l'existence avant
    return this.prisma.notifications.delete({
      where: { id },
    });
  }

  /**
   * SUPPRIMER TOUTES les notifications d'un utilisateur
   */
  async removeAll(userId: string) {
    return this.prisma.notifications.deleteMany({
      where: { userId },
    });
  }
}