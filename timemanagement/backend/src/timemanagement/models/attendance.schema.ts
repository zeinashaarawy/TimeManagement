import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Date, default: null })
  clockIn: Date;

  @Prop({ type: Date, default: null })
  clockOut: Date;

  @Prop({
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'weekend', 'holiday'],
    default: 'present'
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  lateMinutes: number;

  @Prop({ type: Number, default: 0 })
  overtimeMinutes: number;

  @Prop({ type: Number, default: 0 })
  workedMinutes: number;

  @Prop({ type: String, default: null })
  notes: string;

  @Prop({ type: Boolean, default: false })
  isManualEdit: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Manager', default: null })
  editedBy: Types.ObjectId;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
