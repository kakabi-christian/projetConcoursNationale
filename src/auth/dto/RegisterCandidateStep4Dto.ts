import { IsOptional, IsString } from 'class-validator';

export class RegisterCandidateStep4Dto {
  @IsOptional()
  @IsString({ message: 'Nom du tuteur invalide' })
  nomTuteur?: string;

  @IsOptional()
  @IsString({ message: 'Téléphone du tuteur invalide' })
  telephoneTuteur?: string;

  @IsOptional()
  @IsString({ message: 'Centre d\'examen invalide' })
  centreExamenId?: string;

  @IsOptional()
  @IsString({ message: 'Spécialité invalide' })
  specialiteId?: string;
}
