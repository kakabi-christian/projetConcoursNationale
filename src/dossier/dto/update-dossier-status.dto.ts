import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocStatus } from '@prisma/client';

export class UpdateDossierStatusDto {
  @IsEnum(DocStatus)
  statut: DocStatus;

  @IsString()
  @IsOptional()
  commentaire?: string; // Motif en cas de rejet (ex: "La photo CNI est illisible")
}