import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TimeExceptionType, TimeExceptionStatus, PermissionType } from '../../enums/index';

export type TimeExceptionDocument = HydratedDocument<TimeException>;

@Schema()
export class TimeException {
  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeId: Types.ObjectId;

  @Prop({ enum: TimeExceptionType, required: true })
  type: TimeExceptionType;

  @Prop({ type: Types.ObjectId, ref: 'AttendanceRecord', required: true })
  attendanceRecordId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  assignedTo?: Types.ObjectId; // person responsible for handling the exception

  @Prop({ enum: TimeExceptionStatus, default: TimeExceptionStatus.OPEN })
  status: TimeExceptionStatus;

  @Prop()
  reason?: string;

  // Permission-specific fields (BR-TM-16, BR-TM-17, BR-TM-18)
  @Prop({ enum: PermissionType, required: false })
  permissionType?: PermissionType; // Type of permission (EARLY_IN, LATE_OUT, etc.)

  @Prop({ type: Number, required: false })
  durationMinutes?: number; // Duration of permission in minutes

  @Prop({ type: Date, required: false })
  requestedDate?: Date; // Date for which permission is requested

  // Date validation tracking (BR-TM-17)
  @Prop({ type: Boolean, default: false })
  contractStartDateValidated?: boolean; // Validated against contract start date

  @Prop({ type: Boolean, default: false })
  financialCalendarValidated?: boolean; // Validated against financial calendar

  @Prop({ type: Boolean, default: false })
  probationDateValidated?: boolean; // Validated against probation end date

  // Payroll and benefits impact tracking (BR-TM-18)
  @Prop({ type: Boolean, default: false })
  affectsPayroll?: boolean; // Whether this exception affects payroll

  @Prop({ type: Boolean, default: false })
  affectsBenefits?: boolean; // Whether this exception affects benefits

  @Prop({ type: String, required: false })
  payrollImpactType?: 'OVERTIME' | 'SHORT_TIME' | 'ADJUSTMENT' | 'NONE'; // Payroll impact type

  @Prop({ type: String, required: false })
  benefitsImpactType?: 'ACCRUAL' | 'DEDUCTION' | 'NONE'; // Benefits impact type

  @Prop({ type: Number, required: false })
  payrollImpactAmount?: number; // Calculated payroll impact amount

  @Prop({ type: Number, required: false })
  benefitsImpactAmount?: number; // Calculated benefits impact amount
}

export const TimeExceptionSchema = SchemaFactory.createForClass(TimeException);
