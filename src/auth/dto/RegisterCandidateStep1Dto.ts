// src/auth/dto/register-candidate-step1.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
} from 'class-validator';
import { Region } from '@prisma/client';

/**
 * DTO pour l'étape 1 de l'inscription : Création du User
 * Le candidat renseigne ses informations de base après validation du reçu
 */
export class CreateUserStep1Dto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom requis' })
  nom: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Prénom requis' })
  prenom: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Téléphone requis' })
  telephone: string;

  @IsEnum(Region, { message: 'Région invalide' })
  @IsNotEmpty({ message: 'Région requise' })
  region: Region;
}
