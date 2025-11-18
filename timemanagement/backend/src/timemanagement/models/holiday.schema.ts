import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date; // Start of holiday

  @Prop({ required: true })
  endDate: Date; // End of holiday (same as startDate if 1-day)

  @Prop({
    required: true,
    enum: ['National', 'Organizational', 'WeeklyRestDay'],
  })
  type: string;

  @Prop({ default: true })
  isPaid: boolean; // Usually yes for national holidays
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
