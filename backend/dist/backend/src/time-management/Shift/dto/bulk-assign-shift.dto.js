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
exports.BulkAssignShiftDto = void 0;
const class_validator_1 = require("class-validator");
class BulkAssignShiftDto {
    shiftTemplateId;
    employeeIds;
    departmentId;
    positionId;
    effectiveFrom;
    effectiveTo;
    assignedBy;
    reason;
}
exports.BulkAssignShiftDto = BulkAssignShiftDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "shiftTemplateId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.departmentId && !o.positionId),
    __metadata("design:type", Array)
], BulkAssignShiftDto.prototype, "employeeIds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.employeeIds && !o.positionId),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((o) => !o.employeeIds && !o.departmentId),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "positionId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "effectiveFrom", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BulkAssignShiftDto.prototype, "effectiveTo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "assignedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkAssignShiftDto.prototype, "reason", void 0);
//# sourceMappingURL=bulk-assign-shift.dto.js.map