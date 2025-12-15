// src/paiement/dto/create-paiement.dto.ts
import { IsString, IsOptional, IsEmail, IsUUID, IsNumber } from 'class-validator';

export class CreatePaiementDto {
  @IsString()
  nomComplet: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  telephone: string;

  @IsUUID()
  concoursId: string; // L'id du concours choisi

  @IsString()
  modePaiement: string; // "ORANGE_MONEY" ou "MTN_MOMO"

  @IsOptional()
  @IsString()
  numeroTransaction?: string; // Optionnel : numéro de transaction si déjà disponible

  @IsOptional()
  @IsNumber()
  montantTotal?: number; // Optionnel : montant payé
}
