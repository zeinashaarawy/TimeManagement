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
exports.OvertimeRecordSchema = exports.OvertimeRecord = exports.OvertimeStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var OvertimeStatus;
(function (OvertimeStatus) {
    OvertimeStatus["PENDING"] = "PENDING";
    OvertimeStatus["APPROVED"] = "APPROVED";
    OvertimeStatus["REJECTED"] = "REJECTED";
    OvertimeStatus["OVERRIDDEN"] = "OVERRIDDEN";
})(OvertimeStatus || (exports.OvertimeStatus = OvertimeStatus = {}));
let OvertimeRecord = class OvertimeRecord {
    employeeId;
    attendanceRecordId;
    policyId;
    overtimeMinutes;
    regularMinutes;
    multiplier;
    calculatedAmount;
    status;
    approvedBy;
    approvedAt;
    reason;
    overrideReason;
    beforeValues;
    afterValues;
    exceptionId;
    recordDate;
    isWeekend;
};
exports.OvertimeRecord = OvertimeRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OvertimeRecord.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Attendance', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OvertimeRecord.prototype, "attendanceRecordId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TimePolicy', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OvertimeRecord.prototype, "policyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OvertimeRecord.prototype, "overtimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OvertimeRecord.prototype, "regularMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OvertimeRecord.prototype, "multiplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OvertimeRecord.prototype, "calculatedAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: OvertimeStatus, default: OvertimeStatus.PENDING }),
    __metadata("design:type", String)
], OvertimeRecord.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OvertimeRecord.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], OvertimeRecord.prototype, "approvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OvertimeRecord.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OvertimeRecord.prototype, "overrideReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], OvertimeRecord.prototype, "beforeValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], OvertimeRecord.prototype, "afterValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TimeException', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OvertimeRecord.prototype, "exceptionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, default: Date.now }),
    __metadata("design:type", Date)
], OvertimeRecord.prototype, "recordDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], OvertimeRecord.prototype, "isWeekend", void 0);
exports.OvertimeRecord = OvertimeRecord = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], OvertimeRecord);
exports.OvertimeRecordSchema = mongoose_1.SchemaFactory.createForClass(OvertimeRecord);
//# sourceMappingURL=overtime-record.schema.js.map