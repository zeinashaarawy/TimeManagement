import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class UpdateSchedulingRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['FLEXIBLE', 'ROTATIONAL', 'COMPRESSED'])
  @IsOptional()
  type?: 'FLEXIBLE' | 'ROTATIONAL' | 'COMPRESSED';

  @IsString()
  @IsOptional()
  flexInWindow?: string;

  @IsString()
  @IsOptional()
  flexOutWindow?: string;

  @IsString()
  @IsOptional()
  rotationalPattern?: string;

  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  workDaysPerWeek?: number;

  @IsNumber()
  @Min(1)
  @Max(24)
  @IsOptional()
  hoursPerDay?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departmentIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  shiftTemplateIds?: string[];
}
