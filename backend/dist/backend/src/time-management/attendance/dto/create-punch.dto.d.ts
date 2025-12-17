import { PunchType } from 'src/time-management/enums';
export declare class CreatePunchDto {
    employeeId: string;
    timestamp: Date;
    type: PunchType;
    device?: string;
    location?: string;
    rawMetadata?: Record<string, any>;
}
