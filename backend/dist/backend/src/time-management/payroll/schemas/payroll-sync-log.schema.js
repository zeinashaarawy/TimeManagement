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
exports.PayrollSyncLogSchema = exports.PayrollSyncLog = exports.PayrollSyncStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PayrollSyncStatus;
(function (PayrollSyncStatus) {
    PayrollSyncStatus["PENDING"] = "PENDING";
    PayrollSyncStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PayrollSyncStatus["COMPLETED"] = "COMPLETED";
    PayrollSyncStatus["FAILED"] = "FAILED";
    PayrollSyncStatus["PARTIAL"] = "PARTIAL";
})(PayrollSyncStatus || (exports.PayrollSyncStatus = PayrollSyncStatus = {}));
let PayrollSyncLog = class PayrollSyncLog {
    periodStart;
    periodEnd;
    status;
    payloadSummary;
    errors;
    initiatedBy;
    syncedAt;
    externalSyncId;
    rawPayload;
    retryCount;
    lastError;
};
exports.PayrollSyncLog = PayrollSyncLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PayrollSyncLog.prototype, "periodStart", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PayrollSyncLog.prototype, "periodEnd", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PayrollSyncStatus, default: PayrollSyncStatus.PENDING }),
    __metadata("design:type", String)
], PayrollSyncLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], PayrollSyncLog.prototype, "payloadSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object] }),
    __metadata("design:type", Array)
], PayrollSyncLog.prototype, "errors", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PayrollSyncLog.prototype, "initiatedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], PayrollSyncLog.prototype, "syncedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], PayrollSyncLog.prototype, "externalSyncId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], PayrollSyncLog.prototype, "rawPayload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PayrollSyncLog.prototype, "retryCount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], PayrollSyncLog.prototype, "lastError", void 0);
exports.PayrollSyncLog = PayrollSyncLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PayrollSyncLog);
exports.PayrollSyncLogSchema = mongoose_1.SchemaFactory.createForClass(PayrollSyncLog);
//# sourceMappingURL=payroll-sync-log.schema.js.map