import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../Shift/guards/roles.guard';
import { Roles } from '../Shift/decorators/roles.decorator';
import { AvailabilityService } from './availability.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

@ApiTags('availability')
@Controller('time-management')
@UseGuards(RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * Check employee availability for a specific date
   * GET /time-management/availability
   */
  @Get('availability')
  @Roles('HR Manager', 'HR Admin', 'HR_ADMIN', 'System Admin', 'SYSTEM_ADMIN', 'Manager', 'department head')
  @ApiOperation({
    summary: 'Check employee availability for a specific date',
    description:
      'Returns availability status and working hours if available. Checks holidays, rest days, leaves, and shift assignments.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Employee ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in YYYY-MM-DD format',
    example: '2025-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability information',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid employee ID or date format',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Employee role not allowed',
  })
  async checkAvailability(
    @Query() query: CheckAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    if (!query.employeeId || !query.date) {
      throw new BadRequestException(
        'Both employeeId and date query parameters are required',
      );
    }

    return this.availabilityService.checkAvailability(
      query.employeeId,
      query.date,
    );
  }
}

