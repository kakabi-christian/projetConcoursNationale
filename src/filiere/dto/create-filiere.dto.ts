// src/filiere/dto/create-filiere.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateFiliereDto {
  @IsString()
  intitule: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  departementId?: string; // relation optionnelle avec Departement
}
