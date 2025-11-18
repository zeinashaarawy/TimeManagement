import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ShiftAssignment{
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shift', required: true })
  shift: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  position: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: ['approved', 'cancelled', 'expired', 'pending'],
    default: 'approved',
  })
  status: string;
}

export const ShiftAssignmentSchema = SchemaFactory.createForClass(
  ShiftAssignment,
);
