import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Le nom du rôle',
    example: 'Admin Technique',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du rôle est requis' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description du rôle',
    example: 'Administrateur responsable des aspects techniques',
  })
  @IsString()
  @IsOptional()
  description?: string;
}