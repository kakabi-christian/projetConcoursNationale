import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';
import { RegisterCandidateStep2Dto } from './dto/RegisterCandidateStep2Dto';
import { RegisterCandidateStep3Dto } from './dto/RegisterCandidateStep3Dto';
import { RegisterCandidateStep4Dto } from './dto/RegisterCandidateStep4Dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== REGISTER ADMIN ====================
  @Post('register-admin')
  @Public()
  async register(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  // ==================== LOGIN ====================
 // ==================== LOGIN ====================
@Post('login')
@Public()
async login(@Body() dto: LoginDto & { userType: 'ADMIN' | 'CANDIDATE' }) {
  const { userType } = dto;

  if (!userType) {
    throw new BadRequestException(
      'Le type d’utilisateur est requis (ADMIN ou CANDIDATE).',
    );
  }

  // ✅ PASSER LE DTO COMPLET (email, password, numeroRecu)
  return this.authService.login(dto, userType);
}


  // ==================== REGISTER CANDIDATE STEP 1 ====================
  @Post('register-candidate-step1')
  @Public()
  async registerCandidateStep1(@Body() dto: CreateUserStep1Dto) {
    return this.authService.registerCandidateStep1(dto);
  }
// ==================== REGISTER CANDIDATE STEP 2 ====================
@Post('register-candidate-step2')
@Public()
async registerCandidateStep2(
  @Body() dto: RegisterCandidateStep2Dto, // ✅ Utiliser directement le DTO
) {
  return this.authService.registerCandidateStep2(dto); // ✅ Passer tout le DTO
}

// ==================== REGISTER CANDIDATE STEP 3 ====================
  @Post('register-candidate-step3')
  @Public()
  async registerCandidateStep3(@Body() dto: RegisterCandidateStep3Dto) {
    return this.authService.registerCandidateStep3(dto);
  }

  @Post('register-candidate-step4')
@Public()
async registerCandidateStep4(@Body() dto: RegisterCandidateStep4Dto) {
  return this.authService.registerCandidateStep4(dto.candidateId, dto);
}
  // ==================== GET CANDIDATE INFO ====================
@Get('candidate-info/:id')
@Public()
  async getCandidateInfo(@Param('id') candidateId: string) {
    return this.authService.getCandidateInfo(candidateId);
  }

}
