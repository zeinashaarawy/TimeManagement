import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RenewAssignmentDto {
  @IsDateString()
  effectiveTo: string; // New expiry date (ISO 8601 format)

  @IsString()
  @IsOptional()
  reason?: string; // Reason for renewal/extension
}
