// src/auth/dto/register-candidate-step3.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Imports Swagger
import { TypeBac, TypeMention } from '@prisma/client';

/**
 * DTO pour l'inscription STEP 3 : Informations Académiques (BAC)
 */
export class RegisterCandidateStep3Dto {
  @ApiProperty({ 
    description: 'ID unique du profil candidat (obtenu à l\'étape 2)', 
    example: '550e8400-e29b-41d4-a716-446655440000' 
  })
  @IsUUID('4', { message: 'ID candidat invalide' })
  @IsNotEmpty({ message: 'ID candidat requis' })
  candidateId: string;

  @ApiPropertyOptional({ 
    description: 'Numéro de la Carte Nationale d\'Identité ou du Passeport', 
    example: '1029384756' 
  })
  @IsString({ message: 'Numéro CNI invalide' })
  @IsOptional()
  numeroCni?: string;

  @ApiProperty({ 
    description: 'Type d\'examen du diplôme d\'entrée', 
    enum: TypeBac, 
    example: TypeBac.GENERAL 
  })
  @IsEnum(TypeBac, { message: 'Type de BAC invalide' })
  @IsNotEmpty({ message: 'Type de BAC requis' })
  typeExamen: TypeBac; // GENERAL, TECHNIQUE, PROFESSIONNEL

  @ApiPropertyOptional({ 
    description: 'Série du diplôme (ex: C, D, TI, G2...)', 
    example: 'C' 
  })
  @IsString({ message: 'Série invalide' })
  @IsOptional()
  serie?: string;

  @ApiProperty({ 
    description: 'Mention obtenue au diplôme', 
    enum: TypeMention, 
    example: TypeMention.ASSEZ_BIEN 
  })
  @IsEnum(TypeMention, { message: 'Mention invalide' })
  @IsNotEmpty({ message: 'Mention requise' })
  Mention: TypeMention; 
}