export declare class UpdateShiftTemplateDto {
    name?: string;
    type?: string;
    startTime?: string;
    endTime?: string;
    restDays?: string[];
    gracePeriod?: number;
    isOvernight?: boolean;
    rotationalPattern?: string | null;
    expirationDate?: Date | null;
    status?: string;
    description?: string;
    flexibleStartWindow?: string;
    flexibleEndWindow?: string;
    requiredHours?: number;
    workDaysPerWeek?: number;
    hoursPerDay?: number;
}
