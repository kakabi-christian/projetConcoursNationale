import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbacksService } from './feebacks.service';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  /**
   * Créer ou mettre à jour le feedback d'un utilisateur (Upsert)
   * POST /feedbacks
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    // Cette méthode appellera ton service avec l'upsert
    return this.feedbacksService.create(createFeedbackDto);
  }

  /**
   * Récupérer la liste complète des feedbacks (pour l'admin)
   * GET /feedbacks
   */
  @Get()
  async getAll() {
    return this.feedbacksService.findAll();
  }

  /**
   * Récupérer la note moyenne de la plateforme
   * GET /feedbacks/stats/average
   */
  @Get('stats/average')
  async getAverage() {
    return this.feedbacksService.getAverageRating();
  }
}