// src/paiement/dto/create-paiement.dto.ts
import { IsString, IsOptional, IsEmail, IsUUID } from 'class-validator';

export class CreatePaiementDto {
  @IsString()
  nomComplet: string;

  @IsEmail()
  email: string;

  @IsString()
  telephone: string;

  @IsUUID()
  concoursId: string; // L'id du concours choisi

  @IsString()
  modePaiement: string; // "ORANGE_MONEY" ou "MTN_MOMO"

}
