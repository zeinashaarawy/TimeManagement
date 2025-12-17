import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecord, PenaltyRecordDocument } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecord, OvertimeRecordDocument } from '../../policy/schemas/overtime-record.schema';
import { PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeStatus } from '../../policy/schemas/overtime-record.schema';
export interface AttendanceReportFilters {
    employeeId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    includeExceptions?: boolean;
}
export interface OvertimeReportFilters {
    employeeId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    status?: OvertimeStatus;
}
export interface PenaltyReportFilters {
    employeeId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: PenaltyStatus;
}
export declare class ReportingService {
    private attendanceModel;
    private penaltyModel;
    private overtimeModel;
    constructor(attendanceModel: Model<AttendanceRecordDocument>, penaltyModel: Model<PenaltyRecordDocument>, overtimeModel: Model<OvertimeRecordDocument>);
    getAttendanceReport(filters: AttendanceReportFilters, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, AttendanceRecord, {}, {}> & AttendanceRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }>)[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOvertimeReport(filters: OvertimeReportFilters, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, OvertimeRecord, {}, {}> & OvertimeRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, OvertimeRecord, {}, {}> & OvertimeRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        aggregates: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPenaltyReport(filters: PenaltyReportFilters, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, PenaltyRecord, {}, {}> & PenaltyRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, PenaltyRecord, {}, {}> & PenaltyRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: Types.ObjectId;
        }>)[];
        aggregates: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    exportAttendanceReportCSV(filters: AttendanceReportFilters): Promise<string>;
    exportOvertimeReportCSV(filters: OvertimeReportFilters): Promise<string>;
    exportPenaltyReportCSV(filters: PenaltyReportFilters): Promise<string>;
    private buildAttendanceQuery;
    private buildOvertimeQuery;
    private buildPenaltyQuery;
    private generateCSV;
}
