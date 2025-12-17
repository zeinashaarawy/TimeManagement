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
exports.ShiftTemplateSchema = exports.ShiftTemplate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ShiftTemplate = class ShiftTemplate {
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
};
exports.ShiftTemplate = ShiftTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: [
            'normal',
            'split',
            'overnight',
            'rotational',
            'flexible',
            'compressed',
        ],
    }),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], ShiftTemplate.prototype, "restDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ShiftTemplate.prototype, "gracePeriod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ShiftTemplate.prototype, "isOvernight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ShiftTemplate.prototype, "rotationalPattern", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], ShiftTemplate.prototype, "expirationDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 'Active',
        enum: ['Active', 'Inactive', 'Expired', 'Cancelled'],
    }),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "flexibleStartWindow", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ShiftTemplate.prototype, "flexibleEndWindow", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ShiftTemplate.prototype, "requiredHours", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ShiftTemplate.prototype, "workDaysPerWeek", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ShiftTemplate.prototype, "hoursPerDay", void 0);
exports.ShiftTemplate = ShiftTemplate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ShiftTemplate);
exports.ShiftTemplateSchema = mongoose_1.SchemaFactory.createForClass(ShiftTemplate);
//# sourceMappingURL=shift.schema.js.map