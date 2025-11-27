import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument, Punch } from './attendance/schemas/attendance-record.schema';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
import { TimeException, TimeExceptionDocument } from './attendance/schemas/time-exception.schema';
import { NotificationLog, NotificationLogDocument } from './notifications/schemas/notification-log.schema';
export declare class TimeManagementService {
    private readonly attendanceModel;
    private readonly exceptionModel;
    private readonly notificationModel;
    constructor(attendanceModel: Model<AttendanceRecordDocument>, exceptionModel: Model<TimeExceptionDocument>, notificationModel: Model<NotificationLogDocument>);
    recordPunch(dto: CreatePunchDto): Promise<{
        message: string;
        attendance: import("mongoose").Document<unknown, {}, AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, AttendanceRecord, {}, {}> & AttendanceRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }>;
    }>;
    getNotifications(employeeId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, NotificationLog, {}, {}> & NotificationLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    sendNotification(to: string, type: string, message?: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, NotificationLog, {}, {}> & NotificationLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, NotificationLog, {}, {}> & NotificationLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getAttendance(employeeId: string, date?: string): Promise<{
        message: string;
        punches: never[];
        employeeId?: undefined;
        totalWorkMinutes?: undefined;
        hasMissedPunch?: undefined;
        exceptionIds?: undefined;
    } | {
        employeeId: Types.ObjectId;
        punches: import("mongoose").FlattenMaps<Punch>[];
        totalWorkMinutes: number;
        hasMissedPunch: boolean;
        exceptionIds: Types.ObjectId[];
        message?: undefined;
    }>;
    createTimeException(employeeId: string, recordId: string, reason: string, assignedToId: string): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    getExceptions(employeeId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    correctAttendance(employeeId: string, date: Date, punches: UpdatePunchDto[]): Promise<{
        message: string;
        attendance: import("mongoose").Document<unknown, {}, AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, AttendanceRecord, {}, {}> & AttendanceRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }>;
    }>;
    detectMissedPunches(employeeId: string, date: Date): Promise<{
        message: string;
        exception: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, TimeException, {}, {}> & TimeException & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: Types.ObjectId;
        }>;
    } | {
        message: string;
        exception?: undefined;
    }>;
}
