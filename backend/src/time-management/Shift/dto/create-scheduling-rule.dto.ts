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

export class CreateSchedulingRuleDto {
  @IsString()
  name: string;

  @IsEnum(['FLEXIBLE', 'ROTATIONAL', 'COMPRESSED'])
  type: 'FLEXIBLE' | 'ROTATIONAL' | 'COMPRESSED';

  @IsString()
  @IsOptional()
  flexInWindow?: string; // e.g., "08:00-10:00"

  @IsString()
  @IsOptional()
  flexOutWindow?: string; // e.g., "17:00-19:00"

  @IsString()
  @IsOptional()
  rotationalPattern?: string; // e.g., "2 days morning, 2 days night"

  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  workDaysPerWeek?: number; // e.g., 4

  @IsNumber()
  @Min(1)
  @Max(24)
  @IsOptional()
  hoursPerDay?: number; // e.g., 10

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
