import { IsString, IsOptional } from 'class-validator';

export class CreateCentreExamenDto {
  @IsString()
  intitule: string;

  @IsString()
  @IsOptional()
  lieuCentre?: string;
}