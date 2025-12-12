// src/paiement/dto/find-recu.dto.ts
import { IsEmail } from 'class-validator';

export class FindRecuDto {
  @IsEmail()
  email: string;
}
