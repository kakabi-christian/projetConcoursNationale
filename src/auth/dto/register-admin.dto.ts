import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Imports Swagger
import { Region } from '@prisma/client';

/**
 * DTO pour l'enregistrement d'un administrateur
 */
export class RegisterAdminDto {
  @ApiProperty({
    description: "L'adresse email qui servira d'identifiant",
    example: 'admin.tech@concours.com',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({
    description: 'Le mot de passe de connexion (min 6 caractères)',
    example: 'Admin@2025!',
    minLength: 6,
    format: 'password',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @ApiProperty({
    description: "Le nom de famille de l'administrateur",
    example: 'MBARGA',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom requis' })
  nom: string;

  @ApiProperty({
    description: "Le prénom de l'administrateur",
    example: 'Jean-Pierre',
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Prénom requis' })
  prenom: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone de contact',
    example: '+237690000000',
  })
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({
    description: 'La région géographique rattachée',
    enum: Region, // Swagger affichera automatiquement une liste déroulante des régions Prisma
  })
  @IsEnum(Region, { message: 'Région invalide' })
  @IsOptional()
  region?: Region;

  @ApiPropertyOptional({
    description: "L'ID unique du département (UUID)",
    example: 'dept-123-abc',
  })
  @IsString({ message: 'ID du département invalide' })
  @IsOptional()
  departementId?: string;

  @ApiPropertyOptional({
    description: "L'ID du rôle assigné (RBAC)",
    example: 'role-super-admin-uuid',
  })
  @IsString({ message: 'ID du rôle invalide' })
  @IsOptional()
  roleId?: string;
}