import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema({ timestamps: true })
export class Shift {
  @Prop({ required: true })
  name: string; // Normal, Split, Overnight, etc.

  @Prop()
  startTime: string; // e.g., "09:00"

  @Prop()
  endTime: string; // e.g., "17:00"

  @Prop({ default: 'Active' })
  status: string; // Approved, Cancelled, Expired

  @Prop()
  repeatPattern: string; // e.g., "4-on/3-off"
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
