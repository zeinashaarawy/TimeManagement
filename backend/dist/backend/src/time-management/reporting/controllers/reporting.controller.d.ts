import type { Response } from 'express';
import { ReportingService } from '../services/reporting.service';
import { Types } from 'mongoose';
import { PenaltyStatus } from '../../policy/schemas/penalty-record.schema';
import { OvertimeStatus } from '../../policy/schemas/overtime-record.schema';
export declare class ReportingController {
    private readonly reportingService;
    constructor(reportingService: ReportingService);
    getAttendanceReport(employeeId?: string, departmentId?: string, startDate?: string, endDate?: string, includeExceptions?: string, page?: string, limit?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../attendance/schemas/attendance-record.schema").AttendanceRecordDocument, {}, {}> & import("mongoose").Document<unknown, {}, import("../../attendance/schemas/attendance-record.schema").AttendanceRecord, {}, {}> & import("../../attendance/schemas/attendance-record.schema").AttendanceRecord & {
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
    exportAttendanceReport(res: Response, employeeId?: string, departmentId?: string, startDate?: string, endDate?: string): Promise<void>;
    getOvertimeReport(employeeId?: string, departmentId?: string, startDate?: string, endDate?: string, status?: OvertimeStatus, page?: string, limit?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../policy/schemas/overtime-record.schema").OvertimeRecord, {}, {}> & import("../../policy/schemas/overtime-record.schema").OvertimeRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, import("../../policy/schemas/overtime-record.schema").OvertimeRecord, {}, {}> & import("../../policy/schemas/overtime-record.schema").OvertimeRecord & {
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
    exportOvertimeReport(res: Response, employeeId?: string, departmentId?: string, startDate?: string, endDate?: string, status?: OvertimeStatus): Promise<void>;
    getPenaltyReport(employeeId?: string, departmentId?: string, startDate?: string, endDate?: string, type?: string, status?: PenaltyStatus, page?: string, limit?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../policy/schemas/penalty-record.schema").PenaltyRecord, {}, {}> & import("../../policy/schemas/penalty-record.schema").PenaltyRecord & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }, {}, {}> & import("mongoose").Document<unknown, {}, import("../../policy/schemas/penalty-record.schema").PenaltyRecord, {}, {}> & import("../../policy/schemas/penalty-record.schema").PenaltyRecord & {
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
    exportPenaltyReport(res: Response, employeeId?: string, departmentId?: string, startDate?: string, endDate?: string, type?: string, status?: PenaltyStatus): Promise<void>;
}
