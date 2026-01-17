import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 🔹 1. Récupérer toutes les conversations d'un Admin
   */
  async getUserConversations(adminId: string) {
    this.logger.log(`🚀 [getUserConversations] Appel pour adminId: "${adminId}"`);

    if (!adminId || adminId === 'undefined') {
      this.logger.error(`❌ [getUserConversations] adminId est invalide (undefined ou null)`);
      throw new BadRequestException("L'identifiant de l'administrateur est manquant.");
    }

    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          participants: { some: { adminId } },
        },
        include: {
          participants: {
            include: {
              admin: {
                include: { user: { select: { nom: true, prenom: true, image: true } } },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: adminId },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      this.logger.debug(`✅ [getUserConversations] Succès: ${conversations.length} conversations trouvées.`);
      return conversations;
    } catch (error) {
      this.logger.error(`💥 [getUserConversations] Erreur critique: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🔹 2. Récupérer l'historique d'une conversation
   */
  async getMessagesByConversation(conversationId: string) {
    this.logger.log(`📩 [getMessagesByConversation] Récupération messages pour convId: "${conversationId}"`);

    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: { conversationId },
        include: {
          sender: {
            include: { user: { select: { nom: true, prenom: true, image: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      this.logger.debug(`📊 [getMessagesByConversation] ${messages.length} messages extraits.`);
      return messages;
    } catch (error) {
      this.logger.error(`💥 [getMessagesByConversation] Erreur: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔹 3. Créer ou récupérer une conversation existante
   */
  async getOrCreateConversation(adminId1: string, adminId2: string) {
    this.logger.log(`🔍 [getOrCreateConversation] Tentative entre Admin1: "${adminId1}" et Admin2: "${adminId2}"`);

    // --- SÉCURITÉ CRITIQUE ---
    if (!adminId1 || adminId1 === 'undefined' || !adminId2 || adminId2 === 'undefined') {
      const errorMsg = `ID Manquant pour la création: adminId1=${adminId1}, adminId2=${adminId2}`;
      this.logger.error(`❌ [getOrCreateConversation] ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    try {
      this.logger.debug(`🔄 Recherche d'une conversation existante en base...`);
      const existing = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { adminId: adminId1 } } },
            { participants: { some: { adminId: adminId2 } } },
          ],
        },
      });

      if (existing) {
        this.logger.log(`✨ Conversation existante trouvée (ID: ${existing.id}). Pas de création nécessaire.`);
        return existing;
      }

      this.logger.warn(`🆕 Aucune discussion trouvée. Création d'une nouvelle conversation...`);
      
      const newConversation = await this.prisma.conversation.create({
        data: {
          participants: {
            create: [
              { adminId: adminId1 }, 
              { adminId: adminId2 }
            ],
          },
        },
        include: {
          participants: true
        }
      });

      this.logger.log(`🎊 Nouvelle conversation créée avec succès! ID: ${newConversation.id}`);
      return newConversation;
    } catch (error) {
      this.logger.error(`💥 [getOrCreateConversation] Erreur Prisma: ${error.message}`);
      // Log détaillé de l'objet d'erreur pour voir si c'est une contrainte de clé étrangère
      this.logger.error(`Détails de l'erreur: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * 🔹 4. Sauvegarder un message
   */
  async saveMessage(senderId: string, conversationId: string, content: string) {
    this.logger.log(`📝 [saveMessage] Nouveau message de "${senderId}" dans la conv "${conversationId}"`);
    this.logger.debug(`Contenu: "${content.substring(0, 20)}..."`);

    try {
      const message = await this.prisma.chatMessage.create({
        data: {
          content,
          senderId,
          conversationId,
        },
        include: {
          sender: {
            include: { user: { select: { nom: true, prenom: true, image: true } } },
          },
        },
      });

      this.logger.debug(`✅ Message enregistré (ID: ${message.id}). Mise à jour du timestamp de la conversation.`);

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    } catch (error) {
      this.logger.error(`💥 [saveMessage] Échec de l'enregistrement: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔹 5. Marquer les messages comme lus
   */
  async markMessagesAsRead(conversationId: string, adminId: string) {
    this.logger.log(`👁️ [markMessagesAsRead] Conv: ${conversationId}, Admin: ${adminId}`);

    try {
      const result = await this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: adminId },
          isRead: false,
        },
        data: { isRead: true },
      });

      this.logger.debug(`✔️ ${result.count} messages marqués comme lus.`);
      return result;
    } catch (error) {
      this.logger.error(`💥 [markMessagesAsRead] Erreur: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔹 Récupérer la liste des admins
   */
  async getAllAdmins(page: number = 1, limit: number = 10) {
    this.logger.log(`👥 [getAllAdmins] Demande Page ${page}, Limite ${limit}`);

    try {
      const skip = (page - 1) * limit;
      const [admins, total] = await Promise.all([
        this.prisma.admin.findMany({
          where: {
            user: {
              userType: { in: ['ADMIN', 'SUPERADMIN'] },
            },
          },
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                image: true,
                email: true,
                userType: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { user: { nom: 'asc' } },
        }),
        this.prisma.admin.count({
          where: {
            user: {
              userType: { in: ['ADMIN', 'SUPERADMIN'] },
            },
          },
        }),
      ]);

      this.logger.debug(`✅ [getAllAdmins] ${admins.length} admins récupérés sur un total de ${total}.`);
      return {
        data: admins,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`💥 [getAllAdmins] Erreur lors de la récupération de l'annuaire: ${error.message}`);
      throw error;
    }
  }
  /**
   * 🔹 6. Modifier un message
   */
  async editMessage(messageId: string, adminId: string, newContent: string) {
    this.logger.log(`✏️ [editMessage] ID: ${messageId} par Admin: ${adminId}`);
    
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== adminId) {
      throw new BadRequestException("Vous ne pouvez pas modifier ce message.");
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        content: newContent,
        isEdited: true 
      },
    });
  }

  /**
   * 🔹 7. Supprimer un message (Soft Delete)
   */
  async deleteMessage(messageId: string, adminId: string) {
    this.logger.log(`🗑️ [deleteMessage] ID: ${messageId}`);
    
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== adminId) {
      throw new BadRequestException("Action non autorisée.");
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        isDeleted: true,
        content: "Ce message a été supprimé" // Optionnel
      },
    });
  }

  /**
   * 🔹 8. Transférer un message
   */
  async forwardMessage(messageId: string, senderId: string, targetConversationId: string) {
    this.logger.log(`➡️ [forwardMessage] De msg ${messageId} vers conv ${targetConversationId}`);

    const originalMsg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!originalMsg) throw new NotFoundException("Message original introuvable.");

    return this.saveMessage(senderId, targetConversationId, originalMsg.content);
    // Note: Tu peux ajouter un flag `isForwarded: true` dans saveMessage si tu veux
  }

  /**
   * 🔹 9. Épingler un message (3, 7 ou 30 jours)
   */
  async pinMessage(messageId: string, days: number) {
    this.logger.log(`📌 [pinMessage] ID: ${messageId} pour ${days} jours`);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedUntil: expirationDate
      },
    });
  }

  /**
   * 🔹 10. Récupérer les messages épinglés d'une conversation
   */
  async getPinnedMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        isPinned: true,
        OR: [
          { pinnedUntil: null },
          { pinnedUntil: { gt: new Date() } } // Pas encore expiré
        ]
      }
    });
  }


  /**
   * 🔹 11. Récupérer le nombre total de messages non lus pour un Admin
   * Utile pour le badge de notification dans la Sidebar
   */
  async getUnreadMessagesCount(adminId: string) {
    this.logger.log(`🔔 [getUnreadMessagesCount] Calcul pour adminId: "${adminId}"`);

    if (!adminId || adminId === 'undefined') {
      return { unreadCount: 0 };
    }

    try {
      const count = await this.prisma.chatMessage.count({
        where: {
          conversation: {
            participants: {
              some: { adminId },
            },
          },
          senderId: { not: adminId }, // On ne compte pas ses propres messages
          isRead: false,
          isDeleted: false, // On ne compte pas les messages supprimés
        },
      });

      this.logger.debug(`✅ [getUnreadMessagesCount] ${count} messages non lus trouvés.`);
      return { unreadCount: count };
    } catch (error) {
      this.logger.error(`💥 [getUnreadMessagesCount] Erreur: ${error.message}`);
      throw error;
    }
  }
  /**
   * 🔹 Récupère le détail des messages non lus par Admin (Expéditeur)
   * Exemple de retour : [{ senderName: "Angela", count: 12, conversationId: "..." }, ...]
   */
  async getUnreadDetailByAdmin(adminId: string) {
    this.logger.log(`📊 [getUnreadDetailByAdmin] Détail pour adminId: "${adminId}"`);

    if (!adminId || adminId === 'undefined') {
      return [];
    }

    try {
      const details = await this.prisma.conversation.findMany({
        where: {
          participants: { some: { adminId } },
          messages: {
            some: {
              senderId: { not: adminId },
              isRead: false,
              isDeleted: false,
            },
          },
        },
        select: {
          id: true,
          participants: {
            where: { adminId: { not: adminId } }, // On récupère l'autre participant (l'expéditeur)
            select: {
              admin: {
                select: {
                  user: { select: { nom: true, prenom: true } },
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: adminId },
                  isRead: false,
                  isDeleted: false,
                },
              },
            },
          },
        },
      });

      // Formatage pour le frontend
      return details.map((conv) => ({
        conversationId: conv.id,
        count: conv._count.messages,
        senderName: conv.participants[0]?.admin?.user 
          ? `${conv.participants[0].admin.user.nom} ${conv.participants[0].admin.user.prenom || ''}`.trim()
          : 'Utilisateur inconnu',
      }));
    } catch (error) {
      this.logger.error(`💥 [getUnreadDetailByAdmin] Erreur: ${error.message}`);
      throw error;
    }
  }
  
}