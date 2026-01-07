import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe 
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications') // Pluriel pour respecter les conventions REST
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * CRÉER une notification (souvent appelé par d'autres services en interne)
   */
  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  /**
   * RÉCUPÉRER les notifications d'un utilisateur avec pagination
   * GET /notifications/user/:userId?page=1&limit=10
   */
  @Get('user/:userId')
  findAllByUser(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.notificationService.findAllByUser(userId, +page, +limit);
  }

  /**
   * COMPTEUR des messages non lus
   * GET /notifications/unread-count/:userId
   */
  @Get('unread-count/:userId')
  countUnread(@Param('userId') userId: string) {
    return this.notificationService.countUnread(userId);
  }

  /**
   * MARQUER une notification comme lue
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  /**
   * TOUT MARQUER COMME LU pour un utilisateur
   * PATCH /notifications/read-all/:userId
   */
  @Patch('read-all/:userId')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  /**
   * SUPPRIMER une notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }

  /**
   * SUPPRIMER TOUTES les notifications d'un utilisateur
   * DELETE /notifications/user/:userId/all
   */
  @Delete('user/:userId/all')
  removeAll(@Param('userId') userId: string) {
    return this.notificationService.removeAll(userId);
  }
}