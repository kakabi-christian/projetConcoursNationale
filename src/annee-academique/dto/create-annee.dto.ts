import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAnneeDto {

  @ApiProperty({
    description: 'Libellé de l’année académique',
    example: '2024-2025',
  })
  @IsString({ message: 'Libellé requis' })
  libelle: string;

  @ApiPropertyOptional({
    description: 'Date de début de l’année académique',
    example: '2024-09-01',
    format: 'date',
  })
  // Correction ici : on passe un objet vide en premier argument
  @IsDateString({}, { message: 'Date de début invalide' })
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de fin de l’année académique',
    example: '2025-07-31',
    format: 'date',
  })
  // Correction ici : même chose pour la date de fin
  @IsDateString({}, { message: 'Date de fin invalide' })
  @IsOptional()
  dateFin?: string;

  @ApiPropertyOptional({
    description: 'Indique si l’année académique est active',
    example: true,
    default: false,
  })
  @IsBoolean({ message: 'La valeur doit être un booléen' }) // Ajout d'options de message pour la cohérence
  @IsOptional()
  estActive?: boolean;
}