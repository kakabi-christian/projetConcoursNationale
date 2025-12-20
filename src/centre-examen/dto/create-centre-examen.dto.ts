// src/centre-examen/dto/create-centre-examen.dto.ts
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCentreExamenDto {
  @ApiProperty({
    description: "Nom officiel du centre d'examen (ex: Lycée, Université)",
    example: "Lycée Bilingue de Deido",
  })
  @IsString({ message: "L'intitulé doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "L'intitulé est obligatoire" })
  intitule: string;

  @ApiPropertyOptional({
    description: "Précision sur la localisation ou le quartier du centre",
    example: "Douala 1er, Rue de la Joie",
  })
  @IsString({ message: "Le lieu du centre doit être une chaîne de caractères" })
  @IsOptional()
  lieuCentre?: string;
}