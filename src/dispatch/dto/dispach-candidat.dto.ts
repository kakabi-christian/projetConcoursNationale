import { IsString, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class DispatchCandidatesDto {
  @IsUUID()
  @IsNotEmpty()
  concoursId: string;

  @IsUUID()
  @IsNotEmpty()
  centreExamenId: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty()
  salleIds: string[]; // La liste des salles sélectionnées par l'admin
}