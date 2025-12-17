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
exports.PenaltyRecordSchema = exports.PenaltyRecord = exports.PenaltyStatus = exports.PenaltyType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PenaltyType;
(function (PenaltyType) {
    PenaltyType["LATENESS"] = "LATENESS";
    PenaltyType["SHORT_TIME"] = "SHORT_TIME";
    PenaltyType["MISSED_PUNCH"] = "MISSED_PUNCH";
    PenaltyType["EARLY_LEAVE"] = "EARLY_LEAVE";
    PenaltyType["OTHER"] = "OTHER";
})(PenaltyType || (exports.PenaltyType = PenaltyType = {}));
var PenaltyStatus;
(function (PenaltyStatus) {
    PenaltyStatus["PENDING"] = "PENDING";
    PenaltyStatus["APPROVED"] = "APPROVED";
    PenaltyStatus["REJECTED"] = "REJECTED";
    PenaltyStatus["OVERRIDDEN"] = "OVERRIDDEN";
})(PenaltyStatus || (exports.PenaltyStatus = PenaltyStatus = {}));
let PenaltyRecord = class PenaltyRecord {
    employeeId;
    attendanceRecordId;
    policyId;
    type;
    amount;
    minutes;
    status;
    approvedBy;
    approvedAt;
    reason;
    overrideReason;
    beforeValues;
    afterValues;
    exceptionId;
    recordDate;
};
exports.PenaltyRecord = PenaltyRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PenaltyRecord.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Attendance', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PenaltyRecord.prototype, "attendanceRecordId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TimePolicy', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PenaltyRecord.prototype, "policyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PenaltyType, required: true }),
    __metadata("design:type", String)
], PenaltyRecord.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PenaltyRecord.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PenaltyRecord.prototype, "minutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PenaltyStatus, default: PenaltyStatus.PENDING }),
    __metadata("design:type", String)
], PenaltyRecord.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PenaltyRecord.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], PenaltyRecord.prototype, "approvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], PenaltyRecord.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], PenaltyRecord.prototype, "overrideReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], PenaltyRecord.prototype, "beforeValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], PenaltyRecord.prototype, "afterValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TimeException', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PenaltyRecord.prototype, "exceptionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, default: Date.now }),
    __metadata("design:type", Date)
], PenaltyRecord.prototype, "recordDate", void 0);
exports.PenaltyRecord = PenaltyRecord = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PenaltyRecord);
exports.PenaltyRecordSchema = mongoose_1.SchemaFactory.createForClass(PenaltyRecord);
//# sourceMappingURL=penalty-record.schema.js.map