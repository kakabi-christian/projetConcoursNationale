import { 
  IsNotEmpty, 
  IsString, 
  IsDateString, 
  IsEnum, 
  IsOptional, 
  IsUUID,
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Sexe } from '@prisma/client';

/**
 * Sous-DTO contenant les données du candidat
 */
export class CandidateDataDto {
  @IsDateString({}, { message: 'Date de naissance invalide' })
  @IsNotEmpty({ message: 'Date de naissance requise' })
  dateNaissance: string;

  @IsString({ message: 'Lieu de naissance invalide' })
  @IsNotEmpty({ message: 'Lieu de naissance requis' })
  lieuNaissance: string;

  @IsEnum(Sexe, { message: 'Sexe invalide' })
  @IsNotEmpty({ message: 'Sexe requis' })
  sexe: Sexe;

  @IsString({ message: 'Nationalité invalide' })
  @IsNotEmpty({ message: 'Nationalité requise' })
  nationalite: string;

  @IsString({ message: 'Ville invalide' })
  @IsNotEmpty({ message: 'Ville requise' })
  ville: string;

  @IsString({ message: 'Nom du père invalide' })
  @IsOptional()
  nomPere?: string;

  @IsString({ message: 'Téléphone du père invalide' })
  @IsOptional()
  telephonePere?: string;

  @IsString({ message: 'Nom de la mère invalide' })
  @IsOptional()
  nomMere?: string;

  @IsString({ message: 'Téléphone de la mère invalide' })
  @IsOptional()
  telephoneMere?: string;

  @IsUUID('4', { message: 'Spécialité invalide' })
  @IsNotEmpty({ message: 'Spécialité requise' })
  specialiteId: string;
}

/**
 * DTO principal pour l'inscription STEP 2
 * Format accepté : { userId: "...", data: { dateNaissance, sexe, ... } }
 */
export class RegisterCandidateStep2Dto {
  @IsUUID('4', { message: 'ID utilisateur invalide' })
  @IsNotEmpty({ message: 'ID utilisateur requis' })
  userId: string;

  @ValidateNested()
  @Type(() => CandidateDataDto)
  @IsNotEmpty({ message: 'Données du candidat requises' })
  data: CandidateDataDto;
}