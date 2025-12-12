import { Controller, Post, Body } from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('paiement')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  // Créer un paiement et générer le reçu avec QR Code
  @Post()
  @Public()
  async create(@Body() createPaiementDto: CreatePaiementDto) {
    return this.paiementService.createPaiement(createPaiementDto);
  }
}
