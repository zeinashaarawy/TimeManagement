import { IsString, IsOptional } from 'class-validator';

export class ResolveNotificationDto {
  @IsString()
  @IsOptional()
  resolutionNotes?: string; // Notes about how it was resolved (renewed, replaced, etc.)
}
