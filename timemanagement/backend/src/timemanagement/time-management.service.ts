import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './models/attendance.schema';
import { Employee, EmployeeDocument } from './models/employee.schema';
import { Department, DepartmentDocument } from './models/department.schema';
import { Shift, ShiftDocument } from './models/shift.schema';
import { Holiday, HolidayDocument } from './models/holiday.schema';
import { Position, PositionDocument } from './models/position.schema';
import { TimeException, TimeExceptionDocument } from './models/time-exception.schema';

@Injectable()
export class TimeManagementService {
  constructor(
    @InjectModel('Attendance') private attendanceModel: Model<AttendanceDocument>,
    @InjectModel('Employee') private employeeModel: Model<EmployeeDocument>,
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('Shift') private shiftModel: Model<ShiftDocument>,
    @InjectModel('Holiday') private holidayModel: Model<HolidayDocument>,
    @InjectModel('Position') private positionModel: Model<PositionDocument>,
    @InjectModel('TimeException') private timeExceptionModel: Model<TimeExceptionDocument>
  ) {}

  async getAttendanceSummary() {
    return this.attendanceModel.find().exec();
  }

  async getAllEmployees() {
    return this.employeeModel.find().exec();
  }

  async getAllDepartments() {
    return this.departmentModel.find().exec();
  }

  async getAllShifts() {
    return this.shiftModel.find().exec();
  }

  async getAllHolidays() {
    return this.holidayModel.find().exec();
  }

  async getAllPositions() {
    return this.positionModel.find().exec();
  }

  async getAllTimeExceptions() {
    return this.timeExceptionModel.find().exec();
  }
}
