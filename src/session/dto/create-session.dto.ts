import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsDateString({}, { message: 'Date de début invalide' })
  dateDebut: string;

  @IsDateString({}, { message: 'Date de fin invalide' })
  dateFin: string;
}
