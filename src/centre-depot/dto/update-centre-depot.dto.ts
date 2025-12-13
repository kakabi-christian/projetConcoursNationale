// src/centre-depot/dto/update-centre-depot.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateCentreDepotDto {
  @IsString()
  @IsOptional()
  intitule?: string;

  @IsString()
  @IsOptional()
  lieuDepot?: string;
}