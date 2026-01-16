// src/batiment/dto/create-batiment.dto.ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBatimentDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom du bâtiment est requis" })
  nom: string; // ex: "Bloc Pédagogique"

  @IsString()
  @IsNotEmpty({ message: "Le code est requis" })
  @MinLength(2, { message: "Le code doit avoir au moins 2 caractères" })
  @MaxLength(4, { message: "Le code ne doit pas dépasser 4 caractères" })
  code: string; // ex: "CF" ou "BAT"
}