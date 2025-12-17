export declare class CreateScheduleAssignmentDto {
    shiftTemplateId: string;
    employeeId?: string;
    departmentId?: string;
    positionId?: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    assignedBy: string;
    source?: string;
    metadata?: {
        notes?: string;
        reason?: string;
        previousAssignmentId?: string;
    };
}
