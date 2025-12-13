import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from './decorators/public.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';

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
  @Post('login')
  @Public()
  async login(
    @Body() dto: LoginDto & { userType: 'ADMIN' | 'CANDIDATE' }, // Ajouter userType dans le body
  ) {
    const { email, password, userType } = dto;

    if (!userType) {
      throw new BadRequestException('Le type d’utilisateur est requis (ADMIN ou CANDIDATE).');
    }

    return this.authService.login({ email, password }, userType);
  }

  // ==================== REGISTER CANDIDATE STEP 2 ====================
  @Post('register-candidate-step2')
  @Public()
  async registerCandidateStep2(@Body() dto: CreateUserStep1Dto) {
    return this.authService.registerCandidateStep1(dto);
  }
}
