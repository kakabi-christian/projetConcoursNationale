// src/auth/dto/RegisterCandidateStep4Dto.ts
import { IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour l'étape 4 de l'inscription : Choix des Centres
 * Cette étape finalise l'affectation géographique du candidat pour le concours.
 */
export class RegisterCandidateStep4Dto {
  @ApiProperty({
    description: "ID unique du candidat (obtenu aux étapes précédentes)",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'L\'ID du candidat doit être un UUID valide' })
  @IsNotEmpty({ message: 'L\'ID du candidat est obligatoire' })
  candidateId: string;

  @ApiProperty({
    description: "ID du centre où le candidat déposera son dossier physique",
    example: 'b82d3e5a-7123-4e4e-9876-123456789abc',
  })
  @IsUUID('4', { message: 'ID du centre de dépôt invalide' })
  @IsNotEmpty({ message: 'Le centre de dépôt est requis' })
  centreDepotId: string;

  @ApiProperty({
    description: "ID du centre où le candidat composera (centre d'examen)",
    example: 'c93e4f6b-8234-5f5f-0987-234567890def',
  })
  @IsUUID('4', { message: 'ID du centre d\'examen invalide' })
  @IsNotEmpty({ message: 'Le centre d\'examen est requis' })
  centreExamenId: string;

  @ApiPropertyOptional({
    description: "ID de la session de concours. Si non fourni, le système utilisera la session active par défaut.",
    example: 'd14f5g7h-9345-6g6g-1098-345678901ghi',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de la session invalide' })
  sessionId?: string;
}