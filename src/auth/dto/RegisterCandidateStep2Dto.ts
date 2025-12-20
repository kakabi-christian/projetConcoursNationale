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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Imports Swagger
import { Sexe } from '@prisma/client';

/**
 * Sous-DTO contenant les données détaillées du candidat
 */
export class CandidateDataDto {
  @ApiProperty({ description: 'Date de naissance au format ISO', example: '2005-06-15' })
  @IsDateString({}, { message: 'Date de naissance invalide' })
  @IsNotEmpty({ message: 'Date de naissance requise' })
  dateNaissance: string;

  @ApiProperty({ description: 'Lieu de naissance', example: 'Douala' })
  @IsString({ message: 'Lieu de naissance invalide' })
  @IsNotEmpty({ message: 'Lieu de naissance requis' })
  lieuNaissance: string;

  @ApiProperty({ description: 'Sexe du candidat', enum: Sexe, example: Sexe.MASCULIN })
  @IsEnum(Sexe, { message: 'Sexe invalide' })
  @IsNotEmpty({ message: 'Sexe requis' })
  sexe: Sexe;

  @ApiProperty({ description: 'Nationalité', example: 'Camerounaise' })
  @IsString({ message: 'Nationalité invalide' })
  @IsNotEmpty({ message: 'Nationalité requise' })
  nationalite: string;

  @ApiProperty({ description: 'Ville de résidence actuelle', example: 'Yaoundé' })
  @IsString({ message: 'Ville invalide' })
  @IsNotEmpty({ message: 'Ville requise' })
  ville: string;

  @ApiPropertyOptional({ description: 'Nom complet du père', example: 'M. TCHATCHOUA' })
  @IsString({ message: 'Nom du père invalide' })
  @IsOptional()
  nomPere?: string;

  @ApiPropertyOptional({ description: 'Téléphone du père', example: '+237600000000' })
  @IsString({ message: 'Téléphone du père invalide' })
  @IsOptional()
  telephonePere?: string;

  @ApiPropertyOptional({ description: 'Nom complet de la mère', example: 'Mme EKOLLO' })
  @IsString({ message: 'Nom de la mère invalide' })
  @IsOptional()
  nomMere?: string;

  @ApiPropertyOptional({ description: 'Téléphone de la mère', example: '+237600000000' })
  @IsString({ message: 'Téléphone de la mère invalide' })
  @IsOptional()
  telephoneMere?: string;

  @ApiProperty({ 
    description: 'ID de la spécialité choisie (UUID)', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID('4', { message: 'Spécialité invalide' })
  @IsNotEmpty({ message: 'Spécialité requise' })
  specialiteId: string;
}

/**
 * DTO principal pour l'inscription STEP 2
 */
export class RegisterCandidateStep2Dto {
  @ApiProperty({ 
    description: 'ID de l\'utilisateur créé à l\'étape 1', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID('4', { message: 'ID utilisateur invalide' })
  @IsNotEmpty({ message: 'ID utilisateur requis' })
  userId: string;

  @ApiProperty({ 
    type: CandidateDataDto, // Précise le type pour Swagger
    description: 'Informations complémentaires du profil candidat' 
  })
  @ValidateNested()
  @Type(() => CandidateDataDto)
  @IsNotEmpty({ message: 'Données du candidat requises' })
  data: CandidateDataDto;
}