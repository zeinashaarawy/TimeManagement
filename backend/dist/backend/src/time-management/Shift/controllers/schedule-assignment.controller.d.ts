import { ScheduleAssignmentService } from '../services/schedule-assignment.service';
import { CreateScheduleAssignmentDto } from '../dto/create-schedule-assignment.dto';
import { BulkAssignShiftDto } from '../dto/bulk-assign-shift.dto';
import { QueryAssignmentsDto } from '../dto/query-assignments.dto';
import { UpdateAssignmentStatusDto } from '../dto/update-assignment-status.dto';
export declare class ScheduleAssignmentController {
    private readonly scheduleAssignmentService;
    constructor(scheduleAssignmentService: ScheduleAssignmentService);
    assign(createDto: CreateScheduleAssignmentDto): Promise<import("../schemas/schedule-assignment.schema").ScheduleAssignmentDocument>;
    bulkAssign(bulkDto: BulkAssignShiftDto): Promise<{
        success: number;
        failed: number;
        errors: any[];
    }>;
    query(queryDto: QueryAssignmentsDto): Promise<import("../schemas/schedule-assignment.schema").ScheduleAssignmentDocument[]>;
    findOne(id: string): Promise<import("../schemas/schedule-assignment.schema").ScheduleAssignmentDocument>;
    updateStatus(id: string, updateDto: UpdateAssignmentStatusDto): Promise<import("../schemas/schedule-assignment.schema").ScheduleAssignmentDocument>;
}
