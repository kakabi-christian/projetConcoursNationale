import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import Swagger

export class VerifyOtpDto {
  @ApiProperty({
    description: "L'adresse email de l'utilisateur ayant reçu le code",
    example: 'candidat@exemple.cm',
  })
  @IsEmail({}, { message: 'Format d’email invalide' })
  email: string;

  @ApiProperty({
    description: 'Le code de vérification reçu par email (6 chiffres)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Le code OTP est requis' })
  @IsString()
  @Length(6, 6, { message: 'L’OTP doit contenir exactement 6 chiffres' })
  otp: string;
}