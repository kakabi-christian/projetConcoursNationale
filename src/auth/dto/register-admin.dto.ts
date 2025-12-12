import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Region } from '@prisma/client';

/**
 * DTO pour l'enregistrement d'un administrateur
 * Crée une entrée dans User (avec userType=ADMIN, isVerified=true) + Admin
 */
export class RegisterAdminDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom requis' })
  nom: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Prénom requis' })
  prenom: string;

  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @IsOptional()
  telephone?: string;

  @IsEnum(Region, { message: 'Région invalide' })
  @IsOptional()
  region?: Region;

  @IsString({ message: 'ID du département invalide' })
  @IsOptional()
  departementId?: string;

  @IsString({ message: 'ID du rôle invalide' })
  @IsOptional()
  roleId?: string; // <- mise à jour ici
}
