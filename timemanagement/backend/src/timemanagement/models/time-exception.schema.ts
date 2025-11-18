import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeExceptionDocument = TimeException & Document;

@Schema({ timestamps: true })
export class TimeException {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['Correction', 'Overtime', 'Permission'],
  })
  type: string;

  @Prop({ required: true })
  requestDate: Date; // when the request was submitted

  @Prop()
  targetDate: Date; // date the correction/permission/overtime applies to

  @Prop({
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  resolvedBy: Types.ObjectId; // line manager or HR admin

  @Prop()
  reason: string; // employee's reason

  @Prop()
  notes: string; // HR/admin notes
}

export const TimeExceptionSchema = SchemaFactory.createForClass(TimeException);
