import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartementDto {
  @IsString()
  @IsNotEmpty()
  nomDep: string;
}
