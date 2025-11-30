import { Controller, Get, Post, Param, Query, Body, BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../schemas/attendance-record.schema';
import { TimeException, TimeExceptionDocument } from '../schemas/time-exception.schema';
import { PunchType, TimeExceptionType, TimeExceptionStatus } from '../../enums/index';
import { CreatePunchDto } from '../dto/create-punch.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceRecord.name) private recordModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
  ) {}

  /** Create a punch (IN/OUT) for an employee */
  async createPunch(dto: CreatePunchDto) {
    // Normalize date to start of day
    const dateOnly = new Date(dto.timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let record = await this.recordModel.findOne<AttendanceRecordDocument>({
      employeeId: new Types.ObjectId(dto.employeeId),
      recordDate: dateOnly,
      finalisedForPayroll: true, // optional: only modify current active record
    });

    if (!record) {
      record = new this.recordModel({
        employeeId: new Types.ObjectId(dto.employeeId),
        recordDate: dateOnly,
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Process the punch
    if (dto.type === PunchType.IN) {
      record.punches.push({ type: PunchType.IN, time: dto.timestamp });
    } else if (dto.type === PunchType.OUT) {
      // Find last IN punch before this OUT
      const lastInPunch = record.punches
        .filter(p => p.type === PunchType.IN)
        .slice(-1)[0];

      const lastOutPunch = record.punches
        .filter(p => p.type === PunchType.OUT)
        .slice(-1)[0];

      if (!lastInPunch || !lastOutPunch || lastOutPunch.time < lastInPunch.time) {
        // Valid OUT punch
        record.punches.push({ type: PunchType.OUT, time: dto.timestamp });
      } else {
        // No matching IN punch → create TimeException
        const exception = await this.exceptionModel.create({
          employeeId: new Types.ObjectId(dto.employeeId),
          type: TimeExceptionType.MISSED_PUNCH,
          attendanceRecordId: record._id,
          assignedTo: new Types.ObjectId('managerObjectIdHere'), // TODO: replace with real manager ID
          status: TimeExceptionStatus.OPEN,
          reason: 'Out punch without corresponding IN punch',
        });
        // Link exception to attendance record
        record.exceptionIds.push(exception._id);
      }
    }

    // Optionally recalc totalWorkMinutes & hasMissedPunch here
    // TODO: implement work time calculation

    // Save the attendance record
    await record.save();

    return record;
  }

  /** Get attendance record for a specific employee and date */
   async getAttendance(employeeId: string, date?: Date): Promise<AttendanceRecordDocument | null> {
    const query: FilterQuery<AttendanceRecordDocument> = { 
      employeeId: new Types.ObjectId(employeeId) 
    };

    if (date) {
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      query.recordDate = dateOnly;
    }

    return this.recordModel.findOne(query).exec();
  }
}


