// src/paiement/dto/verify-recu.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO pour vérifier un numéro de reçu
 * Utilisé pour l'étape 1 de l'inscription
 */
export class VerifyRecuDto {
  @IsString({ message: 'Le numéro de reçu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Numéro de reçu requis' })
  numeroRecu: string;
}