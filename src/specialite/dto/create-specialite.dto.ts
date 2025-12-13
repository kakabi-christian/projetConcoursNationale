// src/specialite/dto/create-specialite.dto.ts
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateSpecialiteDto {
  @IsString()
  libelle: string;

  @IsString()
  code: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUUID()
  @IsOptional() // ✅ nullable pour ne pas casser les données existantes
  filiereId?: string;
}
