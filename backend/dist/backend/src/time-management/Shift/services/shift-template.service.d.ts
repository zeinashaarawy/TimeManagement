import { Model } from 'mongoose';
import { ShiftTemplateDocument } from '../schemas/shift.schema';
import { ScheduleAssignmentDocument } from '../schemas/schedule-assignment.schema';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';
export declare class ShiftTemplateService {
    private shiftTemplateModel;
    private scheduleAssignmentModel;
    constructor(shiftTemplateModel: Model<ShiftTemplateDocument>, scheduleAssignmentModel: Model<ScheduleAssignmentDocument>);
    private validateShiftTemplate;
    create(createDto: CreateShiftTemplateDto): Promise<ShiftTemplateDocument>;
    findAll(): Promise<ShiftTemplateDocument[]>;
    findById(id: string): Promise<ShiftTemplateDocument>;
    update(id: string, updateDto: UpdateShiftTemplateDto): Promise<ShiftTemplateDocument>;
    delete(id: string): Promise<void>;
}
