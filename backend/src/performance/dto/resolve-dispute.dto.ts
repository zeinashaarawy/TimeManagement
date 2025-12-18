import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class ResolveDisputeDto {
  @IsEnum(AppraisalDisputeStatus)
  newStatus: AppraisalDisputeStatus; // ✅ renamed to avoid duplicate identifier
  
  @IsOptional()
  @IsString()
  resolutionSummary?: string;

  @IsOptional()
  @IsNumber()
  updatedTotalScore?: number;

  @IsOptional()
  @IsString()
  updatedOverallRatingLabel?: string;


  @IsString()
  @IsNotEmpty()
  decision: string;
}
