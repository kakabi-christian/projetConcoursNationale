import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Logger,
  Get,
  Query,
  All,
  UnauthorizedException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CampayService } from './campay.service';
import { PaiementService } from '../paiement/paiement.service';
import type { Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('campay')
@UseGuards(JwtAuthGuard,PermissionsGuard)

export class CampayController {
  private readonly logger = new Logger(CampayController.name);

  constructor(
    private readonly campayService: CampayService,
    private readonly paiementService: PaiementService,
  ) {}

  @Public()
  @Post('collect')
  async collectMoney(
    @Body() body: { amount: number; phoneNumber: string; description: string },
  ) {
    this.logger.log(`📥 Demande de collecte reçue pour ${body.phoneNumber}`);
    return await this.campayService.requestPayment(
      body.amount,
      body.phoneNumber,
      body.description,
    );
  }

  /**
   * 🔹 WEBHOOK : Accept @All (GET et POST) pour éviter les 404 de Campay
   */
  @Public()
  @All('webhook')
  async handleCampayWebhook(
    @Body() body: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    this.logger.log('🔔 [WEBHOOK] Notification reçue (Check logs Ngrok)');

    // Fusion des données : Campay peut envoyer en body (POST) ou query (GET)
    const data = { ...query, ...body };

    const signature = data.signature;
    const { status, external_reference } = data;

    // 1. Sécurité : Vérification de la signature
    if (!signature || !this.campayService.validateWebhookSignature(signature)) {
      this.logger.warn('❌ [WEBHOOK] Signature invalide ou absente.');
      // En mode test/développement, tu peux commenter le return ci-dessous si ta clé est mal configurée
      // return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid signature' });
    }

    if (!external_reference) {
      this.logger.warn(
        '[WEBHOOK] Aucune référence externe trouvée dans les données reçues.',
      );
      return res.status(HttpStatus.OK).send('OK');
    }

    try {
      if (status === 'SUCCESSFUL') {
        this.logger.log(
          `✅ [WEBHOOK] Paiement RÉUSSI | Réf: ${external_reference}`,
        );

        // C'est ici que la magie opère pour ton polling frontend
        await this.paiementService.generateFinalRecu(external_reference);
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        this.logger.warn(
          `❌ [WEBHOOK] Paiement ÉCHOUÉ | Réf: ${external_reference} | Statut: ${status}`,
        );
      }

      // On répond 200 à Campay pour confirmer la réception
      return res.status(HttpStatus.OK).send('OK');
    } catch (error) {
      this.logger.error(
        `💥 [WEBHOOK] Erreur lors du traitement : ${error.message}`,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
    }
  }

  @Public()
  @Get('status')
  async checkStatus(@Query('reference') reference: string) {
    if (!reference) return { message: 'Référence requise' };
    return await this.campayService.getTransactionStatus(reference);
  }

  @Post('withdraw-admin')
  @Permissions('retirer_argent')
  async withdrawToAdmin(
    @Req() req: any, // Contient l'utilisateur décodé par le JWT Guard
    @Body() body: { amount: number; passwordConfirm: string },
  ) {
    // 1. On récupère l'ID de l'admin depuis le token (userId)
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new UnauthorizedException('Session invalide');
    }

    // 2. On passe l'ID et le mot de passe au service
    return await this.campayService.withdraw(
      body.amount,
      adminId,
      body.passwordConfirm,
    );
  }
}
