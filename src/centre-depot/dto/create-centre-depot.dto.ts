// src/centre-depot/dto/create-centre-depot.dto.ts
import { IsString } from 'class-validator';

export class CreateCentreDepotDto {
  @IsString()
  intitule: string;

  @IsString()
  lieuDepot: string;
}