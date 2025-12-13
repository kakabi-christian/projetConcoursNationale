// src/archive/dto/create-archive.dto.ts
import { IsString } from 'class-validator';

export class CreateArchiveDto {
  @IsString()
  epreuveId: string; // ID de l'épreuve

  @IsString()
  anneeId: string; // ID de l'année scolaire

  @IsString()
  fileUrl: string; // URL ou chemin du fichier (photo ou PDF)
}
