import { Document } from 'mongoose';
export type ShiftTemplateDocument = ShiftTemplate & Document;
export declare class ShiftTemplate {
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    restDays: string[];
    gracePeriod: number;
    isOvernight: boolean;
    rotationalPattern: string | null;
    expirationDate: Date | null;
    status: string;
    description: string;
    flexibleStartWindow: string;
    flexibleEndWindow: string;
    requiredHours: number;
    workDaysPerWeek: number;
    hoursPerDay: number;
}
export declare const ShiftTemplateSchema: import("mongoose").Schema<ShiftTemplate, import("mongoose").Model<ShiftTemplate, any, any, any, Document<unknown, any, ShiftTemplate, any, {}> & ShiftTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ShiftTemplate, Document<unknown, {}, import("mongoose").FlatRecord<ShiftTemplate>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ShiftTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
