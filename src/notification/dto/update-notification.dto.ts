import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean; // Le champ le plus souvent mis à jour (marquer comme lu)

  @IsBoolean()
  @IsOptional()
  isBroadcast?: boolean;
}