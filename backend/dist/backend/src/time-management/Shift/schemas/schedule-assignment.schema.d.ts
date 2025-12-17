import { Document, Types } from 'mongoose';
export type ScheduleAssignmentDocument = ScheduleAssignment & Document;
export declare class ScheduleAssignment {
    shiftTemplateId: Types.ObjectId;
    employeeId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
    positionId?: Types.ObjectId;
    effectiveFrom: Date;
    effectiveTo: Date;
    assignedBy: Types.ObjectId;
    source: string;
    metadata: {
        notes?: string;
        reason?: string;
        previousAssignmentId?: Types.ObjectId;
    };
    status: string;
}
export declare const ScheduleAssignmentSchema: import("mongoose").Schema<ScheduleAssignment, import("mongoose").Model<ScheduleAssignment, any, any, any, Document<unknown, any, ScheduleAssignment, any, {}> & ScheduleAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ScheduleAssignment, Document<unknown, {}, import("mongoose").FlatRecord<ScheduleAssignment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ScheduleAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
