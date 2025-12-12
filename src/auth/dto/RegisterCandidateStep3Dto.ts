import { IsOptional, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { TypeBac, TypeMention } from '@prisma/client';

export class RegisterCandidateStep3Dto {
  @IsOptional()
  @IsEnum(TypeBac, { message: 'Type de bac invalide' })
  typeBac?: TypeBac;

  @IsOptional()
  @IsString({ message: 'Série invalide' })
  serie?: string;

  @IsOptional()
  @IsEnum(TypeMention, { message: 'Mention invalide' })
  mention?: TypeMention;

  @IsString({ message: 'Le CNI doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Numéro CNI requis' })
  cni: string;

  @IsOptional()
  @IsString()
  matricule?: string;
}
