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

  @IsUUID()
  @IsOptional()
  sessionId?: string;  // ID de la session liée, facultatif (relation 1:1)

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  pieceDossierIds?: string[]; // IDs des pièces de dossier à associer
}
// 21c2bc06-7d4f-4cd6-ab6a-6cea7e7ab20c
// 61a1e0e2-0c81-42b2-ace4-5a27579a2791