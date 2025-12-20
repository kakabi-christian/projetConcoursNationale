import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam 
} from '@nestjs/swagger'; // Imports Swagger
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';
import { RegisterCandidateStep2Dto } from './dto/RegisterCandidateStep2Dto';
import { RegisterCandidateStep3Dto } from './dto/RegisterCandidateStep3Dto';
import { RegisterCandidateStep4Dto } from './dto/RegisterCandidateStep4Dto';

@ApiTags('Authentification & Inscription')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== REGISTER ADMIN ====================
  @Post('register-admin')
  @Public()
  @ApiOperation({ summary: 'Enregistrer un nouvel administrateur (User + Admin)' })
  @ApiResponse({ status: 201, description: 'Administrateur créé avec succès.' })
  async register(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  // ==================== LOGIN ====================
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Connexion hybride (Admin via Password ou Candidat via Reçu)' })
  @ApiBody({ 
    description: 'Données de connexion + type utilisateur',
    schema: {
      allOf: [{ $ref: '#/components/schemas/LoginDto' }],
      properties: {
        userType: { type: 'string', enum: ['ADMIN', 'CANDIDATE'], example: 'CANDIDATE' }
      },
      required: ['userType']
    }
  })
  @ApiResponse({ status: 200, description: 'Connexion réussie, retourne le JWT.' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides.' })
  async login(@Body() dto: LoginDto & { userType: 'ADMIN' | 'CANDIDATE' }) {
    const { userType } = dto;

    if (!userType) {
      throw new BadRequestException(
        'Le type d’utilisateur est requis (ADMIN ou CANDIDATE).',
      );
    }

    return this.authService.login(dto, userType);
  }

  // ==================== REGISTER CANDIDATE STEP 1 ====================
  @Post('register-candidate-step1')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 1 : Création du compte utilisateur' })
  async registerCandidateStep1(@Body() dto: CreateUserStep1Dto) {
    return this.authService.registerCandidateStep1(dto);
  }

  // ==================== REGISTER CANDIDATE STEP 2 ====================
  @Post('register-candidate-step2')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 2 : Profil civil et spécialité' })
  async registerCandidateStep2(@Body() dto: RegisterCandidateStep2Dto) {
    return this.authService.registerCandidateStep2(dto);
  }

  // ==================== REGISTER CANDIDATE STEP 3 ====================
  @Post('register-candidate-step3')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 3 : Informations académiques (BAC)' })
  async registerCandidateStep3(@Body() dto: RegisterCandidateStep3Dto) {
    return this.authService.registerCandidateStep3(dto);
  }

  // ==================== REGISTER CANDIDATE STEP 4 ====================
  @Post('register-candidate-step4')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 4 : Choix des centres et finalisation' })
  async registerCandidateStep4(@Body() dto: RegisterCandidateStep4Dto) {
    return this.authService.registerCandidateStep4(dto.candidateId, dto);
  }

  // ==================== GET CANDIDATE INFO ====================
  @Get('candidate-info/:id')
  @Public()
  @ApiOperation({ summary: 'Récupérer le récapitulatif complet d\'un candidat' })
  @ApiParam({ name: 'id', description: 'ID du candidat' })
  async getCandidateInfo(@Param('id') candidateId: string) {
    return this.authService.getCandidateInfo(candidateId);
  }
}