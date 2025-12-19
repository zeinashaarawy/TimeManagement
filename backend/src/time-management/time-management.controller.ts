import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TimeManagementService } from './time-management.service';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
import { TimeExceptionType, PermissionType } from './enums/index';
import { RolesGuard } from './Shift/guards/roles.guard';
import { Roles } from './Shift/decorators/roles.decorator';

@Controller('time-management')
export class TimeManagementController {
  constructor(private readonly tmService: TimeManagementService) {}

  // ------------------- RECORD A PUNCH -------------------
  @Post('punch')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async recordPunch(@Body() dto: CreatePunchDto) {
    try {
      // Transform timestamp string to Date if needed
      if (dto.timestamp && typeof dto.timestamp === 'string') {
        dto.timestamp = new Date(dto.timestamp);
      }
      
      if (!dto.employeeId || !dto.timestamp || !dto.type) {
        throw new BadRequestException('Missing required punch data');
      }

      // Validate employeeId format
      if (!dto.employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      return await this.tmService.recordPunch(dto);
    } catch (error) {
      // Log the error for debugging
      console.error('[TimeManagementController] Error in recordPunch:', error);
      
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Wrap other errors
      throw new BadRequestException(
        error.message || 'Failed to record punch',
      );
    }
  }

  // ------------------- GET ATTENDANCE -------------------
  @Get('attendance/:employeeId')
  async getAttendance(
    @Param('employeeId') employeeId: string,
    @Query('date') date?: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('Missing employeeId');
    }
    return this.tmService.getAttendance(employeeId, date);
  }

  // ------------------- GET TIME EXCEPTIONS -------------------
  @Get('exceptions/:employeeId')
  async getExceptions(@Param('employeeId') employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Missing employeeId');
    }
    return this.tmService.getExceptions(employeeId);
  }

  // ------------------- CREATE TIME EXCEPTION MANUALLY -------------------
  @Post('exceptions')
  async createException(
    @Body()
    body: {
      employeeId: string;
      recordId: string;
      reason: string;
      assignedToId: string;
      type?: string;
      permissionType?: string; // BR-TM-16: Permission type (EARLY_IN, LATE_OUT, etc.)
      durationMinutes?: number; // BR-TM-16: Duration in minutes
      requestedDate?: string; // BR-TM-17: Date for which permission is requested (ISO string)
    },
  ) {
    if (
      !body.employeeId ||
      !body.recordId ||
      !body.reason ||
      !body.assignedToId
    ) {
      throw new BadRequestException('Missing required fields');
    }

    const exceptionType = body.type ? (TimeExceptionType[body.type as keyof typeof TimeExceptionType] || undefined) : undefined;
    const permissionType = body.permissionType ? (PermissionType[body.permissionType as keyof typeof PermissionType] || undefined) : undefined;
    const requestedDate = body.requestedDate ? new Date(body.requestedDate) : undefined;

    return this.tmService.createTimeException(
      body.employeeId,
      body.recordId,
      body.reason,
      body.assignedToId,
      exceptionType,
      permissionType,
      body.durationMinutes,
      requestedDate,
    );
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  @Post('attendance/correct')
  async correctAttendance(
    @Body()
    body: {
      employeeId: string;
      date: string;
      punches: UpdatePunchDto[];
    },
  ) {
    if (!body.employeeId || !body.date || !body.punches) {
      throw new BadRequestException('Missing required fields');
    }

    const dateObj = new Date(body.date);
    return this.tmService.correctAttendance(
      body.employeeId,
      dateObj,
      body.punches,
    );
  }

  // ------------------- MANUAL MISSED PUNCH DETECTION -------------------
  @Post('attendance/detect-missed')
  async detectMissedPunch(@Body() body: { employeeId: string; date: string }) {
    if (!body.employeeId || !body.date) {
      throw new BadRequestException('Missing employeeId/date');
    }

    const dateObj = new Date(body.date);
    return this.tmService.detectMissedPunches(body.employeeId, dateObj);
  }

  @Get('notifications/employee/:employeeId')
  async getNotifications(@Param('employeeId') employeeId: string) {
    return this.tmService.getNotifications(employeeId);
  }

  // ------------------- PHASE 4: EXCEPTION APPROVAL WORKFLOW -------------------
  /**
   * Approve a time exception
   * PATCH /time-management/exceptions/:id/approve
   */
  @Post('exceptions/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'department head')
  async approveException(
    @Param('id') exceptionId: string,
    @Body() body: { approvedBy: string; notes?: string },
  ) {
    if (!body.approvedBy) {
      throw new BadRequestException('approvedBy is required');
    }
    return this.tmService.approveException(
      exceptionId,
      body.approvedBy,
      body.notes,
    );
  }

  /**
   * Reject a time exception
   * PATCH /time-management/exceptions/:id/reject
   */
  @Post('exceptions/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'department head')
  async rejectException(
    @Param('id') exceptionId: string,
    @Body() body: { rejectedBy: string; reason?: string },
  ) {
    if (!body.rejectedBy) {
      throw new BadRequestException('rejectedBy is required');
    }
    return this.tmService.rejectException(
      exceptionId,
      body.rejectedBy,
      body.reason,
    );
  }

  /**
   * Get all exceptions (for managers to review)
   * GET /time-management/exceptions
   */
  @Get('exceptions')
  @UseGuards(RolesGuard)
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'department head')
  async getAllExceptions(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.tmService.getAllExceptions(status, assignedTo, employeeId);
  }

  /**
   * Escalate exception if not reviewed
   * POST /time-management/exceptions/:id/escalate
   */
  @Post('exceptions/:id/escalate')
  @UseGuards(RolesGuard)
  @Roles('HR Manager', 'SYSTEM_ADMIN', 'HR_ADMIN', 'department head')
  async escalateException(
    @Param('id') exceptionId: string,
    @Body() body: { escalatedTo: string; reason?: string },
  ) {
    if (!body.escalatedTo) {
      throw new BadRequestException('escalatedTo is required');
    }
    return this.tmService.escalateException(
      exceptionId,
      body.escalatedTo,
      body.reason,
    );
  }
}
