import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RepeatedLatenessTracking,
  RepeatedLatenessTrackingDocument,
} from '../schemas/repeated-lateness-tracking.schema';
import {
  TimeException,
  TimeExceptionDocument,
} from '../schemas/time-exception.schema';
import { TimeExceptionType, TimeExceptionStatus } from '../../enums/index';
import { TimeManagementService } from '../../time-management.service';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../../employee-profile/models/employee-system-role.schema';
import { SystemRole } from '../../../employee-profile/enums/employee-profile.enums';

@Injectable()
export class RepeatedLatenessService {
  private readonly logger = new Logger(RepeatedLatenessService.name);

  constructor(
    @InjectModel(RepeatedLatenessTracking.name)
    private repeatedLatenessModel: Model<RepeatedLatenessTrackingDocument>,
    @InjectModel(TimeException.name)
    private exceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    @Inject(forwardRef(() => TimeManagementService))
    private timeManagementService: TimeManagementService,
  ) {}

  /**
   * Track a new lateness incident for an employee
   * Called when a LATE exception is created
   */
  async trackLatenessIncident(
    employeeId: Types.ObjectId,
    exceptionId: Types.ObjectId,
    latenessMinutes: number,
    incidentDate: Date,
  ): Promise<void> {
    this.logger.log(
      `Tracking lateness incident for employee ${employeeId}: ${latenessMinutes} minutes late on ${incidentDate.toISOString()}`,
    );

    // Get current week and month periods
    const weekStart = this.getWeekStart(incidentDate);
    const weekEnd = this.getWeekEnd(incidentDate);
    const monthStart = this.getMonthStart(incidentDate);
    const monthEnd = this.getMonthEnd(incidentDate);

    // Update or create week tracking
    await this.updatePeriodTracking(
      employeeId,
      exceptionId,
      latenessMinutes,
      weekStart,
      weekEnd,
      'WEEK',
    );

    // Update or create month tracking
    await this.updatePeriodTracking(
      employeeId,
      exceptionId,
      latenessMinutes,
      monthStart,
      monthEnd,
      'MONTH',
    );
  }

  /**
   * Update tracking for a specific period (week or month)
   */
  private async updatePeriodTracking(
    employeeId: Types.ObjectId,
    exceptionId: Types.ObjectId,
    latenessMinutes: number,
    periodStart: Date,
    periodEnd: Date,
    periodType: 'WEEK' | 'MONTH',
  ): Promise<void> {
    // Find or create tracking record
    let tracking = await this.repeatedLatenessModel.findOne({
      employeeId,
      periodStart,
      periodEnd,
      periodType,
    });

    if (!tracking) {
      tracking = new this.repeatedLatenessModel({
        employeeId,
        periodStart,
        periodEnd,
        periodType,
        totalLatenessIncidents: 0,
        totalLatenessMinutes: 0,
        lateExceptionIds: [],
      });
    }

    // Update counts
    tracking.totalLatenessIncidents += 1;
    tracking.totalLatenessMinutes += latenessMinutes;
    if (!tracking.lateExceptionIds.includes(exceptionId)) {
      tracking.lateExceptionIds.push(exceptionId);
    }

    // Check thresholds (will be checked against policy in checkThresholds)
    await tracking.save();

    this.logger.log(
      `Updated ${periodType} tracking for employee ${employeeId}: ${tracking.totalLatenessIncidents} incidents, ${tracking.totalLatenessMinutes} total minutes`,
    );
  }

  /**
   * Check if thresholds are exceeded and escalate if needed
   * Should be called after tracking an incident or periodically
   */
  async checkAndEscalateThresholds(
    employeeId: Types.ObjectId,
    policy: any, // TimePolicy with repeatedLatenessThreshold config
  ): Promise<{
    thresholdExceeded: boolean;
    escalated: boolean;
    periodType?: string;
  }> {
    if (!policy?.latenessRule?.repeatedLatenessThreshold) {
      return { thresholdExceeded: false, escalated: false };
    }

    const threshold = policy.latenessRule.repeatedLatenessThreshold;
    const now = new Date();

    // Check week tracking
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);
    const weekTracking = await this.repeatedLatenessModel.findOne({
      employeeId,
      periodStart: weekStart,
      periodEnd: weekEnd,
      periodType: 'WEEK',
    });

    if (weekTracking) {
      const weekExceeded =
        (threshold.incidentsPerWeek &&
          weekTracking.totalLatenessIncidents >= threshold.incidentsPerWeek) ||
        (threshold.totalMinutesPerWeek &&
          weekTracking.totalLatenessMinutes >= threshold.totalMinutesPerWeek);

      if (weekExceeded && !weekTracking.thresholdExceeded) {
        weekTracking.thresholdExceeded = true;
        weekTracking.thresholdExceededAt = new Date();
        await weekTracking.save();

        if (threshold.autoEscalate) {
          await this.escalateRepeatedLateness(
            employeeId,
            weekTracking,
            'WEEK',
            threshold,
          );
          return { thresholdExceeded: true, escalated: true, periodType: 'WEEK' };
        }
        return { thresholdExceeded: true, escalated: false, periodType: 'WEEK' };
      }
    }

