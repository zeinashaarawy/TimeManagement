import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  address: string;

  @Prop()
  departmentId: string;

  @Prop()
  positionId: string;

  @Prop({ default: [] })
  shiftIds: string[]; // multiple shifts can be assigned
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
