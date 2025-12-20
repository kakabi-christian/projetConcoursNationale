// src/auth/dto/login.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "L'adresse email de l'utilisateur (Admin ou Candidat)",
    example: 'admin@domaine.com',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: '🔐 Mot de passe (Requis pour les ADMINS uniquement)',
    example: 'MotDePasseSecret123',
    format: 'password',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: '🧾 Numéro de reçu (Requis pour les CANDIDATS uniquement)',
    example: 'REC-2025-XYZ',
  })
  @IsOptional()
  @IsString()
  numeroRecu?: string;
}