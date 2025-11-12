import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
  @Prop({ required: true })
  title: string;

  @Prop()
  departmentId: string;

  @Prop({ default: [] })
  shiftIds: string[];
}

export const PositionSchema = SchemaFactory.createForClass(Position);
