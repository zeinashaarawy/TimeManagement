"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftTemplateService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shift_schema_1 = require("../schemas/shift.schema");
const schedule_assignment_schema_1 = require("../schemas/schedule-assignment.schema");
let ShiftTemplateService = class ShiftTemplateService {
    shiftTemplateModel;
    scheduleAssignmentModel;
    constructor(shiftTemplateModel, scheduleAssignmentModel) {
        this.shiftTemplateModel = shiftTemplateModel;
        this.scheduleAssignmentModel = scheduleAssignmentModel;
    }
    validateShiftTemplate(dto) {
        const type = dto.type;
        if (!type) {
            return;
        }
        if (type === 'flexible') {
            if ('flexibleStartWindow' in dto && !dto.flexibleStartWindow) {
                throw new common_1.BadRequestException('flexibleStartWindow is required for flexible shift type');
            }
            if ('flexibleEndWindow' in dto && !dto.flexibleEndWindow) {
                throw new common_1.BadRequestException('flexibleEndWindow is required for flexible shift type');
            }
            if ('requiredHours' in dto &&
                (!dto.requiredHours || dto.requiredHours < 1 || dto.requiredHours > 24)) {
                throw new common_1.BadRequestException('requiredHours must be between 1 and 24 for flexible shift type');
            }
            if (dto.flexibleStartWindow && dto.flexibleEndWindow) {
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(dto.flexibleStartWindow) ||
                    !timeRegex.test(dto.flexibleEndWindow)) {
                    throw new common_1.BadRequestException('Time format must be HH:mm (24-hour format)');
                }
                const [startHour, startMin] = dto.flexibleStartWindow
                    .split(':')
                    .map(Number);
                const [endHour, endMin] = dto.flexibleEndWindow.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                if (startMinutes >= endMinutes) {
                    throw new common_1.BadRequestException('flexibleStartWindow must be before flexibleEndWindow');
                }
                const windowHours = (endMinutes - startMinutes) / 60;
                if (dto.requiredHours && dto.requiredHours > windowHours) {
                    throw new common_1.BadRequestException('requiredHours cannot exceed the time window between flexibleStartWindow and flexibleEndWindow');
                }
            }
        }
        if (type === 'compressed') {
            if ('workDaysPerWeek' in dto &&
                (!dto.workDaysPerWeek ||
                    dto.workDaysPerWeek < 1 ||
                    dto.workDaysPerWeek > 7)) {
                throw new common_1.BadRequestException('workDaysPerWeek must be between 1 and 7 for compressed shift type');
            }
            if ('hoursPerDay' in dto &&
                (!dto.hoursPerDay || dto.hoursPerDay < 1 || dto.hoursPerDay > 24)) {
                throw new common_1.BadRequestException('hoursPerDay must be between 1 and 24 for compressed shift type');
            }
            if (dto.workDaysPerWeek && dto.hoursPerDay) {
                const totalWeeklyHours = dto.workDaysPerWeek * dto.hoursPerDay;
                if (totalWeeklyHours < 20 || totalWeeklyHours > 60) {
                    throw new common_1.BadRequestException(`Total weekly hours (${totalWeeklyHours}) should be between 20 and 60 for compressed workweek`);
                }
            }
        }
        if (['normal', 'split', 'overnight', 'rotational'].includes(type)) {
            if ('startTime' in dto && !dto.startTime) {
                throw new common_1.BadRequestException(`startTime is required for ${type} shift type`);
            }
            if ('endTime' in dto && !dto.endTime) {
                throw new common_1.BadRequestException(`endTime is required for ${type} shift type`);
            }
            if (dto.startTime && dto.endTime) {
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
                    throw new common_1.BadRequestException('Time format must be HH:mm (24-hour format)');
                }
            }
        }
    }
    async create(createDto) {
        this.validateShiftTemplate(createDto);
        const shiftTemplate = new this.shiftTemplateModel(createDto);
        return shiftTemplate.save();
    }
    async findAll() {
        return this.shiftTemplateModel.find().exec();
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid shift template ID');
        }
        const shiftTemplate = await this.shiftTemplateModel.findById(id).exec();
        if (!shiftTemplate) {
            throw new common_1.NotFoundException(`Shift template with ID ${id} not found`);
        }
        return shiftTemplate;
    }
    async update(id, updateDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid shift template ID');
        }
        let currentType = updateDto.type;
        if (!currentType) {
            const existing = await this.shiftTemplateModel.findById(id).exec();
            if (existing) {
                currentType = existing.type;
                const mergedDto = { ...existing.toObject(), ...updateDto };
                this.validateShiftTemplate(mergedDto);
            }
        }
        else {
            this.validateShiftTemplate(updateDto);
        }
        const shiftTemplate = await this.shiftTemplateModel
            .findByIdAndUpdate(id, { $set: updateDto }, { new: true, runValidators: true })
            .exec();
        if (!shiftTemplate) {
            throw new common_1.NotFoundException(`Shift template with ID ${id} not found`);
        }
        return shiftTemplate;
    }
    async delete(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid shift template ID');
        }
        const assignments = await this.scheduleAssignmentModel
            .countDocuments({
            shiftTemplateId: new mongoose_2.Types.ObjectId(id),
            status: 'Active',
        })
            .exec();
        if (assignments > 0) {
            throw new common_1.ConflictException(`Cannot delete shift template: ${assignments} active assignments exist`);
        }
        const result = await this.shiftTemplateModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException(`Shift template with ID ${id} not found`);
        }
    }
};
exports.ShiftTemplateService = ShiftTemplateService;
exports.ShiftTemplateService = ShiftTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(shift_schema_1.ShiftTemplate.name)),
    __param(1, (0, mongoose_1.InjectModel)(schedule_assignment_schema_1.ScheduleAssignment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ShiftTemplateService);
//# sourceMappingURL=shift-template.service.js.map