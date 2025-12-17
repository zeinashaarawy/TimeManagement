export declare class BulkAssignShiftDto {
    shiftTemplateId: string;
    employeeIds?: string[];
    departmentId?: string;
    positionId?: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    assignedBy: string;
    reason?: string;
}
