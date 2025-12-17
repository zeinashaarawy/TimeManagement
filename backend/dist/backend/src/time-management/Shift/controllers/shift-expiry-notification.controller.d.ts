import { ShiftExpiryService } from '../services/shift-expiry.service';
import { ShiftExpirySchedulerService } from '../services/shift-expiry-scheduler.service';
export declare class ShiftExpiryNotificationController {
    private readonly shiftExpiryService;
    private readonly shiftExpirySchedulerService;
    constructor(shiftExpiryService: ShiftExpiryService, shiftExpirySchedulerService: ShiftExpirySchedulerService);
    getNotifications(status?: string): Promise<import("../schemas/shift-expiry-notification.schema").ShiftExpiryNotificationDocument[]>;
    triggerDetection(daysBeforeExpiry?: number): Promise<{
        notificationsCreated: number;
        message: string;
    }>;
}
