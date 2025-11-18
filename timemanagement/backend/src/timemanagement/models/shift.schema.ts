import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema({ timestamps: true })
export class Shift {
  @Prop({ required: true })
  name: string; // Normal Morning Shift, Overnight Shift, etc.

  @Prop({
    type: String,
    enum: ['normal', 'split', 'overnight', 'rotational'],
    default: 'normal',
  })
  type: string; // Required by MS1 (Shift Types)

  @Prop()
  startTime: string; // e.g., "09:00"

  @Prop()
  endTime: string; // e.g., "17:00"

  @Prop()
  pattern: string; // e.g., "4-on/3-off", flex rules

  @Prop({ default: true })
  isActive: boolean; // toggles shift availability
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
