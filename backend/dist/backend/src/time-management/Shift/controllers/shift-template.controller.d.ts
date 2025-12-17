import { ShiftTemplateService } from '../services/shift-template.service';
import { CreateShiftTemplateDto } from '../dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from '../dto/update-shift-template.dto';
export declare class ShiftTemplateController {
    private readonly shiftTemplateService;
    constructor(shiftTemplateService: ShiftTemplateService);
    create(createDto: CreateShiftTemplateDto): Promise<import("../schemas/shift.schema").ShiftTemplateDocument>;
    findAll(): Promise<import("../schemas/shift.schema").ShiftTemplateDocument[]>;
    findOne(id: string): Promise<import("../schemas/shift.schema").ShiftTemplateDocument>;
    update(id: string, updateDto: UpdateShiftTemplateDto): Promise<import("../schemas/shift.schema").ShiftTemplateDocument>;
    remove(id: string): Promise<void>;
}
