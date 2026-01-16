import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsNumber, 
  IsArray, 
  IsEnum, 
  IsDateString, 
  IsNotEmpty 
} from 'class-validator';

// On définit l'enum pour le statut si tu ne l'as pas déjà exporté
export enum ConcoursStatus {
  PLANIFIE = 'PLANIFIE',
  OUVERT = 'OUVERT',
  FERME = 'FERME',
  TERMINE = 'TERMINE'
}

export class CreateConcoursDto {
  @IsString()
  @IsNotEmpty({ message: "Le code est obligatoire" })
  code: string;

  @IsString()
  @IsNotEmpty({ message: "L'intitulé est obligatoire" })
  intitule: string;

  @IsNumber()
  @IsOptional()
  montant?: number;

  @IsEnum(ConcoursStatus, { message: "Le statut doit être PLANIFIE, OUVERT, FERME ou TERMINE" })
  @IsOptional()
  statut?: ConcoursStatus;

  @IsDateString({}, { message: "Format de date de début d'inscription invalide" })
  @IsOptional()
  dateDebutInscription?: string;

  @IsDateString({}, { message: "Format de date de fin d'inscription invalide" })
  @IsOptional()
  dateFinInscription?: string;

  @IsUUID("4", { message: "L'ID de l'année doit être un UUID valide" })
  @IsNotEmpty({ message: "L'année académique est requise" })
  anneeId: string;

  @IsUUID("4", { message: "L'ID de la session doit être un UUID valide" })
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  pieceDossierIds?: string[];
}