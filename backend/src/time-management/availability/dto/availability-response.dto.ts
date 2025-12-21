import { ApiProperty } from '@nestjs/swagger';

export enum UnavailabilityReason {
  HOLIDAY = 'HOLIDAY',
  REST_DAY = 'REST_DAY',
  ON_LEAVE = 'ON_LEAVE',
  NO_SHIFT = 'NO_SHIFT',
}

export class WorkingHoursDto {
  @ApiProperty({ example: '09:00' })
  start: string;

  @ApiProperty({ example: '17:00' })
  end: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  employeeId: string;

  @ApiProperty({ example: '2025-01-15' })
  date: string;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ type: WorkingHoursDto, required: false })
  workingHours?: WorkingHoursDto;

  @ApiProperty({
    enum: UnavailabilityReason,
    required: false,
    example: UnavailabilityReason.HOLIDAY,
  })
  reason?: UnavailabilityReason;
}