    // Check month tracking
    const monthStart = this.getMonthStart(now);
    const monthEnd = this.getMonthEnd(now);
    const monthTracking = await this.repeatedLatenessModel.findOne({
      employeeId,
      periodStart: monthStart,
      periodEnd: monthEnd,
      periodType: 'MONTH',
    });

    if (monthTracking) {
      const monthExceeded =
        (threshold.incidentsPerMonth &&
          monthTracking.totalLatenessIncidents >= threshold.incidentsPerMonth) ||
        (threshold.totalMinutesPerMonth &&
          monthTracking.totalLatenessMinutes >= threshold.totalMinutesPerMonth);

      if (monthExceeded && !monthTracking.thresholdExceeded) {
        monthTracking.thresholdExceeded = true;
        monthTracking.thresholdExceededAt = new Date();
        await monthTracking.save();

        if (threshold.autoEscalate) {
          await this.escalateRepeatedLateness(
            employeeId,
            monthTracking,
            'MONTH',
            threshold,
          );
          return {
            thresholdExceeded: true,
            escalated: true,
            periodType: 'MONTH',
          };
        }
        return {
          thresholdExceeded: true,
          escalated: false,
          periodType: 'MONTH',
        };
      }
    }

    return { thresholdExceeded: false, escalated: false };
  }

  /**
   * Escalate repeated lateness to HR/Manager
   */
  private async escalateRepeatedLateness(
    employeeId: Types.ObjectId,
    tracking: RepeatedLatenessTrackingDocument,
    periodType: string,
    threshold: any,
  ): Promise<void> {
    if (tracking.escalated) {
      return; // Already escalated
    }

    // Find HR Admin or Manager to escalate to
    const escalateToRole = threshold.escalateToRole || SystemRole.HR_ADMIN;
    const hrRole = await this.employeeSystemRoleModel
      .findOne({
        roles: escalateToRole,
        isActive: true,
      })
      .exec();

    const escalateToId = hrRole?.employeeProfileId || employeeId; // Fallback

    tracking.escalated = true;
    tracking.escalatedAt = new Date();
    tracking.escalatedTo = escalateToId instanceof Types.ObjectId
      ? escalateToId
      : new Types.ObjectId(escalateToId);
    tracking.disciplinaryFlag = true;
    tracking.disciplinaryFlaggedAt = new Date();
    await tracking.save();

    // Send notification
    await this.timeManagementService.sendNotification(
      employeeId.toString(),
      'REPEATED_LATENESS_ESCALATION',
      `Repeated lateness threshold exceeded: ${tracking.totalLatenessIncidents} incidents (${tracking.totalLatenessMinutes} total minutes) in ${periodType.toLowerCase()}. Disciplinary action may be required.`,
    );

    // Also notify the HR/Manager
    const escalateToIdString = escalateToId instanceof Types.ObjectId
      ? escalateToId.toString()
      : String(escalateToId);
    if (escalateToIdString !== employeeId.toString()) {
      await this.timeManagementService.sendNotification(
        escalateToIdString,
        'REPEATED_LATENESS_ALERT',
        `Employee ${employeeId} has exceeded repeated lateness threshold: ${tracking.totalLatenessIncidents} incidents in ${periodType.toLowerCase()}. Review required.`,
      );
    }

    this.logger.warn(
      `Escalated repeated lateness for employee ${employeeId}: ${tracking.totalLatenessIncidents} incidents in ${periodType}`,
    );
  }

  /**
   * Get repeated lateness tracking for an employee
   */
  async getEmployeeTracking(
    employeeId: Types.ObjectId,
    periodType?: 'WEEK' | 'MONTH',
  ): Promise<RepeatedLatenessTrackingDocument[]> {
    const query: any = { employeeId };
    if (periodType) {
      query.periodType = periodType;
    }
    return this.repeatedLatenessModel.find(query).sort({ periodStart: -1 }).exec();
  }

  /**
   * Get all employees who have exceeded thresholds
   */
  async getThresholdExceededEmployees(): Promise<
    RepeatedLatenessTrackingDocument[]
  > {
    return this.repeatedLatenessModel
      .find({
        thresholdExceeded: true,
        escalated: false, // Only get those not yet escalated
      })
      .populate('employeeId')
      .sort({ thresholdExceededAt: -1 })
      .exec();
  }

  // Helper methods for date calculations
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday = 0
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getMonthStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getMonthEnd(date: Date): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Last day of current month
    d.setHours(23, 59, 59, 999);
    return d;
  }
}

