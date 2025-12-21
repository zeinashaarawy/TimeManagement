import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { PermissionValidationService } from '../services/permission-validation.service';
import { RolesGuard } from '../../Shift/guards/roles.guard';
import { Roles } from '../../Shift/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionType } from '../../enums/index';
import { Types } from 'mongoose';

class ValidatePermissionDto {
  employeeId: string;
  permissionType: PermissionType;
  durationMinutes: number;
  requestedDate: string; // ISO date string
}

@ApiTags('Time Management - Permission Validation')
@Controller('time-management/permissions')
@UseGuards(RolesGuard)
export class PermissionValidationController {
  constructor(
    private readonly permissionValidationService: PermissionValidationService,
  ) {}

  @Post('validate')
  @Roles('HR Manager', 'HR Admin', 'System Admin', 'Manager', 'department head')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a permission request (BR-TM-16, BR-TM-17, BR-TM-18)' })
  @ApiResponse({ status: 200, description: 'Permission validation result' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async validatePermission(@Body() dto: ValidatePermissionDto) {
    if (!Types.ObjectId.isValid(dto.employeeId)) {
      throw new BadRequestException('Invalid employeeId format');
    }

    const requestedDate = new Date(dto.requestedDate);
    if (isNaN(requestedDate.getTime())) {
      throw new BadRequestException('Invalid requestedDate format');
    }

    return this.permissionValidationService.validatePermission(
      new Types.ObjectId(dto.employeeId),
      dto.permissionType,
      dto.durationMinutes,
      requestedDate,
    );
  }
}

