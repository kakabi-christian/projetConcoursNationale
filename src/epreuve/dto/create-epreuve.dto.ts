// src/epreuve/dto/create-epreuve.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEpreuveDto {
  @IsString()
  nomEpreuve: string;

  @IsBoolean()
  @IsOptional()
  nonEliminatoire?: boolean;

  @IsString()
  filiereId: string;  // obligatoire

  @IsString()
  @IsOptional()
  niveauId?: string;  // optionnel
}
