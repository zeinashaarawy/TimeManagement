import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SchedulingRuleDocument = SchedulingRule & Document;

@Schema({ timestamps: true })
export class SchedulingRule {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['FLEXIBLE', 'ROTATIONAL', 'COMPRESSED'] })
  type: string; // FLEXIBLE, ROTATIONAL, COMPRESSED

  // Flexible hours configuration
  @Prop({ type: String, required: false })
  flexInWindow?: string; // e.g., "08:00-10:00"

  @Prop({ type: String, required: false })
  flexOutWindow?: string; // e.g., "17:00-19:00"

  // Rotational pattern configuration
  @Prop({ type: String, required: false })
  rotationalPattern?: string; // e.g., "2 days morning, 2 days night"

  // Compressed workweek configuration
  @Prop({ type: Number, required: false })
  workDaysPerWeek?: number; // e.g., 4

  @Prop({ type: Number, required: false })
  hoursPerDay?: number; // e.g., 10

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: String, required: false })
  description?: string;

  // Link to departments (optional)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Department' }],
    required: false,
  })
  departmentIds?: Types.ObjectId[];

  // Link to shift templates (optional)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'ShiftTemplate' }],
    required: false,
  })
  shiftTemplateIds?: Types.ObjectId[];
}

export const SchedulingRuleSchema =
  SchemaFactory.createForClass(SchedulingRule);
