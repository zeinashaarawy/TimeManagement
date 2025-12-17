import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
export declare enum PayrollSyncStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    PARTIAL = "PARTIAL"
}
export type PayrollSyncLogDocument = HydratedDocument<PayrollSyncLog>;
export declare class PayrollSyncLog {
    periodStart: Date;
    periodEnd: Date;
    status: PayrollSyncStatus;
    payloadSummary: {
        totalRecords: number;
        totalEmployees: number;
        totalOvertimeMinutes: number;
        totalPenalties: number;
        totalAmount: number;
    };
    errors?: Array<{
        employeeId: string;
        recordId: string;
        error: string;
        timestamp: Date;
    }>;
    initiatedBy?: Types.ObjectId;
    syncedAt?: Date;
    externalSyncId?: string;
    rawPayload?: Record<string, any>;
    retryCount: number;
    lastError?: string;
}
export declare const PayrollSyncLogSchema: import("mongoose").Schema<PayrollSyncLog, import("mongoose").Model<PayrollSyncLog, any, any, any, import("mongoose").Document<unknown, any, PayrollSyncLog, any, {}> & PayrollSyncLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PayrollSyncLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PayrollSyncLog>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PayrollSyncLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
