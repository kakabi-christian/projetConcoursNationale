
// src/paiement/dto/verify-otp.dto.ts
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Le code doit être une chaîne de caractères' })
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres' })
  @IsNotEmpty({ message: 'Code OTP requis' })
  code: string;
}