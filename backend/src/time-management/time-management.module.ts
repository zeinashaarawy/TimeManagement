import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/timemanagement',
    ), // MongoDB connection
    ScheduleModule.forRoot(), // Enable scheduled tasks for Phase 1 shift expiry notifications
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
      {
        name: AttendanceCorrectionRequest.name,
        schema: AttendanceCorrectionRequestSchema,
      },
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: ScheduleRule.name, schema: ScheduleRuleSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
      { name: OvertimeRule.name, schema: OvertimeRuleSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: LatenessRule.name, schema: latenessRuleSchema },
      { name: Holiday.name, schema: HolidaySchema },
    ]),
    ShiftModule, // Import Phase 1 Shift module
  ],
  controllers: [TimeManagementController],
  providers: [TimeManagementService],
})
export class TimeManagementModule {}
