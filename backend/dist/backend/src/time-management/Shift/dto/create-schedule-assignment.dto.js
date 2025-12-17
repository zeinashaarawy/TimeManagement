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
exports.CreateScheduleAssignmentDto = void 0;
const class_validator_1 = require("class-validator");
class CreateScheduleAssignmentDto {
    shiftTemplateId;
    employeeId;
    departmentId;
    positionId;
    effectiveFrom;
    effectiveTo;
    assignedBy;
    source;
    metadata;
}
exports.CreateScheduleAssignmentDto = CreateScheduleAssignmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "shiftTemplateId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.departmentId && !o.positionId),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.employeeId && !o.positionId),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.employeeId && !o.departmentId),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "positionId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "effectiveFrom", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateScheduleAssignmentDto.prototype, "effectiveTo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "assignedBy", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['manual', 'bulk_assignment', 'automatic']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateScheduleAssignmentDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateScheduleAssignmentDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-schedule-assignment.dto.js.map