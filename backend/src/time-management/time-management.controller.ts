import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TimeManagementService } from './time-management.service';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';

@Controller('time-management')
export class TimeManagementController {
  constructor(private readonly tmService: TimeManagementService) {}

  // ------------------- RECORD A PUNCH -------------------
  @Post('punch')
  async recordPunch(@Body() dto: CreatePunchDto) {
    if (!dto.employeeId || !dto.timestamp || !dto.type) {
      throw new BadRequestException('Missing required punch data');
    }
    return this.tmService.recordPunch(dto);
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
    body: { employeeId: string; recordId: string; reason: string; assignedToId: string },
  ) {
    if (!body.employeeId || !body.recordId || !body.reason || !body.assignedToId) {
      throw new BadRequestException('Missing required fields');
    }

    return this.tmService.createTimeException(
      body.employeeId,
      body.recordId,
      body.reason,
      body.assignedToId, // pass the required fourth argument
    );
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  @Post('attendance/correct')
  async correctAttendance(
    @Body()
    body: { employeeId: string; date: string; punches: UpdatePunchDto[] },
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
  async detectMissedPunch(
    @Body() body: { employeeId: string; date: string },
  ) {
    if (!body.employeeId || !body.date) {
      throw new BadRequestException('Missing employeeId/date');
    }

    const dateObj = new Date(body.date);
    return this.tmService.detectMissedPunches(body.employeeId, dateObj);
  }

  @Get('notifications/:employeeId')
async getNotifications(@Param('employeeId') employeeId: string) {
  return this.tmService.getNotifications(employeeId);
}

}
