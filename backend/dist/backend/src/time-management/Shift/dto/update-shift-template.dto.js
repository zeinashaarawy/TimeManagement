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
exports.UpdateShiftTemplateDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateShiftTemplateDto {
    name;
    type;
    startTime;
    endTime;
    restDays;
    gracePeriod;
    isOvernight;
    rotationalPattern;
    expirationDate;
    status;
    description;
    flexibleStartWindow;
    flexibleEndWindow;
    requiredHours;
    workDaysPerWeek;
    hoursPerDay;
}
exports.UpdateShiftTemplateDto = UpdateShiftTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'normal',
        'split',
        'overnight',
        'rotational',
        'flexible',
        'compressed',
    ]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateShiftTemplateDto.prototype, "restDays", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(60),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateShiftTemplateDto.prototype, "gracePeriod", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateShiftTemplateDto.prototype, "isOvernight", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateShiftTemplateDto.prototype, "rotationalPattern", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateShiftTemplateDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['Active', 'Inactive', 'Expired', 'Cancelled']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "flexibleStartWindow", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateShiftTemplateDto.prototype, "flexibleEndWindow", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(24),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateShiftTemplateDto.prototype, "requiredHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(7),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateShiftTemplateDto.prototype, "workDaysPerWeek", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(24),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateShiftTemplateDto.prototype, "hoursPerDay", void 0);
//# sourceMappingURL=update-shift-template.dto.js.map