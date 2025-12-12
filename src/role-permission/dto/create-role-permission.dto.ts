import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRolePermissionDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  permissionId: string;
}
