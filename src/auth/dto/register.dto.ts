import { IsEmail, IsNotEmpty, IsString, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import indispensable pour Swagger

export class RegisterDto {
  @ApiProperty({
    description: 'Le prénom de l’utilisateur',
    example: 'Dieudonné',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Le nom de famille de l’utilisateur',
    example: 'Nguemo',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'L’adresse email unique pour le compte',
    example: 'd.nguemo@exemple.cm',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone (Format CM: +237)',
    example: '+237670000000',
  })
  @IsPhoneNumber('CM', { message: 'Invalid phone number format for Cameroon' })
  phone: string;

  @ApiProperty({
    description: 'Mot de passe sécurisé (min 6 caractères)',
    example: 'Secured@Pass2025',
    minLength: 6,
    format: 'password', // Masque la saisie dans l'interface Swagger
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}