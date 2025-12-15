// src/auth/dto/RegisterCandidateStep4Dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterCandidateStep4Dto {
  @IsUUID()
  candidateId: string; // ✅ L'ID du candidat, obligatoire

  @IsUUID()
  centreDepotId: string; // ✅ Le centre de dépôt choisi par le candidat

  @IsUUID()
  centreExamenId: string; // ✅ Le centre d'examen choisi par le candidat

  @IsOptional()
  @IsUUID()
  sessionId?: string; // ⚡ Optionnel, récupérable automatiquement depuis le concours
}
