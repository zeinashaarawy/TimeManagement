import { Document } from 'mongoose';
export type PunchDocument = Punch & Document;
export declare class Punch {
    employeeId: string;
    timestamp: Date;
    type: 'in' | 'out';
    device?: string;
    location?: string;
    rawMetadata?: Record<string, any>;
}
export declare const PunchSchema: import("mongoose").Schema<Punch, import("mongoose").Model<Punch, any, any, any, Document<unknown, any, Punch, any, {}> & Punch & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Punch, Document<unknown, {}, import("mongoose").FlatRecord<Punch>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Punch> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
