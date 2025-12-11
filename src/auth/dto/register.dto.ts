import { IsEmail, IsNotEmpty, IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('CM', { message: 'Invalid phone number format for Cameroon' })
  phone: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}



