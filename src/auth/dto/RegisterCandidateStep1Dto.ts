import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterCandidateStep1Dto {
  @IsString({ message: 'Numéro de reçu invalide' })
  @IsNotEmpty({ message: 'Numéro de reçu requis' })
  numeroRecu: string;

  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Nom requis' })
  nom: string;

  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Prénom requis' })
  prenom: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Téléphone requis' })
  @IsNotEmpty({ message: 'Téléphone requis' })
  telephone: string;
}
