// src/archive/dto/update-archive.dto.ts
import { PartialType } from '@nestjs/swagger'; // Correction : import de @nestjs/swagger
import { CreateArchiveDto } from './create-archive.dto';

export class UpdateArchiveDto extends PartialType(CreateArchiveDto) {}