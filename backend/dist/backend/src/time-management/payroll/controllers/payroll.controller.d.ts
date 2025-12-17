import { PayrollService } from '../services/payroll.service';
import { PrePayrollService } from '../services/pre-payroll.service';
import { Types } from 'mongoose';
export declare class PayrollController {
    private readonly payrollService;
    private readonly prePayrollService;
    constructor(payrollService: PayrollService, prePayrollService: PrePayrollService);
    syncPayroll(body: {
        periodStart: string;
        periodEnd: string;
        employeeIds?: string[];
        initiatedBy?: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("../schemas/payroll-sync-log.schema").PayrollSyncLog, {}, {}> & import("../schemas/payroll-sync-log.schema").PayrollSyncLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    getSyncStatus(id: Types.ObjectId): Promise<import("mongoose").Document<unknown, {}, import("../schemas/payroll-sync-log.schema").PayrollSyncLog, {}, {}> & import("../schemas/payroll-sync-log.schema").PayrollSyncLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    retrySync(id: Types.ObjectId): Promise<import("mongoose").Document<unknown, {}, import("../schemas/payroll-sync-log.schema").PayrollSyncLog, {}, {}> & import("../schemas/payroll-sync-log.schema").PayrollSyncLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    validatePrePayroll(body: {
        periodStart: string;
        periodEnd: string;
    }): Promise<{
        isValid: boolean;
        issues: string[];
        pendingApprovals: number;
        inconsistentRecords: number;
    }>;
    runPrePayrollClosure(body: {
        periodStart: string;
        periodEnd: string;
        escalationDeadlineHours?: number;
    }): Promise<{
        validationResult: any;
        report: any;
        escalations: any[];
    }>;
    generatePayload(periodStart: string, periodEnd: string, employeeIds?: string): Promise<import("../services/payroll.service").PayrollPayload>;
}
