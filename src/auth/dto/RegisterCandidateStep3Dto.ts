
// src/auth/dto/register-candidate-step3.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsOptional,
  IsUUID,
} from 'class-validator';
import { TypeBac, TypeMention } from '@prisma/client';

/**
 * DTO pour l'inscription STEP 3 : Documents
 * Le candidat renseigne ses informations sur le BAC
 */
export class RegisterCandidateStep3Dto {
  @IsUUID('4', { message: 'ID candidat invalide' })
  @IsNotEmpty({ message: 'ID candidat requis' })
  candidateId: string;

  @IsString({ message: 'Numéro CNI invalide' })
  @IsOptional()
  numeroCni?: string;

  @IsEnum(TypeBac, { message: 'Type de BAC invalide' })
  @IsNotEmpty({ message: 'Type de BAC requis' })
  typeExamen: TypeBac; // GENERAL, TECHNIQUE, PROFESSIONNEL

  @IsString({ message: 'Série invalide' })
  @IsOptional()
  serie?: string; // Ex: C, D, A, E

  @IsEnum(TypeMention, { message: 'Mention invalide' })
  @IsNotEmpty({ message: 'Mention requise' })
  Mention: TypeMention; // PASSABLE, BIEN, TRES_BIEN, EXCELLENT, ASSEZ_BIEN
}