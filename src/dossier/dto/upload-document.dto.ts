import { IsNotEmpty, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  // Plus de @IsIn ici pour permettre une évolution dynamique
  field: string;
}