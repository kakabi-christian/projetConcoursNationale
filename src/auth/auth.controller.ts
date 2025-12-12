import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from './decorators/public.decorator';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-admin')
  @Public()
  async register(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

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

  @Post('verify-otp')
  @Public()
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
