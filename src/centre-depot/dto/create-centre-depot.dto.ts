// src/centre-depot/dto/create-centre-depot.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCentreDepotDto {
  @ApiProperty({
    description: "Nom officiel du centre de dépôt",
    example: "Lycée Classique de Bafoussam",
  })
  @IsString({ message: "L'intitulé doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "L'intitulé est obligatoire" })
  intitule: string;

  @ApiProperty({
    description: "Localisation précise ou bureau spécifique au sein du centre",
    example: "Bureau du Censeur N°1",
  })
  @IsString({ message: "Le lieu de dépôt doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "Le lieu de dépôt est obligatoire" })
  lieuDepot: string;
}