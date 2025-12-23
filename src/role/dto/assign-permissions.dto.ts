import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Liste des IDs de permissions à assigner au rôle',
    example: ['uuid-permission-1', 'uuid-permission-2'],
    type: [String],
  })
  @IsArray({ message: 'Les permissions doivent être un tableau' })
  @IsNotEmpty({ message: 'Au moins une permission est requise' })
  @IsString({ each: true, message: 'Chaque permission doit être un ID valide' })
  permissionIds: string[];
}