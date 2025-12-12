import { IsNotEmpty, IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Region } from '@prisma/client';

export class RegisterCandidateStep2Dto {
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @IsEnum(Region, { message: 'Région invalide' })
  @IsNotEmpty({ message: 'Région requise' })
  region: Region;

  @IsDateString({}, { message: 'Date de naissance invalide' })
  @IsNotEmpty({ message: 'Date de naissance requise' })
  dateNaissance: string;

  @IsString({ message: 'Le lieu de naissance doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Lieu de naissance requis' })
  lieuNaissance: string;

  @IsString({ message: 'Le sexe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Sexe requis' })
  sexe: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  nationalite?: string;
}
