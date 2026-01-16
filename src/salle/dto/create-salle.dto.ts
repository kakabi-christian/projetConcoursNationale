import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateSalleDto {
  @IsInt({ message: "La capacité doit être un nombre entier" })
  @Min(1, { message: "La capacité doit être d'au moins 1 place" })
  @IsOptional()
  capacite?: number; // Par défaut 50 selon ton modèle Prisma

  @IsString()
  @IsNotEmpty({ message: "L'ID du bâtiment est requis pour lier la salle" })
  batimentId: string;
}