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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleAssignmentSchema = exports.ScheduleAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ScheduleAssignment = class ScheduleAssignment {
    shiftTemplateId;
    employeeId;
    departmentId;
    positionId;
    effectiveFrom;
    effectiveTo;
    assignedBy;
    source;
    metadata;
    status;
};
exports.ScheduleAssignment = ScheduleAssignment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ShiftTemplate', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ScheduleAssignment.prototype, "shiftTemplateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ScheduleAssignment.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ScheduleAssignment.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ScheduleAssignment.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ScheduleAssignment.prototype, "effectiveFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ScheduleAssignment.prototype, "effectiveTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Employee' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ScheduleAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'manual', enum: ['manual', 'bulk_assignment', 'automatic'] }),
    __metadata("design:type", String)
], ScheduleAssignment.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], ScheduleAssignment.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 'Active',
        enum: ['Active', 'Inactive', 'Cancelled', 'Approved', 'Expired'],
    }),
    __metadata("design:type", String)
], ScheduleAssignment.prototype, "status", void 0);
exports.ScheduleAssignment = ScheduleAssignment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ScheduleAssignment);
exports.ScheduleAssignmentSchema = mongoose_1.SchemaFactory.createForClass(ScheduleAssignment);
exports.ScheduleAssignmentSchema.index({
    employeeId: 1,
    effectiveFrom: 1,
    effectiveTo: 1,
});
exports.ScheduleAssignmentSchema.index({
    departmentId: 1,
    effectiveFrom: 1,
    effectiveTo: 1,
});
exports.ScheduleAssignmentSchema.index({
    positionId: 1,
    effectiveFrom: 1,
    effectiveTo: 1,
});
exports.ScheduleAssignmentSchema.index({ shiftTemplateId: 1 });
exports.ScheduleAssignmentSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
//# sourceMappingURL=schedule-assignment.schema.js.map