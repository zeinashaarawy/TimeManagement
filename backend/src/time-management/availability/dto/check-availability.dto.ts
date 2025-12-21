import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Employee ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

