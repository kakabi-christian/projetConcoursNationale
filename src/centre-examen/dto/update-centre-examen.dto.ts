import { IsString, IsOptional } from 'class-validator';

export class UpdateCentreExamenDto {
  @IsString()
  @IsOptional()
  intitule?: string;

  @IsString()
  @IsOptional()
  lieuCentre?: string;
}