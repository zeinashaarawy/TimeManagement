import { Controller, Get } from '@nestjs/common';
import { TimeManagementService } from './time-management.service';

@Controller('time-management')
export class TimeManagementController {
  constructor(private readonly tmService: TimeManagementService) {}

  @Get('attendance-summary')
  async getAttendanceSummary() {
    return await this.tmService.getAttendanceSummary();
  }

  @Get('employees')
  async getAllEmployees() {
    return await this.tmService.getAllEmployees();
  }

  @Get('departments')
  async getAllDepartments() {
    return await this.tmService.getAllDepartments();
  }

  @Get('shifts')
  async getAllShifts() {
    return await this.tmService.getAllShifts();
  }

  @Get('holidays')
  async getAllHolidays() {
    return await this.tmService.getAllHolidays();
  }

  @Get('positions')
  async getAllPositions() {
    return await this.tmService.getAllPositions();
  }

  @Get('time-exceptions')
  async getAllTimeExceptions() {
    return await this.tmService.getAllTimeExceptions();
  }
}