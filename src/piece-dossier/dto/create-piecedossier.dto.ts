// src/piecedossier/dto/create-piecedossier.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePieceDossierDto {
  @IsString()
  @IsNotEmpty()
  nom: string; // ex: "Photo de la CNI"

  @IsString()
  @IsOptional() 
  // On le met optionnel si tu veux le générer automatiquement, 
  // mais il est préférable de le recevoir pour contrôler le mapping avec la table Dossier.
  code: string; // ex: "photoCni"
}