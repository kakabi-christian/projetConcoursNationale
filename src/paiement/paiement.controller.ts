
// src/paiement/paiement.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { VerifyOtpDto } from './dto/verifiy-otopdto';

@Controller('paiement')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  // Créer un paiement et générer le reçu avec QR Code
  @Post()
  @Public()
  async create(@Body() createPaiementDto: CreatePaiementDto) {
    return this.paiementService.createPaiement(createPaiementDto);
  }

  // 🔐 ÉTAPE 1 : Demander un code OTP (J'ai oublié mon reçu)
  @Post('recu/request-otp')
  @Public()
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.paiementService.requestOtp(requestOtpDto);
  }

  // 🔐 ÉTAPE 2 : Vérifier l'OTP et récupérer le reçu
  @Post('recu/verify-otp')
  @Public()
  async verifyOtpAndGetRecu(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.paiementService.verifyOtpAndGetRecu(verifyOtpDto);
  }
}