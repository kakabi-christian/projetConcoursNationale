// src/paiement/paiement.controller.ts
import { Controller, Post, Body, Get, Param, Res, NotFoundException, Query } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verifiy-otopdto';
import { Public } from 'src/auth/decorators/public.decorator';
import type { Response } from 'express';

@Controller('paiement')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  /**
   * 1. INITIER LE PAIEMENT (Collecte via Campay)
   */
  @Post()
  @Public()
  async create(@Body() createPaiementDto: CreatePaiementDto) {
    // Cette méthode déclenche le push OTP et crée le paiement en statut PENDING
    return this.paiementService.createPaiement(createPaiementDto);
  }

  /**
   * 2. VÉRIFIER LE STATUT DU REÇU (Polling)
   * Le frontend appelle cette route toutes les 3 secondes pour savoir si le reçu est prêt.
   */
  @Get('check-status/:externalReference')
  @Public()
  async checkStatus(@Param('externalReference') externalReference: string) {
    const recu = await this.paiementService.getRecuByExternalRef(externalReference);
    
    if (!recu) {
      return { 
        status: 'PENDING', 
        message: 'Paiement en cours de validation sur le mobile...' 
      };
    }

    return { 
      status: 'SUCCESSFUL', 
      recu 
    };
  }

  /**
   * 3. GÉNÉRER LE PDF DU REÇU
   */
  @Get('recu/:numeroTransaction/pdf')
  @Public()
  async getRecuPdf(@Param('numeroTransaction') numeroTransaction: string, @Res() res: Response) {
    const recuData = await this.paiementService.getRecuByTransaction(numeroTransaction);
    if (!recuData) {
      throw new NotFoundException('Reçu introuvable');
    }

    this.paiementService.generatePdf(recuData, res);
  }

  /**
   * 4. GESTION DES REÇUS OUBLIÉS (OTP)
   */
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
  

  /**
   * 5. VÉRIFICATION POUR INSCRIPTION
   */
  @Post('inscription/verify-recu')
  @Public()
  async verifyRecuForRegistration(@Body() verifyRecuDto: { numeroRecu: string }) {
    return this.paiementService.verifyRecuForRegistration(verifyRecuDto.numeroRecu);
  }

  /**
   * 6. INFOS PAIEMENT PAR REÇU
   */
  @Get('recu/:numeroRecu/info')
  @Public()
  async getPaiementInfo(@Param('numeroRecu') numeroRecu: string) {
    return this.paiementService.getPaiementInfoByRecu(numeroRecu);
  }
}