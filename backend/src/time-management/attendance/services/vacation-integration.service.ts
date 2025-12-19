import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
} from '../schemas/attendance-record.schema';
import { LeavesService } from '../../../leaves/leaves.service';
import { LeaveStatus } from '../../../leaves/enums/leave-status.enum';

@Injectable()
export class VacationIntegrationService {
  private readonly logger = new Logger(VacationIntegrationService.name);

  constructor(
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @Inject(forwardRef(() => LeavesService))
    private leavesService: LeavesService,
  ) {}

  /**
   * Check if an employee is on approved leave for a given date
   * Returns leave information if found
   */
  async isEmployeeOnLeave(
    employeeId: Types.ObjectId,
    date: Date,
  ): Promise<{
    onLeave: boolean;
    leaveType?: string;
    leaveRequestId?: Types.ObjectId;
    durationDays?: number;
  }> {
    try {
      // Get all leave requests for this employee (more efficient than findAll)
      const leaveRequests = await this.leavesService.leaveRequest.findByEmployee(
        employeeId.toString(),
      );

      // Filter for approved leave that covers this date
      const relevantLeave = leaveRequests.find((leave: any) => {
        if (leave.status !== LeaveStatus.APPROVED) {
          return false;
        }

        const leaveStart = new Date(leave.dates.from);
        const leaveEnd = new Date(leave.dates.to);
        const checkDate = new Date(date);

        // Set time to midnight for comparison
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(23, 59, 59, 999);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= leaveStart && checkDate <= leaveEnd;
      });

      if (relevantLeave) {
        return {
          onLeave: true,
          leaveType: relevantLeave.leaveTypeId?.toString() || 'Unknown',
          leaveRequestId: relevantLeave._id,
          durationDays: relevantLeave.durationDays,
        };
      }

      return { onLeave: false };
    } catch (error) {
      this.logger.error(
        `Error checking leave status for employee ${employeeId} on ${date.toISOString()}: ${error.message}`,
      );
      return { onLeave: false };
    }
  }

  /**
   * Mark attendance record as "on leave" if employee has approved leave
   * Called when creating or updating attendance records
   */
  async markAttendanceForLeave(
    employeeId: Types.ObjectId,
    recordDate: Date,
    attendanceRecordId?: Types.ObjectId,
  ): Promise<boolean> {
    try {
      const leaveInfo = await this.isEmployeeOnLeave(employeeId, recordDate);

      if (!leaveInfo.onLeave) {
        return false;
      }

      // If attendance record exists, we can add metadata
      // For now, we'll just log it - in a full implementation,
      // we might want to add a flag to the attendance record
      this.logger.log(
        `Employee ${employeeId} is on approved leave on ${recordDate.toISOString()}. Leave type: ${leaveInfo.leaveType}`,
      );

      // In a full implementation, you might want to:
      // 1. Set a flag on the attendance record (e.g., `onLeave: true`)
      // 2. Exclude from worked minutes calculations
      // 3. Auto-deduct from leave entitlements

      return true;
    } catch (error) {
      this.logger.error(
        `Error marking attendance for leave: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get all leave days for an employee in a date range
   * Used for reporting and payroll calculations
   */
  async getLeaveDaysInRange(
    employeeId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalLeaveDays: number;
    leaveDays: Array<{
      date: Date;
      leaveType: string;
      leaveRequestId: Types.ObjectId;
    }>;
  }> {
    try {
      // Get leave requests for this employee (more efficient)
      const employeeLeaves = await this.leavesService.leaveRequest.findByEmployee(
        employeeId.toString(),
      );

      // Filter for approved leaves only
      const approvedLeaves = employeeLeaves.filter(
        (leave: any) => leave.status === LeaveStatus.APPROVED,
      );

      const leaveDays: Array<{
        date: Date;
        leaveType: string;
        leaveRequestId: Types.ObjectId;
      }> = [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const leave of approvedLeaves) {
        const leaveStart = new Date(leave.dates.from);
        const leaveEnd = new Date(leave.dates.to);

        // Check if leave overlaps with the date range
        if (leaveEnd >= start && leaveStart <= end) {
          // Calculate overlapping days
          const overlapStart = leaveStart > start ? leaveStart : start;
          const overlapEnd = leaveEnd < end ? leaveEnd : end;

          // Add each day in the overlap
          const currentDate = new Date(overlapStart);
          while (currentDate <= overlapEnd) {
            // Skip weekends (optional - depends on business rules)
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              // 0 = Sunday, 6 = Saturday
              leaveDays.push({
                date: new Date(currentDate),
                leaveType: leave.leaveTypeId?.toString() || 'Unknown',
                leaveRequestId: leave._id,
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }

      return {
        totalLeaveDays: leaveDays.length,
        leaveDays,
      };
    } catch (error) {
      this.logger.error(
        `Error getting leave days in range: ${error.message}`,
      );
      return { totalLeaveDays: 0, leaveDays: [] };
    }
  }

  /**
   * Exclude leave days from worked minutes calculation
   * Used in policy engine when computing attendance
   */
  shouldExcludeFromWorkedMinutes(
    employeeId: Types.ObjectId,
    date: Date,
  ): Promise<boolean> {
    return this.isEmployeeOnLeave(employeeId, date).then((info) => info.onLeave);
  }
}

