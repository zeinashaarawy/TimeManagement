import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Holiday, HolidayDocument } from '../holiday/schemas/holiday.schema';
import { HolidayType } from '../enums/index';
import { ScheduleHelperService } from '../attendance/services/schedule-helper.service';
import { VacationIntegrationService } from '../attendance/services/vacation-integration.service';
import {
  AvailabilityResponseDto,
  UnavailabilityReason,
  WorkingHoursDto,
} from './dto/availability-response.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Holiday.name)
    private holidayModel: Model<HolidayDocument>,
    private scheduleHelperService: ScheduleHelperService,
    private vacationIntegrationService: VacationIntegrationService,
  ) {}

  /**
   * Check employee availability for a given date
   * Checks in order: holiday -> rest day -> leave -> shift assignment
   */
  async checkAvailability(
    employeeId: string,
    date: string,
  ): Promise<AvailabilityResponseDto> {
    // Validate employeeId
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Parse and validate date
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Normalize date to start of day for comparison
    const dateOnly = new Date(checkDate);
    dateOnly.setHours(0, 0, 0, 0);
    const dateEnd = new Date(checkDate);
    dateEnd.setHours(23, 59, 59, 999);

    const employeeObjectId = new Types.ObjectId(employeeId);

    // 1. Check if date is a holiday
    const isHoliday = await this.checkHoliday(dateOnly);
    if (isHoliday) {
      return {
        employeeId,
        date,
        available: false,
        reason: UnavailabilityReason.HOLIDAY,
      };
    }

    // 2. Check if date is a weekly rest day
    const isRestDay = await this.checkRestDay(dateOnly);
    if (isRestDay) {
      return {
        employeeId,
        date,
        available: false,
        reason: UnavailabilityReason.REST_DAY,
      };
    }

    // 3. Check if employee is on approved leave
    const leaveStatus = await this.vacationIntegrationService.isEmployeeOnLeave(
      employeeObjectId,
      dateOnly,
    );
    if (leaveStatus.onLeave) {
      return {
        employeeId,
        date,
        available: false,
        reason: UnavailabilityReason.ON_LEAVE,
      };
    }

    // 4. Check if employee has an assigned shift
    const scheduledTimes = await this.scheduleHelperService.getScheduledTimes(
      employeeObjectId,
      dateOnly,
    );

    if (!scheduledTimes.startTime || !scheduledTimes.endTime) {
      return {
        employeeId,
        date,
        available: false,
        reason: UnavailabilityReason.NO_SHIFT,
      };
    }

    // 5. Employee is available - return working hours
    const workingHours: WorkingHoursDto = {
      start: this.formatTime(scheduledTimes.startTime),
      end: this.formatTime(scheduledTimes.endTime),
    };

    return {
      employeeId,
      date,
      available: true,
      workingHours,
    };
  }

  /**
   * Check if a date is a holiday (NATIONAL or ORGANIZATIONAL)
   */
  private async checkHoliday(date: Date): Promise<boolean> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const holiday = await this.holidayModel
      .findOne({
        active: true,
        type: { $in: [HolidayType.NATIONAL, HolidayType.ORGANIZATIONAL] },
        startDate: { $lte: dateEnd },
        $or: [
          { endDate: null, startDate: { $gte: dateOnly } },
          { endDate: { $gte: dateOnly } },
        ],
      })
      .exec();

    return !!holiday;
  }

  /**
   * Check if a date is a weekly rest day
   */
  private async checkRestDay(date: Date): Promise<boolean> {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Check for WEEKLY_REST holiday on this day
    const restDayHoliday = await this.holidayModel
      .findOne({
        active: true,
        type: HolidayType.WEEKLY_REST,
        startDate: { $lte: dateEnd },
        $or: [
          { endDate: null, startDate: { $gte: dateOnly } },
          { endDate: { $gte: dateOnly } },
        ],
      })
      .exec();

    if (restDayHoliday) {
      return true;
    }

    // Default: Check if it's a weekend (Saturday or Sunday)
    // This can be customized based on company policy
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Format Date to HH:MM string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

