// src/auth/dto/login.dto.ts
import { IsEmail, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  // 🔐 ADMIN uniquement
  @IsOptional()
  @IsString()
  password?: string;

  // 🧾 CANDIDATE uniquement
  @IsOptional()
  @IsString()
  numeroRecu?: string;
}
