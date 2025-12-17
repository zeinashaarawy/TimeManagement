import { Document, Types } from 'mongoose';
export type ShiftExpiryNotificationDocument = ShiftExpiryNotification & Document;
export declare class ShiftExpiryNotification {
    shiftTemplateId?: Types.ObjectId;
    scheduleAssignmentId?: Types.ObjectId;
    expiryDate: Date;
    notificationSent: boolean;
    notificationSentAt: Date;
    notifiedTo: Types.ObjectId[];
    status: string;
    resolvedAt: Date;
    resolutionNotes: string;
}
export declare const ShiftExpiryNotificationSchema: import("mongoose").Schema<ShiftExpiryNotification, import("mongoose").Model<ShiftExpiryNotification, any, any, any, Document<unknown, any, ShiftExpiryNotification, any, {}> & ShiftExpiryNotification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ShiftExpiryNotification, Document<unknown, {}, import("mongoose").FlatRecord<ShiftExpiryNotification>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ShiftExpiryNotification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
