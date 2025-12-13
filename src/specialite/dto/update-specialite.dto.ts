// src/specialite/dto/update-specialite.dto.ts
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class UpdateSpecialiteDto {
  @IsString()
  @IsOptional()
  libelle?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUUID()
  @IsOptional()
  filiereId?: string | null; // ✅ permet connect OU disconnect
}
