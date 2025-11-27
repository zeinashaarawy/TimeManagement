import { PunchType } from '../../enums';
export declare class UpdatePunchDto {
    timestamp: Date;
    type: PunchType;
    device?: string;
    location?: string;
    rawMetadata?: Record<string, any>;
}
