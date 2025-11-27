import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AttendanceRecord,
  AttendanceRecordDocument,
  Punch,
} from './attendance/schemas/attendance-record.schema';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
import { TimeException, TimeExceptionDocument } from './attendance/schemas/time-exception.schema';
import { TimeExceptionType, TimeExceptionStatus, PunchType } from './enums/index';
import { NotificationLog, NotificationLogDocument } from './notifications/schemas/notification-log.schema';


@Injectable()
export class TimeManagementService {
  constructor(
    @InjectModel(AttendanceRecord.name)
    private readonly attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name)
    private readonly exceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationModel: Model<NotificationLogDocument>, 
  ) {}

  // ------------------- RECORD A PUNCH -------------------
  async recordPunch(dto: CreatePunchDto) {
    const employeeObjectId = new Types.ObjectId(dto.employeeId);
    const punchTime = new Date(dto.timestamp);

    // Prepare day boundaries
    const startOfDay = new Date(punchTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(punchTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Find today's attendance
    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': { $gte: startOfDay, $lte: endOfDay },
    });

    // Create new if none found
    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        punches: [],
      });
    }

    // Add punch
    attendance.punches.push({
      type: dto.type,
      time: punchTime,
    });

    // Save updated record
    const savedRecord = await attendance.save();

    // ------------------- AUTO MISSED PUNCH CHECK -------------------
    const punchesToday = savedRecord.punches.length;

    if (punchesToday < 2) {
  const existing = await this.exceptionModel.findOne({
    employeeId: employeeObjectId,
    type: 'MISSED_PUNCH',
    'createdAt': { $gte: startOfDay, $lte: endOfDay }
  });

  if (!existing) {
    const exception = await this.exceptionModel.create({
      employeeId: employeeObjectId,
      attendanceRecordId: savedRecord._id,
      type: 'MISSED_PUNCH',
      status: 'OPEN',
      reason: `Employee has only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`,
    });

    // Send notification
    await this.sendNotification(
      dto.employeeId,
      'MISSED_PUNCH',
      `Missed punch detected: only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`
    );
  }
}


    return {
      message: 'Punch recorded successfully',
      attendance: savedRecord,
    };
  }
    async getNotifications(employeeId: string) {
  return this.notificationModel.find({ to: new Types.ObjectId(employeeId) }).lean();
}

    async sendNotification(
      to: string, 
      type: string, 
      message?: string
       ){
        const notification = new this.notificationModel({
        to: new Types.ObjectId(to),
        type,
        message,
  });
  return notification.save();
}

  // ------------------- GET ATTENDANCE -------------------
  async getAttendance(employeeId: string, date?: string) {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query['punches.time'] = { $gte: start, $lte: end };
    }

    const record = await this.attendanceModel.findOne(query).lean();
    if (!record)
      return { message: 'No attendance found', punches: [] };

    return {
      employeeId: record.employeeId,
      punches: record.punches,
      totalWorkMinutes: record.totalWorkMinutes,
      hasMissedPunch: record.hasMissedPunch,
      exceptionIds: record.exceptionIds,
    };
  }

  // ------------------- CREATE TIME EXCEPTION -------------------
  async createTimeException(
    employeeId: string,
    recordId: string,
    reason: string,
    assignedToId: string,
  ) {
    const exception = new this.exceptionModel({
      employeeId: new Types.ObjectId(employeeId),
      attendanceRecordId: new Types.ObjectId(recordId),
      reason,
      type: TimeExceptionType.MISSED_PUNCH,
      status: TimeExceptionStatus.OPEN,
      assignedTo: new Types.ObjectId(assignedToId), // required field
    });
    return exception.save();
  }

  // ------------------- GET TIME EXCEPTIONS -------------------
  async getExceptions(employeeId: string) {
    return this.exceptionModel.find({
      employeeId: new Types.ObjectId(employeeId),
    }).exec();
  }

  // ------------------- CORRECT ATTENDANCE -------------------
  async correctAttendance(
    employeeId: string,
    date: Date,
    punches: UpdatePunchDto[],
  ) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      attendance = new this.attendanceModel({
        employeeId: employeeObjectId,
        punches: [],
      });
    }

    attendance.punches = punches.map((p) => ({
      type: p.type,
      time: p.timestamp,
    }));

    const saved = await attendance.save();
    return {
      message: 'Attendance corrected successfully',
      attendance: saved,
    };
  }

  // ------------------- MANUAL MISSED PUNCH DETECTION -------------------
  async detectMissedPunches(employeeId: string, date: Date) {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const attendance = await this.attendanceModel.findOne({
      employeeId: employeeObjectId,
      'punches.time': {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999)),
      },
    });

    const punchesCount = attendance?.punches.length || 0;
    if (punchesCount < 2) {
      const exception = new this.exceptionModel({
        employeeId: employeeObjectId,
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: attendance?._id,
        assignedTo: null,
        status: TimeExceptionStatus.OPEN,
        reason: `Missed punches on ${date.toDateString()}`,
      });
      await exception.save();
      return { message: 'Time exception created', exception };
    }
    return { message: 'No missed punches detected' };
  }
}
