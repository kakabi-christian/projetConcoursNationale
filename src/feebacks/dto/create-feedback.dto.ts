import { IsString, IsNotEmpty, IsUUID, MinLength, IsInt, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  comment: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty({ message: "La note est obligatoire et doit être comprise entre 1 et 5" })
  note: number;
}