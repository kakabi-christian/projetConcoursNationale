// src/archive/dto/create-archive.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateArchiveDto {
  @ApiProperty({
    description: "L'identifiant unique de l'épreuve associée",
    example: '507f1f17b218250000000001',
  })
  @IsString()
  @IsNotEmpty()
  epreuveId: string;

  @ApiProperty({
    description: "L'identifiant de l'année scolaire correspondante",
    example: '507f1f17b218250000000002',
  })
  @IsString()
  @IsNotEmpty()
  anneeId: string;

  @ApiProperty({
    description: "URL ou chemin d'accès vers le fichier stocké (PDF ou Image)",
    example: 'https://mon-stockage.com/archives/epreuve-maths.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}