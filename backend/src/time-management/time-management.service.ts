import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
  Punch,
} from './attendance/schemas/attendance-record.schema';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
import {
  TimeException,
  TimeExceptionDocument,
} from './attendance/schemas/time-exception.schema';
import {
  TimeExceptionType,
  TimeExceptionStatus,
  PunchType,
  PermissionType,
} from './enums/index';
import {
  NotificationLog,
  NotificationLogDocument,
} from './notifications/schemas/notification-log.schema';
import { PolicyEngineService } from './policy/services/policy-engine.service';
import { ScheduleHelperService } from './attendance/services/schedule-helper.service';
import { RepeatedLatenessService } from './attendance/services/repeated-lateness.service';
import { PermissionValidationService } from './permission/services/permission-validation.service';
import { DeviceSyncService } from './device/services/device-sync.service';
import { forwardRef, Inject, Optional } from '@nestjs/common';

@Injectable()
export class TimeManagementService {
  constructor(
    @InjectModel(AttendanceRecord.name)
    private readonly attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name)
    private readonly exceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationModel: Model<NotificationLogDocument>,
    private readonly policyEngineService: PolicyEngineService,
    private readonly scheduleHelperService: ScheduleHelperService,
    @Inject(forwardRef(() => RepeatedLatenessService))
    private readonly repeatedLatenessService: RepeatedLatenessService,
    @Inject(forwardRef(() => PermissionValidationService))
    @Optional()
    private readonly permissionValidationService?: PermissionValidationService,
    @Inject(forwardRef(() => DeviceSyncService))
    @Optional()
    private readonly deviceSyncService?: DeviceSyncService,
  ) {}

  // ------------------- RECORD A PUNCH -------------------
  async recordPunch(dto: CreatePunchDto, isOnline: boolean = true) {
    // Validate employeeId
    if (!dto.employeeId || !Types.ObjectId.isValid(dto.employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    const employeeObjectId = new Types.ObjectId(dto.employeeId);
    const punchTime = new Date(dto.timestamp);

    // Validate timestamp
    if (isNaN(punchTime.getTime())) {
      throw new BadRequestException('Invalid timestamp');
    }

    // BR-TM-13: If device is offline, queue the punch for sync
    if (!isOnline && this.deviceSyncService && dto.device) {
      await this.deviceSyncService.queueOfflinePunch(
        dto.employeeId,
        punchTime,
        dto.type.toLowerCase() as 'in' | 'out',
        dto.device || 'unknown',
        dto.location,
        dto.rawMetadata,
      );
      return {
        message: 'Punch queued for sync when device reconnects',
        queued: true,
        device: dto.device,
      };
    }

    // Prepare day boundaries
    const startOfDay = new Date(punchTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(punchTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Find today's attendance using recordDate
    // Use range query to handle any time-of-day variations
    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      recordDate: {
        $gte: startOfDay,
        $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000), // Next day
      },
    });

    // Create new if none found
    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        recordDate: startOfDay, // Required field - set to start of day
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Add punch
    attendance.punches.push({
      type: dto.type,
      time: punchTime,
    });

    // Calculate totalWorkMinutes from punches
    attendance.totalWorkMinutes = this.calculateWorkedMinutes(
      attendance.punches,
    );

    // Check for missed punches (should have at least one IN and one OUT)
    const hasInPunch = attendance.punches.some((p) => p.type === 'IN');
    const hasOutPunch = attendance.punches.some((p) => p.type === 'OUT');
    attendance.hasMissedPunch = !hasInPunch || !hasOutPunch;

    // Save updated record
    const savedRecord = await attendance.save();

    // ------------------- AUTO MISSED PUNCH CHECK -------------------
    const punchesToday = savedRecord.punches.length;

    if (punchesToday < 2) {
      const existing = await this.exceptionModel.findOne({
        employeeId: employeeObjectId,
        type: 'MISSED_PUNCH',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!existing) {
        // Note: assignedTo is required but we don't have manager ID here
        // Using employee's own ID as fallback - should be updated by manager later
        const exception = await this.exceptionModel.create({
          employeeId: employeeObjectId,
          attendanceRecordId: savedRecord._id,
          type: 'MISSED_PUNCH',
          status: 'OPEN',
          assignedTo: employeeObjectId, // Required field - using employee ID as fallback
          reason: `Employee has only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`,
        });

        // Send notification
        await this.sendNotification(
          dto.employeeId,
          'MISSED_PUNCH',
          `Missed punch detected: only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`,
        );
      }
    }

    // ------------------- COMPUTE POLICY RESULTS & SEND ALERTS -------------------
    // Only compute if we have both IN and OUT punches (or if it's an OUT punch)
    const hasInOutPunches = savedRecord.punches.some((p) => p.type === 'IN') && 
                            savedRecord.punches.some((p) => p.type === 'OUT');
    
    if (hasInOutPunches) {
      try {
        // Get scheduled times for this employee on this date
        const scheduled = await this.scheduleHelperService.getScheduledTimes(
          employeeObjectId,
          startOfDay,
        );

        if (scheduled.startTime && scheduled.scheduledMinutes) {
          // Compute policy results
          const result = await this.policyEngineService.computePolicyResults(
            savedRecord,
            startOfDay,
            scheduled.startTime,
            scheduled.endTime,
            scheduled.scheduledMinutes,
          );

          // Save computed results
          await this.policyEngineService.saveComputedResults(result);

          // Send alerts for lateness
          if (result.latenessMinutes > 0) {
            const existingLateAlert = await this.exceptionModel.findOne({
              employeeId: employeeObjectId,
              type: 'LATE',
              createdAt: { $gte: startOfDay, $lte: endOfDay },
            });

            if (!existingLateAlert) {
              await this.sendNotification(
                dto.employeeId,
                'LATE_ARRIVAL',
                `Late arrival detected: ${result.latenessMinutes} minutes late on ${startOfDay.toDateString()}`,
              );

              // Create exception for late arrival
              const lateException = await this.exceptionModel.create({
                employeeId: employeeObjectId,
                attendanceRecordId: savedRecord._id,
                type: 'LATE',
                status: 'OPEN',
                assignedTo: employeeObjectId,
                reason: `Employee arrived ${result.latenessMinutes} minutes late`,
              });

              // Track repeated lateness (US 12)
              try {
                await this.repeatedLatenessService.trackLatenessIncident(
                  employeeObjectId,
                  lateException._id,
                  result.latenessMinutes,
                  startOfDay,
                );

                // Check thresholds and escalate if needed
                const policy = await this.policyEngineService.getApplicablePolicy(
                  employeeObjectId,
                  startOfDay,
                );
                if (policy) {
                  await this.repeatedLatenessService.checkAndEscalateThresholds(
                    employeeObjectId,
                    policy,
                  );
                }
              } catch (error) {
                console.error(
                  `Error tracking repeated lateness for employee ${dto.employeeId}:`,
                  error,
                );
                // Don't block punch recording if tracking fails
              }
            }
          }

          // Send alerts for early leave / short-time
          if (result.shortTimeMinutes > 0) {
            const existingEarlyLeaveAlert = await this.exceptionModel.findOne({
              employeeId: employeeObjectId,
              type: 'EARLY_LEAVE',
              createdAt: { $gte: startOfDay, $lte: endOfDay },
            });

            if (!existingEarlyLeaveAlert) {
              await this.sendNotification(
                dto.employeeId,
                'EARLY_LEAVE',
                `Early leave detected: ${result.shortTimeMinutes} minutes short on ${startOfDay.toDateString()}`,
              );

              // Create exception for early leave
              await this.exceptionModel.create({
                employeeId: employeeObjectId,
                attendanceRecordId: savedRecord._id,
                type: 'EARLY_LEAVE',
                status: 'OPEN',
                assignedTo: employeeObjectId,
                reason: `Employee left ${result.shortTimeMinutes} minutes early (short-time)`,
              });
            }
          }
        }
      } catch (error) {
        // Log error but don't fail the punch recording
        console.error('Error computing policy results or sending alerts:', error);
      }
    }

    return {
      message: 'Punch recorded successfully',
      attendance: savedRecord,
    };
  }
  async getNotifications(employeeId: string) {
    return this.notificationModel
      .find({ to: new Types.ObjectId(employeeId) })
      .lean();
  }

  async sendNotification(to: string, type: string, message?: string) {
    const notification = new this.notificationModel({
      to: new Types.ObjectId(to),
      type,
      message,
    });
    return notification.save();
  }

  // ------------------- GET ATTENDANCE -------------------
  async getAttendance(employeeId: string, date?: string) {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query['punches.time'] = { $gte: start, $lte: end };
    }

    const record = await this.attendanceModel.findOne(query);
    if (!record) return { message: 'No attendance found', punches: [] };

    // Recalculate if totalWorkMinutes is 0 but we have punches (for old data)
    if (record.totalWorkMinutes === 0 && record.punches.length >= 2) {
      // Ensure punch times are Date objects
      const punchesWithDates = record.punches.map((p) => ({
        type: p.type,
        time: p.time instanceof Date ? p.time : new Date(p.time),
      }));
      record.totalWorkMinutes = this.calculateWorkedMinutes(punchesWithDates);

      // Update missed punch flag
      const hasInPunch = punchesWithDates.some((p) => p.type === 'IN');
      const hasOutPunch = punchesWithDates.some((p) => p.type === 'OUT');
      record.hasMissedPunch = !hasInPunch || !hasOutPunch;

      // Save the recalculated values
      await record.save();
    }

    // Recalculate if totalWorkMinutes is 0 but we have punches (for old data)
    if (record.totalWorkMinutes === 0 && record.punches.length >= 2) {
      // Ensure punch times are Date objects
      const punchesWithDates = record.punches.map(p => ({
        type: p.type,
        time: p.time instanceof Date ? p.time : new Date(p.time),
      }));
      record.totalWorkMinutes = this.calculateWorkedMinutes(punchesWithDates);
      
      // Update missed punch flag
      const hasInPunch = punchesWithDates.some(p => p.type === 'IN');
      const hasOutPunch = punchesWithDates.some(p => p.type === 'OUT');
      record.hasMissedPunch = !hasInPunch || !hasOutPunch;
      
      // Save the recalculated values
      await record.save();
    }

    return {
      _id: record._id,
      employeeId: record.employeeId,
      recordDate: record.recordDate,
      punches: record.punches,
      totalWorkMinutes: record.totalWorkMinutes,
      hasMissedPunch: record.hasMissedPunch,
      exceptionIds: record.exceptionIds,
      finalisedForPayroll: record.finalisedForPayroll,
    };
  }

  // ------------------- CREATE TIME EXCEPTION -------------------
  async createTimeException(
    employeeId: string,
    recordId: string,
    reason: string,
    assignedToId: string,
    type?: TimeExceptionType,
    permissionType?: PermissionType,
    durationMinutes?: number,
    requestedDate?: Date,
  ) {
    const exception = new this.exceptionModel({
      employeeId: new Types.ObjectId(employeeId),
      attendanceRecordId: new Types.ObjectId(recordId),
      reason,
      type: type || TimeExceptionType.MISSED_PUNCH,
      status: TimeExceptionStatus.OPEN,
      assignedTo: new Types.ObjectId(assignedToId), // required field
      permissionType,
      durationMinutes,
      requestedDate,
    });

    // If this is a permission request, validate it (BR-TM-16, BR-TM-17, BR-TM-18)
    if (permissionType && durationMinutes && requestedDate && this.permissionValidationService) {
      try {
        const validationResult = await this.permissionValidationService.validatePermission(
          new Types.ObjectId(employeeId),
          permissionType,
          durationMinutes,
          requestedDate,
        );

        if (!validationResult.valid) {
          throw new BadRequestException(
            `Permission validation failed: ${validationResult.errors.join(', ')}`,
          );
        }

        // Update exception with validation results and impact
        // Validation flags are set based on whether validation passed
        if (validationResult.valid) {
          exception.contractStartDateValidated = true;
          exception.financialCalendarValidated = true;
          exception.probationDateValidated = true;
        }

        if (validationResult.payrollImpact) {
          exception.affectsPayroll = validationResult.payrollImpact.affectsPayroll;
          exception.payrollImpactType = validationResult.payrollImpact.impactType;
          exception.payrollImpactAmount = validationResult.payrollImpact.impactAmount;
        }

        if (validationResult.benefitsImpact) {
          exception.affectsBenefits = validationResult.benefitsImpact.affectsBenefits;
          exception.benefitsImpactType = validationResult.benefitsImpact.impactType;
          exception.benefitsImpactAmount = validationResult.benefitsImpact.impactAmount;
        }
      } catch (error: any) {
        // If validation service is not available, log warning but don't fail
        if (error instanceof BadRequestException) {
          throw error;
        }
        console.warn('Permission validation service not available:', error.message);
      }
    }

    return exception.save();
  }

  // ------------------- GET TIME EXCEPTIONS -------------------
  async getExceptions(employeeId: string) {
    return this.exceptionModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
      })
      .exec();
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  async correctAttendance(
    employeeId: string,
    date: Date,
    punches: UpdatePunchDto[],
  ) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        recordDate: startOfDay, // Required field - set to start of day
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Ensure timestamp is converted to Date
    attendance.punches = punches.map((p) => ({
      type: p.type,
      time: p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp),
    }));

    // Calculate totalWorkMinutes from punches
    attendance.totalWorkMinutes = this.calculateWorkedMinutes(
      attendance.punches,
    );

    // Check for missed punches (should have at least one IN and one OUT)
    const hasInPunch = attendance.punches.some((p) => p.type === 'IN');
    const hasOutPunch = attendance.punches.some((p) => p.type === 'OUT');
    attendance.hasMissedPunch = !hasInPunch || !hasOutPunch;

    const saved = await attendance.save();
    return {
      message: 'Attendance corrected successfully',
      attendance: saved,
    };
  }

  // ------------------- MANUAL MISSED PUNCH DETECTION -------------------
  async detectMissedPunches(employeeId: string, date: Date) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const punchesCount = attendance?.punches.length || 0;
    if (punchesCount < 2) {
      // Note: assignedTo is required but we don't have manager ID here
      // Using employee's own ID as fallback - should be updated by manager later
      const exception = new this.exceptionModel({
        employeeId: employeeObjectId,
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: attendance?._id,
        assignedTo: employeeObjectId, // Required field - using employee ID as fallback
        status: TimeExceptionStatus.OPEN,
        reason: `Missed punches on ${date.toDateString()}`,
      });
      await exception.save();
      return { message: 'Time exception created', exception };
    }
    return { message: 'No missed punches detected' };
  }

  /**
   * Approve a time exception
   * BR-TM-18: Permission approval impacts payroll and benefits
   */
  async approveException(
    exceptionId: string,
    approvedBy: string,
    notes?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (exception.status === TimeExceptionStatus.APPROVED) {
      throw new BadRequestException('Exception is already approved');
    }

    if (exception.status === TimeExceptionStatus.REJECTED) {
      throw new BadRequestException('Cannot approve a rejected exception');
    }

    // If this is a permission request, ensure validation was completed (BR-TM-18)
    // Note: Permission validation should be done before approval
    // The validation service will be called via the controller if available
    if (exception.permissionType) {
      // Check if validation was completed
      if (
        !exception.contractStartDateValidated ||
        !exception.financialCalendarValidated ||
        !exception.probationDateValidated
      ) {
        // Log warning but allow approval (validation can be done separately)
        console.warn(
          `Permission exception ${exceptionId} approved without full validation. Consider validating before approval.`,
        );
      }

      // Ensure payroll and benefits impact are tracked (BR-TM-18)
      if (!exception.affectsPayroll && !exception.affectsBenefits) {
        // Default impact based on permission type
        if (!exception.payrollImpactType) {
          switch (exception.permissionType) {
            case PermissionType.LATE_OUT:
            case PermissionType.OUT_OF_HOURS:
              exception.payrollImpactType = 'OVERTIME';
              exception.affectsPayroll = true;
              break;
            case PermissionType.EARLY_IN:
              exception.payrollImpactType = 'ADJUSTMENT';
              exception.affectsPayroll = true;
              break;
            default:
              exception.payrollImpactType = 'NONE';
          }
        }
      }
    }

    exception.status = TimeExceptionStatus.APPROVED;
    exception.assignedTo = new Types.ObjectId(approvedBy);
    if (notes) {
      exception.reason = notes;
    }
    await exception.save();

    // Trigger policy recalculation if attendance record exists
    if (exception.attendanceRecordId) {
      try {
        const attendance = await this.attendanceModel.findById(
          exception.attendanceRecordId,
        );
        if (attendance) {
          // Use recordDate if available, otherwise use first punch time, otherwise use current date
          const recordDate =
            attendance.recordDate ||
            (attendance.punches && attendance.punches.length > 0
              ? attendance.punches[0].time
              : new Date());

          // Ensure attendanceRecordId is an ObjectId
          const attendanceRecordId =
            exception.attendanceRecordId instanceof Types.ObjectId
              ? exception.attendanceRecordId
              : new Types.ObjectId(exception.attendanceRecordId);

          const result =
            await this.policyEngineService.recalculatePolicyResults(
              attendanceRecordId,
              recordDate instanceof Date ? recordDate : new Date(recordDate),
              undefined,
              undefined,
              undefined,
            );
          await this.policyEngineService.saveComputedResults(result);
        }
      } catch (error) {
        // Log error but don't fail the approval
        console.error(
          'Error recalculating policy results after exception approval:',
          error,
        );
      }
    }

    // Send notification (don't fail if notification fails)
    try {
      const employeeIdStr =
        exception.employeeId instanceof Types.ObjectId
          ? exception.employeeId.toString()
          : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_APPROVED',
        `Your time exception has been approved`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception approved successfully',
      exception,
    };
  }

  /**
   * Reject a time exception
   */
  async rejectException(
    exceptionId: string,
    rejectedBy: string,
    reason?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (exception.status === TimeExceptionStatus.REJECTED) {
      throw new BadRequestException('Exception is already rejected');
    }

    if (exception.status === TimeExceptionStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an approved exception');
    }

    exception.status = TimeExceptionStatus.REJECTED;
    exception.assignedTo = new Types.ObjectId(rejectedBy);
    if (reason) {
      exception.reason = reason;
    }
    await exception.save();

    // Send notification
    try {
      const employeeIdStr =
        exception.employeeId instanceof Types.ObjectId
          ? exception.employeeId.toString()
          : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_REJECTED',
        `Your time exception has been rejected${reason ? ': ' + reason : ''}`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception rejected successfully',
      exception,
    };
  }

  /**
   * Get all exceptions with filters (for managers)
   */
  async getAllExceptions(
    status?: string,
    assignedTo?: string,
    employeeId?: string,
  ) {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (assignedTo) {
      query.assignedTo = new Types.ObjectId(assignedTo);
    }
    if (employeeId) {
      query.employeeId = new Types.ObjectId(employeeId);
    }

    return this.exceptionModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Escalate exception if not reviewed
   */
  async escalateException(
    exceptionId: string,
    escalatedTo: string,
    reason?: string,
  ) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    if (
      exception.status === TimeExceptionStatus.APPROVED ||
      exception.status === TimeExceptionStatus.REJECTED
    ) {
      throw new BadRequestException('Cannot escalate a resolved exception');
    }

    exception.status = TimeExceptionStatus.ESCALATED;
    exception.assignedTo = new Types.ObjectId(escalatedTo);
    if (reason) {
      exception.reason = (exception.reason || '') + ` [Escalated: ${reason}]`;
    }
    await exception.save();

    // Send notification
    try {
      const employeeIdStr =
        exception.employeeId instanceof Types.ObjectId
          ? exception.employeeId.toString()
          : String(exception.employeeId);
      await this.sendNotification(
        employeeIdStr,
        'EXCEPTION_ESCALATED',
        `Your time exception has been escalated for review`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return {
      message: 'Exception escalated successfully',
      exception,
    };
  }

  /**
   * Calculate worked minutes from punches
   * Matches IN/OUT pairs and sums the time differences
   */
  private calculateWorkedMinutes(
    punches: Array<{ type: string; time: Date }>,
  ): number {
    if (punches.length === 0) return 0;

    // Sort punches by time
    const sortedPunches = [...punches].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );
    let totalMinutes = 0;
    let lastInTime: Date | null = null;

    for (const punch of sortedPunches) {
      // Handle both enum and string types (case-insensitive)
      const punchType = punch.type.toString().toUpperCase();
      if (punchType === 'IN') {
        lastInTime = punch.time;
      } else if (punchType === 'OUT' && lastInTime) {
        const diffMs = punch.time.getTime() - lastInTime.getTime();
        const minutes = Math.floor(diffMs / (1000 * 60));
        if (minutes > 0) {
          totalMinutes += minutes;
        }
        lastInTime = null; // Reset after pairing
      }
    }

    return totalMinutes;
  }
}
