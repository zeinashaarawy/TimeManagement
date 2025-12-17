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
exports.ScheduleAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const schedule_assignment_schema_1 = require("../schemas/schedule-assignment.schema");
const shift_schema_1 = require("../schemas/shift.schema");
const shift_template_service_1 = require("./shift-template.service");
let ScheduleAssignmentService = class ScheduleAssignmentService {
    scheduleAssignmentModel;
    shiftTemplateModel;
    shiftTemplateService;
    constructor(scheduleAssignmentModel, shiftTemplateModel, shiftTemplateService) {
        this.scheduleAssignmentModel = scheduleAssignmentModel;
        this.shiftTemplateModel = shiftTemplateModel;
        this.shiftTemplateService = shiftTemplateService;
    }
    validateAssignment(createDto) {
        const targetCount = [
            createDto.employeeId,
            createDto.departmentId,
            createDto.positionId,
        ].filter(Boolean).length;
        if (targetCount !== 1) {
            throw new common_1.BadRequestException('Exactly one of employeeId, departmentId, or positionId must be provided');
        }
        if (createDto.effectiveTo &&
            new Date(createDto.effectiveFrom) >= new Date(createDto.effectiveTo)) {
            throw new common_1.BadRequestException('effectiveFrom must be before effectiveTo');
        }
    }
    async detectConflicts(employeeId, departmentId, positionId, effectiveFrom, effectiveTo, excludeAssignmentId) {
        const query = {
            status: 'Active',
            $or: [],
        };
        if (employeeId) {
            query.$or.push({ employeeId: new mongoose_2.Types.ObjectId(employeeId) });
        }
        if (departmentId) {
            query.$or.push({ departmentId: new mongoose_2.Types.ObjectId(departmentId) });
        }
        if (positionId) {
            query.$or.push({ positionId: new mongoose_2.Types.ObjectId(positionId) });
        }
        const dateOverlapQuery = [];
        if (effectiveTo) {
            dateOverlapQuery.push({
                $or: [
                    {
                        effectiveFrom: { $lte: new Date(effectiveFrom) },
                        effectiveTo: { $gte: new Date(effectiveFrom) },
                    },
                    {
                        effectiveFrom: { $lte: new Date(effectiveTo) },
                        effectiveTo: { $gte: new Date(effectiveTo) },
                    },
                    {
                        effectiveFrom: { $gte: new Date(effectiveFrom) },
                        effectiveTo: { $lte: new Date(effectiveTo) },
                    },
                ],
            });
        }
        else {
            dateOverlapQuery.push({
                $or: [
                    { effectiveTo: null },
                    { effectiveTo: { $gte: new Date(effectiveFrom) } },
                ],
            });
        }
        query.$and = dateOverlapQuery;
        if (excludeAssignmentId) {
            query._id = { $ne: new mongoose_2.Types.ObjectId(excludeAssignmentId) };
        }
        return this.scheduleAssignmentModel.find(query).exec();
    }
    async assign(createDto) {
        this.validateAssignment(createDto);
        await this.shiftTemplateService.findById(createDto.shiftTemplateId);
        const conflicts = await this.detectConflicts(createDto.employeeId, createDto.departmentId, createDto.positionId, new Date(createDto.effectiveFrom), createDto.effectiveTo ? new Date(createDto.effectiveTo) : null);
        if (conflicts.length > 0) {
            throw new common_1.ConflictException(`Assignment conflicts with ${conflicts.length} existing active assignment(s). Resolve conflicts before creating new assignment.`);
        }
        const assignment = new this.scheduleAssignmentModel({
            shiftTemplateId: new mongoose_2.Types.ObjectId(createDto.shiftTemplateId),
            employeeId: createDto.employeeId
                ? new mongoose_2.Types.ObjectId(createDto.employeeId)
                : undefined,
            departmentId: createDto.departmentId
                ? new mongoose_2.Types.ObjectId(createDto.departmentId)
                : undefined,
            positionId: createDto.positionId
                ? new mongoose_2.Types.ObjectId(createDto.positionId)
                : undefined,
            effectiveFrom: new Date(createDto.effectiveFrom),
            effectiveTo: createDto.effectiveTo
                ? new Date(createDto.effectiveTo)
                : null,
            assignedBy: new mongoose_2.Types.ObjectId(createDto.assignedBy),
            source: createDto.source || 'manual',
            metadata: createDto.metadata || {},
            status: 'Active',
        });
        return assignment.save();
    }
    async bulkAssign(bulkDto) {
        const targetCount = [
            bulkDto.employeeIds?.length,
            bulkDto.departmentId,
            bulkDto.positionId,
        ].filter(Boolean).length;
        if (targetCount !== 1) {
            throw new common_1.BadRequestException('Exactly one of employeeIds, departmentId, or positionId must be provided');
        }
        await this.shiftTemplateService.findById(bulkDto.shiftTemplateId);
        let targetEmployeeIds = [];
        let success = 0;
        let failed = 0;
        const errors = [];
        if (bulkDto.employeeIds && bulkDto.employeeIds.length > 0) {
            targetEmployeeIds = bulkDto.employeeIds;
        }
        else if (bulkDto.departmentId) {
            throw new common_1.BadRequestException('Bulk assignment by department requires Employee model - not yet integrated');
        }
        else if (bulkDto.positionId) {
            throw new common_1.BadRequestException('Bulk assignment by position requires Employee model - not yet integrated');
        }
        if (targetEmployeeIds.length === 0) {
            throw new common_1.BadRequestException('No employees found for bulk assignment');
        }
        for (const employeeId of targetEmployeeIds) {
            try {
                const createDto = {
                    shiftTemplateId: bulkDto.shiftTemplateId,
                    employeeId,
                    effectiveFrom: bulkDto.effectiveFrom,
                    effectiveTo: bulkDto.effectiveTo || null,
                    assignedBy: bulkDto.assignedBy,
                    source: 'bulk_assignment',
                    metadata: {
                        reason: bulkDto.reason,
                    },
                };
                await this.assign(createDto);
                success++;
            }
            catch (error) {
                failed++;
                errors.push({
                    employeeId,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return { success, failed, errors };
    }
    async query(queryDto) {
        const query = {};
        if (queryDto.employeeId) {
            query.employeeId = new mongoose_2.Types.ObjectId(queryDto.employeeId);
        }
        if (queryDto.departmentId) {
            query.departmentId = new mongoose_2.Types.ObjectId(queryDto.departmentId);
        }
        if (queryDto.positionId) {
            query.positionId = new mongoose_2.Types.ObjectId(queryDto.positionId);
        }
        if (queryDto.shiftTemplateId) {
            query.shiftTemplateId = new mongoose_2.Types.ObjectId(queryDto.shiftTemplateId);
        }
        if (queryDto.status) {
            query.status = queryDto.status;
        }
        if (queryDto.from || queryDto.to) {
            query.$or = [];
            if (queryDto.from && queryDto.to) {
                query.$or.push({
                    effectiveFrom: { $lte: new Date(queryDto.to) },
                    $or: [
                        { effectiveTo: null },
                        { effectiveTo: { $gte: new Date(queryDto.from) } },
                    ],
                });
            }
            else if (queryDto.from) {
                query.effectiveFrom = { $gte: new Date(queryDto.from) };
            }
            else if (queryDto.to) {
                query.$or = [
                    { effectiveTo: null },
                    { effectiveTo: { $lte: new Date(queryDto.to) } },
                ];
            }
        }
        return (this.scheduleAssignmentModel
            .find(query)
            .populate('shiftTemplateId')
            .sort({ effectiveFrom: 1 })
            .exec());
    }
    calculateRotationalSchedule(startDate, endDate, pattern) {
        const workDays = [];
        const restDays = [];
        const match = pattern.match(/(\d+)-on\/(\d+)-off/);
        if (!match) {
            throw new common_1.BadRequestException(`Invalid rotational pattern format: ${pattern}. Expected format: "X-on/Y-off"`);
        }
        const onDays = parseInt(match[1], 10);
        const offDays = parseInt(match[2], 10);
        const cycleLength = onDays + offDays;
        const currentDate = new Date(startDate);
        let dayInCycle = 0;
        while (currentDate <= endDate) {
            if (dayInCycle < onDays) {
                workDays.push(new Date(currentDate));
            }
            else {
                restDays.push(new Date(currentDate));
            }
            dayInCycle = (dayInCycle + 1) % cycleLength;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return { workDays, restDays };
    }
    async updateStatus(id, updateDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid assignment ID');
        }
        const assignment = await this.scheduleAssignmentModel.findById(id).exec();
        if (!assignment) {
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found`);
        }
        const updateData = { status: updateDto.status };
        if (updateDto.reason) {
            updateData.metadata = {
                ...assignment.metadata,
                reason: updateDto.reason,
                statusChangedAt: new Date(),
            };
        }
        if (updateDto.status === 'Expired' &&
            assignment.effectiveTo &&
            new Date(assignment.effectiveTo) > new Date()) {
            throw new common_1.BadRequestException('Cannot mark assignment as Expired before effectiveTo date');
        }
        const updatedAssignment = await this.scheduleAssignmentModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
            .exec();
        if (!updatedAssignment) {
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found after update`);
        }
        return updatedAssignment;
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid assignment ID');
        }
        const assignment = await this.scheduleAssignmentModel.findById(id).exec();
        if (!assignment) {
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found`);
        }
        return assignment;
    }
};
exports.ScheduleAssignmentService = ScheduleAssignmentService;
exports.ScheduleAssignmentService = ScheduleAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(schedule_assignment_schema_1.ScheduleAssignment.name)),
    __param(1, (0, mongoose_1.InjectModel)(shift_schema_1.ShiftTemplate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        shift_template_service_1.ShiftTemplateService])
], ScheduleAssignmentService);
//# sourceMappingURL=schedule-assignment.service.js.map