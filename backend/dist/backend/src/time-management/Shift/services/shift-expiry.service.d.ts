import { Model } from 'mongoose';
import { ShiftExpiryNotificationDocument } from '../schemas/shift-expiry-notification.schema';
import { ShiftTemplateDocument } from '../schemas/shift.schema';
import { ScheduleAssignmentDocument } from '../schemas/schedule-assignment.schema';
export declare class ShiftExpiryService {
    private shiftExpiryNotificationModel;
    private shiftTemplateModel;
    private scheduleAssignmentModel;
    constructor(shiftExpiryNotificationModel: Model<ShiftExpiryNotificationDocument>, shiftTemplateModel: Model<ShiftTemplateDocument>, scheduleAssignmentModel: Model<ScheduleAssignmentDocument>);
    getNotifications(status?: string): Promise<ShiftExpiryNotificationDocument[]>;
    detectExpiringShifts(daysBeforeExpiry?: number): Promise<number>;
}
