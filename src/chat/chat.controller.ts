import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Query,
  NotFoundException,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private prisma: PrismaService 
  ) {}

  /**
   * 🛠 Extraction robuste de l'adminId depuis le token
   */
  private async getAdminIdFromUser(req: any): Promise<string> {
    if (!req.user) {
        throw new BadRequestException("Authentification requise.");
    }
    const userId = req.user.id || req.user.sub || req.user.userId;
    
    if (!userId) {
        throw new BadRequestException("Format du token JWT invalide (ID manquant).");
    }

    const admin = await this.prisma.admin.findUnique({
      where: { userId: userId }
    });

    if (!admin) {
      throw new NotFoundException("Profil administrateur introuvable.");
    }

    return admin.id;
  }

  // --- ROUTES EXISTANTES ---

  @Get('conversations')
  async getMyConversations(@Req() req) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.getUserConversations(adminId);
  }
  @Get('unread-count')
  async getMyUnreadCount(@Req() req) {
    // On extrait l'adminId dynamiquement à partir du token de la requête
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.getUnreadMessagesCount(adminId);
  }

  @Get('messages/:conversationId')
  async getConversationMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessagesByConversation(conversationId);
  }

  @Post('conversation/init/:targetAdminId')
  async startConversation(@Req() req, @Param('targetAdminId') targetAdminId: string) {
    const currentAdminId = await this.getAdminIdFromUser(req);
    if (currentAdminId === targetAdminId) {
        throw new BadRequestException("Impossible de se parler à soi-même.");
    }
    return this.chatService.getOrCreateConversation(currentAdminId, targetAdminId);
  }

  @Post('send')
  async sendMessage(@Req() req, @Body() body: { conversationId: string; content: string }) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.saveMessage(adminId, body.conversationId, body.content);
  }

  @Post('read/:conversationId')
  async markAsRead(@Req() req, @Param('conversationId') conversationId: string) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.markMessagesAsRead(conversationId, adminId);
  }

  @Get('contacts')
  async getContacts(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.chatService.getAllAdmins(Number(page), Number(limit));
  }

  // --- NOUVELLES ROUTES (MODIF, SUPPR, TRANSFERT, EPINGLAGE) ---

  /**
   * ✏️ Modifier un message
   */
  @Patch('message/:messageId')
  async editMessage(
    @Req() req,
    @Param('messageId') messageId: string,
    @Body('content') newContent: string
  ) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.editMessage(messageId, adminId, newContent);
  }

  /**
   * 🗑 Supprimer un message
   */
  @Delete('message/:messageId')
  async deleteMessage(@Req() req, @Param('messageId') messageId: string) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.deleteMessage(messageId, adminId);
  }

  /**
   * ➡️ Transférer un message vers une autre conversation
   */
  @Post('message/forward')
  async forwardMessage(
    @Req() req,
    @Body() body: { messageId: string; targetConversationId: string }
  ) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.forwardMessage(body.messageId, adminId, body.targetConversationId);
  }

  /**
   * 📌 Épingler un message (duration: 3, 7 ou 30 jours)
   */
  @Post('message/pin/:messageId')
  async pinMessage(
    @Param('messageId') messageId: string,
    @Body('days') days: number // Reçoit 3, 7 ou 30
  ) {
    if (![3, 7, 30].includes(Number(days))) {
      throw new BadRequestException("La durée d'épinglage doit être de 3, 7 ou 30 jours.");
    }
    return this.chatService.pinMessage(messageId, Number(days));
  }

  /**
   * 📍 Récupérer les messages épinglés d'un chat
   */
  @Get('pinned/:conversationId')
  async getPinned(@Param('conversationId') conversationId: string) {
    return this.chatService.getPinnedMessages(conversationId);
  }
  /**
   * 📊 Récupérer le détail des messages non lus par administrateur
   * Retourne la liste des expéditeurs avec leur nombre de messages non lus respectifs
   */
  @Get('unread-details')
  async getMyUnreadDetails(@Req() req) {
    const adminId = await this.getAdminIdFromUser(req);
    return this.chatService.getUnreadDetailByAdmin(adminId);
  }

}