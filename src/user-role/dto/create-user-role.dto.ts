import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}
