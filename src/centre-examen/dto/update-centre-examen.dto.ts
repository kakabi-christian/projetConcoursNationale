// src/centre-examen/dto/update-centre-examen.dto.ts
import { PartialType } from '@nestjs/swagger'; // Important : import de @nestjs/swagger
import { CreateCentreExamenDto } from './create-centre-examen.dto';

/**
 * DTO de mise à jour pour les centres d'examen.
 * Hérite de CreateCentreExamenDto en rendant tous les champs optionnels.
 */
export class UpdateCentreExamenDto extends PartialType(CreateCentreExamenDto) {}