import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { Attendance, AttendanceSchema } from './models/attendance.schema';
import { Employee, EmployeeSchema } from './models/employee.schema';
import { Shift, ShiftSchema } from './models/shift.schema';
import { Department, DepartmentSchema } from './models/department.schema';
import { Holiday, HolidaySchema } from './models/holiday.schema';
import { TimeException, TimeExceptionSchema } from './models/time-exception.schema';
import { Position, PositionSchema } from './models/position.schema';
import { TimeManagementSeeds } from './seeds/timemanagement.seeds';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Attendance', schema: AttendanceSchema },
      { name: 'Employee', schema: EmployeeSchema },
      { name: 'Shift', schema: ShiftSchema },
      { name: 'Department', schema: DepartmentSchema },
      { name: 'Holiday', schema: HolidaySchema },
      { name: 'TimeException', schema: TimeExceptionSchema },
      { name: 'Position', schema: PositionSchema },
    ]),
  ],
  controllers: [TimeManagementController],
  providers: [TimeManagementService, TimeManagementSeeds],
  exports: [TimeManagementService],
})
export class TimeManagementModule {}