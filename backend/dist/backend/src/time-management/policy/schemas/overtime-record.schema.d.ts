import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
export declare enum OvertimeStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    OVERRIDDEN = "OVERRIDDEN"
}
export type OvertimeRecordDocument = HydratedDocument<OvertimeRecord>;
export declare class OvertimeRecord {
    employeeId: Types.ObjectId;
    attendanceRecordId: Types.ObjectId;
    policyId: Types.ObjectId;
    overtimeMinutes: number;
    regularMinutes: number;
    multiplier: number;
    calculatedAmount: number;
    status: OvertimeStatus;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    reason?: string;
    overrideReason?: string;
    beforeValues?: Record<string, any>;
    afterValues?: Record<string, any>;
    exceptionId?: Types.ObjectId;
    recordDate: Date;
    isWeekend: boolean;
}
export declare const OvertimeRecordSchema: import("mongoose").Schema<OvertimeRecord, import("mongoose").Model<OvertimeRecord, any, any, any, import("mongoose").Document<unknown, any, OvertimeRecord, any, {}> & OvertimeRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OvertimeRecord, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<OvertimeRecord>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<OvertimeRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
