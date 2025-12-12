import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAnneeDto {
  @IsString({ message: 'Libellé requis' })
  libelle: string;

  @IsDateString({}, { message: 'Date de début invalide' })
  @IsOptional()
  dateDebut?: string;

  @IsDateString({}, { message: 'Date de fin invalide' })
  @IsOptional()
  dateFin?: string;

  @IsBoolean()
  @IsOptional()
  estActive?: boolean;
}
