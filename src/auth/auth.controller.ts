import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
  Patch,
  Delete,
  Req,
  Res,
  UnauthorizedException, // AJOUTÉ pour Google
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam,
  ApiQuery, 
  ApiBearerAuth
} from '@nestjs/swagger'; 
import { AuthGuard } from '@nestjs/passport'; // AJOUTÉ pour Google
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';
import { RegisterCandidateStep2Dto } from './dto/RegisterCandidateStep2Dto';
import { RegisterCandidateStep3Dto } from './dto/RegisterCandidateStep3Dto';
import { RegisterCandidateStep4Dto } from './dto/RegisterCandidateStep4Dto';
import { UserTypeGuard } from './guards/user-type.guard';
import { PermissionsGuard } from './guards/permissions.guard';

import { UserType } from '@prisma/client';
import { UserTypes } from './decorators/user-types.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@ApiTags('Authentification & Inscription')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // ==================== CHANGEMENT DE MOT DE PASSE ====================

  @Post('change-password')
// Ne pas mettre @Public() ici, car on a besoin du token
async changePassword(@Req() req, @Body() body: any) {
  // 1. Log de debug crucial
  console.log('=== DEBUG AUTH ===');
  console.log('User object from Request:', req.user);

  // 2. Extraction flexible de l'ID
  const userId = req.user?.sub || req.user?.id || req.user?.userId;

  if (!userId) {
    console.error('ERREUR: Aucun ID trouvé dans req.user');
    throw new UnauthorizedException("Impossible d'identifier l'utilisateur à partir du token.");
  }

  const { oldPassword, newPassword } = body;
  return this.authService.changePassword(userId, oldPassword, newPassword);
}

  // ==================== AUTHENTIFICATION GOOGLE ====================

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirection vers la fenêtre de connexion Google' })
  async googleAuth(@Req() req) {
    // Cette route déclenche la redirection vers Google
  }

@Get('google/callback')
@Public()
@UseGuards(AuthGuard('google'))
async googleAuthRedirect(@Req() req, @Res() res) {
  const result = await this.authService.googleLogin(req);
  
  const token = result.access_token;
  const registrationStep = result.registrationStep;
  const candidateId = result.user.candidateId || '';

  // On redirige vers la home du candidat
  // On passe le token et les infos essentielles dans l'URL pour que React les stocke
  return res.redirect(
    `http://localhost:3001/candidat/home?token=${token}&step=${registrationStep}&candidateId=${candidateId}`
  );
}

// ==================== AUTHENTIFICATION GITHUB ====================

  @Get('github')
  @Public()
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Redirection vers la fenêtre de connexion GitHub' })
  async githubAuth(@Req() req) {
    // Déclenche la redirection vers GitHub
  }

  @Get('github/callback')
  @Public()
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req, @Res() res) {
    // Appel d'une méthode githubLogin dans ton service
    const result = await this.authService.githubLogin(req);
    
    const token = result.access_token;
    const registrationStep = result.registrationStep;
    const candidateId = result.user.candidateId || '';

    // Redirection vers ton Frontend (ajuste le port 3001 si nécessaire)
    return res.redirect(
      `http://localhost:3001/candidat/home?token=${token}&step=${registrationStep}&candidateId=${candidateId}`
    );
  }

  // ==================== LISTER LES ADMINS (PAGINATION) ====================
  @Get('admins')
  @ApiOperation({ summary: 'Récupérer la liste paginée des administrateurs' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
  ) {
    return this.authService.findAllAdmins(page, limit);
  }

  // ==================== REGISTER ADMIN ====================
  @Post('register-admin')
  @Permissions('creer_administrateur')
  @UserTypes(UserType.SUPERADMIN)
  @UseGuards(UserTypeGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Enregistrer un nouvel administrateur (User + Admin)' })
  @ApiResponse({ status: 201, description: 'Administrateur créé avec succès.' })
  async register(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  // ==================== LOGIN CLASSIQUE ====================
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
  async login(@Body() dto: LoginDto & { userType: 'ADMIN' | 'CANDIDATE' }) {
    const { userType } = dto;
    if (!userType) {
      throw new BadRequestException('Le type d’utilisateur est requis (ADMIN ou CANDIDATE).');
    }
    return this.authService.login(dto, userType);
  }

  // ==================== REGISTER CANDIDATE STEPS ====================
  @Post('register-candidate-step1')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 1 : Création du compte utilisateur' })
  async registerCandidateStep1(@Body() dto: CreateUserStep1Dto) {
    return this.authService.registerCandidateStep1(dto);
  }

  @Post('register-candidate-step2')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 2 : Profil civil et spécialité' })
  async registerCandidateStep2(@Body() dto: RegisterCandidateStep2Dto) {
    return this.authService.registerCandidateStep2(dto);
  }

  @Post('register-candidate-step3')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 3 : Informations académiques (BAC)' })
  async registerCandidateStep3(@Body() dto: RegisterCandidateStep3Dto) {
    return this.authService.registerCandidateStep3(dto);
  }

  @Post('register-candidate-step4')
  @Public()
  @ApiOperation({ summary: 'Inscription Étape 4 : Choix des centres et finalisation' })
  async registerCandidateStep4(@Body() dto: RegisterCandidateStep4Dto) {
    return this.authService.registerCandidateStep4(dto.candidateId, dto);
  }

  // ==================== GESTION ADMINS & INFO ====================
  @Get('candidate-info/:id')
  @Public()
  @ApiOperation({ summary: 'Récupérer le récapitulatif complet d\'un candidat' })
  async getCandidateInfo(@Param('id') candidateId: string) {
    return this.authService.getCandidateInfo(candidateId);
  }

  @Patch('admins/:id')
  @UserTypes(UserType.SUPERADMIN)
  @Permissions('modifier_administrateur')
  @UseGuards(UserTypeGuard, PermissionsGuard)
  updateAdmin(@Param('id') id: string, @Body() dto: Partial<RegisterAdminDto>) {
    return this.authService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  @UserTypes(UserType.SUPERADMIN)
  @Permissions('supprimer_administrateur')
  @UseGuards(UserTypeGuard, PermissionsGuard)
  deleteAdmin(@Param('id') id: string) {
    return this.authService.deleteAdmin(id);
  }
  // ==================== RÉCUPÉRATION DU PROFIL (PONT GOOGLE/DASHBOARD) ====================

  @Get('profile')
  @ApiOperation({ summary: 'Récupère les infos de l’utilisateur connecté à partir du token JWT' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré.' })
  async getProfile(@Req() req) {
    // Si tu utilises un JwtStrategy standard, Passport attache l'user à req.user
    // C'est ici que React récupère l'ID pour charger le dashboard
    return req.user;
  }
  
  
}