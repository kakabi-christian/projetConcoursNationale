// src/epreuve/dto/update-epreuve.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEpreuveDto } from './create-epreuve.dto';

export class UpdateEpreuveDto extends PartialType(CreateEpreuveDto) {}
