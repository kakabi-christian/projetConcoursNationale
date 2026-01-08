import { Controller, Post, Body, Get, Param, Res, NotFoundException, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verifiy-otopdto';
import { Public } from 'src/auth/decorators/public.decorator';
import type { Response } from 'express';

@Controller('paiement')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  // 1. Initialiser le paiement (Renvoie l'URL vers NotchPay)
  @Post()
  @Public()
  async create(@Body() createPaiementDto: CreatePaiementDto) {
    return this.paiementService.createPaiement(createPaiementDto);
  }

  /**
   * 2. WEBHOOK : Reçoit les notifications automatiques de NotchPay
   * C'est ici que la transaction est validée officiellement en base de données
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    console.log('[Webhook] Événement reçu :', payload.event);

    // NotchPay envoie 'payment.complete' quand l'argent est encaissé
    if (payload.event === 'payment.complete' || payload.event === 'transaction.complete') {
      // Priorité à item_reference (ton TX-...) sinon on prend reference (trx...)
      const reference = payload.data.item_reference || payload.data.reference;
      
      console.log(`[Webhook] Traitement de la validation pour : ${reference}`);
      
      // Cette méthode va chercher le paiement, générer le reçu et envoyer l'email
      await this.paiementService.finalizePaiement(reference);
    }
    
    return { received: true };
  }

  /**
   * 3. CALLBACK : Redirige le candidat vers le site après son paiement
   * C'est purement visuel pour l'expérience utilisateur (UX)
   */
  @Get('callback')
  @Public()
  async handleCallback(@Query() query: any, @Res() res: Response) {
    const reference = query.reference; // Souvent le trx... de NotchPay
    console.log(`[Callback] Redirection du candidat pour : ${reference}`);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // On renvoie vers React avec les paramètres dans l'URL
    // React utilisera ensuite l'endpoint /info (ci-dessous) pour afficher le reçu
    return res.redirect(`${frontendUrl}/Paiement?reference=${reference}&status=complete`);
  }

  // 📄 Génère et stream le fichier PDF du reçu
  @Get('recu/:numeroTransaction/pdf')
  @Public()
  async getRecuPdf(@Param('numeroTransaction') numeroTransaction: string, @Res() res: Response) {
    const recuData = await this.paiementService.getRecuByTransaction(numeroTransaction);
    
    if (!recuData) {
      console.error(`[PDF] Aucun reçu trouvé pour : ${numeroTransaction}`);
      throw new NotFoundException('Reçu introuvable. Le paiement est peut-être encore en cours.');
    }
    
    await this.paiementService.generatePdf(recuData, res);
  }

  // 🔍 Récupère les informations complètes d'un paiement pour affichage dans React
  @Get('recu/:reference/info')
  @Public()
  async getPaiementInfo(@Param('reference') reference: string) {
    // Le service va chercher soit par le numéro de reçu, soit par le TX-..., soit par le trx...
    return this.paiementService.getPaiementInfoByRecu(reference);
  }

  // --- LOGIQUE OTP & INSCRIPTION ---

  @Post('recu/request-otp')
  @Public()
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.paiementService.requestOtp(requestOtpDto);
  }

  @Post('recu/verify-otp')
  @Public()
  async verifyOtpAndGetRecu(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.paiementService.verifyOtpAndGetRecu(verifyOtpDto);
  }

  @Post('inscription/verify-recu')
  @Public()
  async verifyRecuForRegistration(@Body() verifyRecuDto: { numeroRecu: string }) {
    return this.paiementService.verifyRecuForRegistration(verifyRecuDto.numeroRecu);
  }
}