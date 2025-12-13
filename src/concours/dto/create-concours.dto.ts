import { IsString, IsOptional, IsUUID, IsNumber, IsArray } from 'class-validator';

export class CreateConcoursDto {
  @IsString()
  code: string;  // code unique du concours

  @IsString()
  intitule: string;  // nom du concours

  @IsNumber()
  @IsOptional()
  montant?: number;  // montant d'inscription éventuel

  @IsUUID()
  @IsOptional()
  anneeId?: string;  // année académique liée, facultatif

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  sessionIds?: string[];  // IDs des sessions liées, facultatif

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  pieceDossierIds?: string[]; // <-- IDs des pièces de dossier à associer
}
