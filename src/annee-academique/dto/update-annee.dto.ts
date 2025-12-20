import { PartialType } from '@nestjs/swagger'; // Important : Import de swagger, pas de mapped-types
import { CreateAnneeDto } from './create-annee.dto';

export class UpdateAnneeDto extends PartialType(CreateAnneeDto) {}