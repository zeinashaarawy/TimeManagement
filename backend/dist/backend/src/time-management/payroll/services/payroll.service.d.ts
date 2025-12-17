import { Model, Types } from 'mongoose';
import { PayrollSyncLogDocument } from '../schemas/payroll-sync-log.schema';
import { AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { PenaltyRecordDocument } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecordDocument } from '../../policy/schemas/overtime-record.schema';
import { TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
export interface PayrollPayload {
    periodStart: string;
    periodEnd: string;
    records: Array<{
        employeeId: string;
        attendanceRecords: Array<{
            recordId: string;
            date: string;
            workedMinutes: number;
            overtime: Array<{
                minutes: number;
                multiplier: number;
                amount: number;
                isWeekend: boolean;
            }>;
            penalties: Array<{
                type: string;
                amount: number;
                minutes: number;
            }>;
        }>;
        totals: {
            totalWorkedMinutes: number;
            totalOvertimeMinutes: number;
            totalOvertimeAmount: number;
            totalPenalties: number;
        };
    }>;
    summary: {
        totalEmployees: number;
        totalRecords: number;
        totalOvertimeMinutes: number;
        totalPenalties: number;
        totalAmount: number;
    };
}
export declare class PayrollService {
    private syncLogModel;
    private attendanceModel;
    private penaltyModel;
    private overtimeModel;
    private exceptionModel;
    constructor(syncLogModel: Model<PayrollSyncLogDocument>, attendanceModel: Model<AttendanceRecordDocument>, penaltyModel: Model<PenaltyRecordDocument>, overtimeModel: Model<OvertimeRecordDocument>, exceptionModel: Model<TimeExceptionDocument>);
    generatePayrollPayload(periodStart: Date, periodEnd: Date, employeeIds?: Types.ObjectId[]): Promise<PayrollPayload>;
    syncPayroll(periodStart: Date, periodEnd: Date, initiatedBy?: Types.ObjectId, employeeIds?: Types.ObjectId[]): Promise<PayrollSyncLogDocument>;
    retryPayrollSync(syncLogId: Types.ObjectId): Promise<PayrollSyncLogDocument>;
    getSyncStatus(syncLogId: Types.ObjectId): Promise<PayrollSyncLogDocument>;
    validatePrePayroll(periodStart: Date, periodEnd: Date): Promise<{
        isValid: boolean;
        issues: string[];
        pendingApprovals: number;
        inconsistentRecords: number;
    }>;
}
