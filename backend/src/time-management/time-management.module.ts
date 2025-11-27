import { Module } from '@nestjs/common';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { AttendanceController } from './attendance/controllers/attendance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogSchema, NotificationLog } from './notifications/schemas/notification-log.schema';
import { AttendanceCorrectionRequestSchema, AttendanceCorrectionRequest } from './attendance/schemas/attendance-correction-request.schema';
import { ShiftTypeSchema, ShiftType } from './schedule/schemas/shift-type.schema';
import { ScheduleRuleSchema, ScheduleRule } from './schedule/schemas/schedule-rule.schema';
import { AttendanceRecordSchema, AttendanceRecord } from './attendance/schemas/attendance-record.schema';
import { TimeExceptionSchema, TimeException } from './attendance/schemas/time-exception.schema';
import { OvertimeRuleSchema, OvertimeRule } from './schedule/schemas/overtime-rule.schema';
import { ShiftSchema, Shift } from './schedule/schemas/shift.schema';
import { ShiftAssignmentSchema, ShiftAssignment } from './schedule/schemas/shift-assignment.schema';
import { LatenessRule, latenessRuleSchema } from './schedule/schemas/lateness-rule.schema';
import { HolidaySchema, Holiday } from './holiday/schemas/holiday.schema';


@Module({
  imports: [MongooseModule.forFeature([
    { name: NotificationLog.name, schema: NotificationLogSchema },
    { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
    { name: ShiftType.name, schema: ShiftTypeSchema },
    { name: ScheduleRule.name, schema: ScheduleRuleSchema },
    { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
    { name: TimeException.name, schema: TimeExceptionSchema },
    { name: OvertimeRule.name, schema: OvertimeRuleSchema },
    { name: Shift.name, schema: ShiftSchema },
    { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
    { name: LatenessRule.name, schema: latenessRuleSchema },
    { name: Holiday.name, schema: HolidaySchema },
  ])],
  controllers: [TimeManagementController],
  providers: [TimeManagementService]
})
export class TimeManagementModule {}
