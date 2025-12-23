import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "Le code matricule de l'administrateur (ex: ADMIN-2025-XXXX)",
    example: 'ADMIN-2025-A1B2',
  })
  @IsString({ message: 'Le code admin doit être une chaîne de caractères' })
  @IsOptional() // Optionnel car le candidat peut utiliser son reçu à la place
  codeAdmin?: string;

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