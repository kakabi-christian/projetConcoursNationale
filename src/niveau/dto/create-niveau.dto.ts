// src/niveau/dto/create-niveau.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateNiveauDto {
  @IsString()
  intitule: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsInt()
  @IsOptional()
  ordre?: number;
}
