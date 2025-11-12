import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TimeExceptionDocument = TimeException & Document;

@Schema({ timestamps: true })
export class TimeException {
  @Prop({ required: true })
  employeeId: string;

  @Prop()
  type: string; // e.g., "Correction", "Overtime", "Permission"

  @Prop({ required: true })
  requestDate: Date;

  @Prop()
  status: string; // Pending, Approved, Rejected

  @Prop()
  resolvedBy: string;

  @Prop()
  notes: string;
}

export const TimeExceptionSchema = SchemaFactory.createForClass(TimeException);
