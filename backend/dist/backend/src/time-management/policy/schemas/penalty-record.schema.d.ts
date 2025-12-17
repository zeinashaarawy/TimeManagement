import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
export declare enum PenaltyType {
    LATENESS = "LATENESS",
    SHORT_TIME = "SHORT_TIME",
    MISSED_PUNCH = "MISSED_PUNCH",
    EARLY_LEAVE = "EARLY_LEAVE",
    OTHER = "OTHER"
}
export declare enum PenaltyStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    OVERRIDDEN = "OVERRIDDEN"
}
export type PenaltyRecordDocument = HydratedDocument<PenaltyRecord>;
export declare class PenaltyRecord {
    employeeId: Types.ObjectId;
    attendanceRecordId: Types.ObjectId;
    policyId: Types.ObjectId;
    type: PenaltyType;
    amount: number;
    minutes: number;
    status: PenaltyStatus;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    reason?: string;
    overrideReason?: string;
    beforeValues?: Record<string, any>;
    afterValues?: Record<string, any>;
    exceptionId?: Types.ObjectId;
    recordDate: Date;
}
export declare const PenaltyRecordSchema: import("mongoose").Schema<PenaltyRecord, import("mongoose").Model<PenaltyRecord, any, any, any, import("mongoose").Document<unknown, any, PenaltyRecord, any, {}> & PenaltyRecord & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PenaltyRecord, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PenaltyRecord>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PenaltyRecord> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
