import { TimeManagementService } from './time-management.service';
import { CreatePunchDto } from './attendance/dto/create-punch.dto';
import { UpdatePunchDto } from './attendance/dto/update-punch.dto';
export declare class TimeManagementController {
    private readonly tmService;
    constructor(tmService: TimeManagementService);
    recordPunch(dto: CreatePunchDto): Promise<{
        message: string;
        attendance: import("mongoose").Document<unknown, {}, import("./attendance/schemas/attendance-record.schema").AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, import("./attendance/schemas/attendance-record.schema").AttendanceRecord, {}, {}> & import("./attendance/schemas/attendance-record.schema").AttendanceRecord & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    }>;
    getAttendance(employeeId: string, date?: string): Promise<{
        message: string;
        punches: never[];
        employeeId?: undefined;
        totalWorkMinutes?: undefined;
        hasMissedPunch?: undefined;
        exceptionIds?: undefined;
    } | {
        employeeId: import("mongoose").Types.ObjectId;
        punches: import("mongoose").FlattenMaps<import("./attendance/schemas/attendance-record.schema").Punch>[];
        totalWorkMinutes: number;
        hasMissedPunch: boolean;
        exceptionIds: import("mongoose").Types.ObjectId[];
        message?: undefined;
    }>;
    getExceptions(employeeId: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    createException(body: {
        employeeId: string;
        recordId: string;
        reason: string;
        assignedToId: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    correctAttendance(body: {
        employeeId: string;
        date: string;
        punches: UpdatePunchDto[];
    }): Promise<{
        message: string;
        attendance: import("mongoose").Document<unknown, {}, import("./attendance/schemas/attendance-record.schema").AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, import("./attendance/schemas/attendance-record.schema").AttendanceRecord, {}, {}> & import("./attendance/schemas/attendance-record.schema").AttendanceRecord & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    }>;
    detectMissedPunch(body: {
        employeeId: string;
        date: string;
    }): Promise<{
        message: string;
        exception: import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, import("./attendance/schemas/time-exception.schema").TimeException, {}, {}> & import("./attendance/schemas/time-exception.schema").TimeException & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>;
    } | {
        message: string;
        exception?: undefined;
    }>;
    getNotifications(employeeId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./notifications/schemas/notification-log.schema").NotificationLog, {}, {}> & import("./notifications/schemas/notification-log.schema").NotificationLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
}
