import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  type: string; // National, Organizational, Weekly Rest Day
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
