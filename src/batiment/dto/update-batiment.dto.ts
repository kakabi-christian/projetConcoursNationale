// src/batiment/dto/update-batiment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBatimentDto } from './create-batiment.dto';

export class UpdateBatimentDto extends PartialType(CreateBatimentDto) {}