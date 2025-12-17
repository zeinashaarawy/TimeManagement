import { Model } from 'mongoose';
import { ScheduleAssignmentDocument } from '../schemas/schedule-assignment.schema';
import { ShiftTemplateDocument } from '../schemas/shift.schema';
import { CreateScheduleAssignmentDto } from '../dto/create-schedule-assignment.dto';
import { BulkAssignShiftDto } from '../dto/bulk-assign-shift.dto';
import { QueryAssignmentsDto } from '../dto/query-assignments.dto';
import { UpdateAssignmentStatusDto } from '../dto/update-assignment-status.dto';
import { ShiftTemplateService } from './shift-template.service';
export declare class ScheduleAssignmentService {
    private scheduleAssignmentModel;
    private shiftTemplateModel;
    private shiftTemplateService;
    constructor(scheduleAssignmentModel: Model<ScheduleAssignmentDocument>, shiftTemplateModel: Model<ShiftTemplateDocument>, shiftTemplateService: ShiftTemplateService);
    private validateAssignment;
    private detectConflicts;
    assign(createDto: CreateScheduleAssignmentDto): Promise<ScheduleAssignmentDocument>;
    bulkAssign(bulkDto: BulkAssignShiftDto): Promise<{
        success: number;
        failed: number;
        errors: any[];
    }>;
    query(queryDto: QueryAssignmentsDto): Promise<ScheduleAssignmentDocument[]>;
    calculateRotationalSchedule(startDate: Date, endDate: Date, pattern: string): {
        workDays: Date[];
        restDays: Date[];
    };
    updateStatus(id: string, updateDto: UpdateAssignmentStatusDto): Promise<ScheduleAssignmentDocument>;
    findById(id: string): Promise<ScheduleAssignmentDocument>;
}
