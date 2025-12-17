import { ShiftExpiryService } from './shift-expiry.service';
export declare class ShiftExpirySchedulerService {
    private readonly shiftExpiryService;
    private readonly logger;
    constructor(shiftExpiryService: ShiftExpiryService);
    handleExpiringShifts(): Promise<void>;
    triggerExpiryDetection(daysBeforeExpiry?: number): Promise<number>;
}
