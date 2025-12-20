// src/auth/dto/register-candidate-step1.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import Swagger
import { Region } from '@prisma/client';

/**
 * DTO pour l'étape 1 de l'inscription : Création du User
 * Le candidat renseigne ses informations de base après validation du reçu
 */
export class CreateUserStep1Dto {
  @ApiProperty({
    description: 'Nom de famille du candidat',
    example: 'TCHATCHOUANG',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom requis' })
  nom: string;

  @ApiProperty({
    description: 'Prénom(s) du candidat',
    example: 'Hubert',
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Prénom requis' })
  prenom: string;

  @ApiProperty({
    description: 'Mot de passe sécurisé (min 6 caractères)',
    example: 'Candidat@2025',
    minLength: 6,
    format: 'password',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @ApiProperty({
    description: 'Adresse email unique pour le compte candidat',
    example: 'hubert.t@exemple.cm',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone de contact',
    example: '+2376XXXXXXXX',
  })
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Téléphone requis' })
  telephone: string;

  @ApiProperty({
    description: 'Région d’origine ou de résidence',
    enum: Region,
    example: Region.LITTORAL, // Utilise l'enum Prisma pour l'exemple
  })
  @IsEnum(Region, { message: 'Région invalide' })
  @IsNotEmpty({ message: 'Région requise' })
  region: Region;
}