import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import {
  NotificationLogSchema,
  NotificationLog,
} from './notifications/schemas/notification-log.schema';
import {
  AttendanceCorrectionRequestSchema,
  AttendanceCorrectionRequest,
} from './attendance/schemas/attendance-correction-request.schema';
import {
  ShiftTypeSchema,
  ShiftType,
} from './schedule/schemas/shift-type.schema';
import {
  ScheduleRuleSchema,
  ScheduleRule,
} from './schedule/schemas/schedule-rule.schema';
import {
  AttendanceRecordSchema,
  AttendanceRecord,
} from './attendance/schemas/attendance-record.schema';
import {
  TimeExceptionSchema,
  TimeException,
} from './attendance/schemas/time-exception.schema';
import {
  OvertimeRuleSchema,
  OvertimeRule,
} from './schedule/schemas/overtime-rule.schema';
import { ShiftSchema, Shift } from './schedule/schemas/shift.schema';
import {
  ShiftAssignmentSchema,
  ShiftAssignment,
} from './schedule/schemas/shift-assignment.schema';
import {
  LatenessRule,
  latenessRuleSchema,
} from './schedule/schemas/lateness-rule.schema';
import { HolidaySchema, Holiday } from './holiday/schemas/holiday.schema';
import { ShiftModule } from './Shift/shift.module';
import { AttendanceModule } from './attendance/attendance.module';
// Phase 3 - Policy schemas
import {
  TimePolicy,
  TimePolicySchema,
} from './policy/schemas/time-policy.schema';
import {
  PenaltyRecord,
  PenaltyRecordSchema,
} from './policy/schemas/penalty-record.schema';
import {
  OvertimeRecord,
  OvertimeRecordSchema,
} from './policy/schemas/overtime-record.schema';
// Phase 3 - Policy services
import { PolicyService } from './policy/services/policy.service';
import { PolicyEngineService } from './policy/services/policy-engine.service';
// Phase 3 - Policy controllers
import { PolicyController } from './policy/controllers/policy.controller';
// Phase 5 - Reporting service and controller
import { ReportingService } from './reporting/services/reporting.service';
import { ReportingController } from './reporting/controllers/reporting.controller';
// Phase 5 - Payroll schemas and services
import {
  PayrollSyncLog,
  PayrollSyncLogSchema,
} from './payroll/schemas/payroll-sync-log.schema';
import { PayrollService } from './payroll/services/payroll.service';
import { PrePayrollService } from './payroll/services/pre-payroll.service';
import { PayrollController } from './payroll/controllers/payroll.controller';
import { ExceptionEscalationSchedulerService } from './exception/services/exception-escalation-scheduler.service';
import { PayrollSyncSchedulerService } from './payroll/services/payroll-sync-scheduler.service';
import {
  RepeatedLatenessTracking,
  RepeatedLatenessTrackingSchema,
} from './attendance/schemas/repeated-lateness-tracking.schema';
import { RepeatedLatenessService } from './attendance/services/repeated-lateness.service';
import { VacationIntegrationService } from './attendance/services/vacation-integration.service';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';
import { forwardRef } from '@nestjs/common';
import { LeavesModule } from '../leaves/leaves.module';
import { AvailabilityModule } from './availability/availability.module';
import { PermissionModule } from './permission/permission.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load .env file
    // MongoDB connection is handled in app.module.ts - do NOT create duplicate connection here
    ScheduleModule.forRoot(), // Enable scheduled tasks for Phase 1 shift expiry notifications
    MongooseModule.forFeature([
      // Phase 1 - Shift Configuration & Assignment
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: ScheduleRule.name, schema: ScheduleRuleSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: OvertimeRule.name, schema: OvertimeRuleSchema },
      { name: LatenessRule.name, schema: latenessRuleSchema },
      { name: Holiday.name, schema: HolidaySchema },
      // Phase 2 - Attendance & Punching (also registered in AttendanceModule)
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
      {
        name: AttendanceCorrectionRequest.name,
        schema: AttendanceCorrectionRequestSchema,
      },
      {
        name: RepeatedLatenessTracking.name,
        schema: RepeatedLatenessTrackingSchema,
      },
      // Phase 3 - Policies & Rule Enforcement
      { name: TimePolicy.name, schema: TimePolicySchema },
      { name: PenaltyRecord.name, schema: PenaltyRecordSchema },
      { name: OvertimeRecord.name, schema: OvertimeRecordSchema },
      // Phase 5 - Reporting + Payroll Integration
      { name: PayrollSyncLog.name, schema: PayrollSyncLogSchema },
      // Notifications
      { name: NotificationLog.name, schema: NotificationLogSchema },
      // Employee System Roles (for escalation)
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
    ]),
    // Import feature modules
    ShiftModule, // Phase 1 - Shift Configuration & Assignment
    AttendanceModule, // Phase 2 - Attendance & Punching (exports ScheduleHelperService)
    forwardRef(() => LeavesModule), // US 16 - Vacation Package Integration (forwardRef to avoid circular dependency)
    AvailabilityModule, // Employee availability API for Recruitment subsystem
    PermissionModule, // US 15 - Permission Validation Rules (BR-TM-16, BR-TM-17, BR-TM-18)
    DeviceModule, // BR-TM-13 - Device Sync Service
  ],
  controllers: [
    TimeManagementController, // Main controller for Phase 2 & 4
    // AttendanceController is registered in AttendanceModule (imported above)
    PolicyController, // Phase 3 - Policies & Rule Enforcement
    ReportingController, // Phase 5 - Reporting
    PayrollController, // Phase 5 - Payroll Integration
  ],
  providers: [
    TimeManagementService, // Phase 2 & 4
    PolicyService, // Phase 3
    PolicyEngineService, // Phase 3
    ReportingService, // Phase 5
    PayrollService, // Phase 5
    PrePayrollService, // Phase 5
    ExceptionEscalationSchedulerService, // Phase 4 - Auto-escalation scheduler
    PayrollSyncSchedulerService, // Phase 5 - Daily payroll sync scheduler
    RepeatedLatenessService, // US 12 - Repeated lateness tracking & escalation
    VacationIntegrationService, // US 16 - Vacation Package Integration
    // Note: PolicyEngineService already uses VacationIntegrationService via dependency injection
    // PermissionValidationService and DeviceSyncService are provided by PermissionModule and DeviceModule
  ],
  exports: [
    TimeManagementService,
    PolicyService,
    PolicyEngineService,
    ReportingService,
    PayrollService,
    PrePayrollService,
  ],
})
export class TimeManagementModule {}
