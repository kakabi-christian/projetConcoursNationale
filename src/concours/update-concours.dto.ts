import { PartialType } from '@nestjs/mapped-types';
import { CreateConcoursDto } from './dto/create-concours.dto';
export class UpdateConcoursDto extends PartialType(CreateConcoursDto) {}
