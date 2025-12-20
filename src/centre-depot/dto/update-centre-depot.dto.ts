// src/centre-depot/dto/update-centre-depot.dto.ts
import { PartialType } from '@nestjs/swagger'; // Utilisation de Swagger pour la documentation héritée
import { CreateCentreDepotDto } from './create-centre-depot.dto';

/**
 * DTO de mise à jour pour les centres de dépôt.
 * Tous les champs du CreateCentreDepotDto deviennent optionnels ici.
 */
export class UpdateCentreDepotDto extends PartialType(CreateCentreDepotDto) {}