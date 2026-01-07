import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType; // Correction ici : suppression de ";nType;"

  @IsBoolean()
  @IsOptional()
  isBroadcast?: boolean;

  @IsOptional()
  sentAt?: Date;
}