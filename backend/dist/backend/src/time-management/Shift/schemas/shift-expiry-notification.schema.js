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
exports.ShiftExpiryNotificationSchema = exports.ShiftExpiryNotification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ShiftExpiryNotification = class ShiftExpiryNotification {
    shiftTemplateId;
    scheduleAssignmentId;
    expiryDate;
    notificationSent;
    notificationSentAt;
    notifiedTo;
    status;
    resolvedAt;
    resolutionNotes;
};
exports.ShiftExpiryNotification = ShiftExpiryNotification;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ShiftTemplate' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftExpiryNotification.prototype, "shiftTemplateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ScheduleAssignment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ShiftExpiryNotification.prototype, "scheduleAssignmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ShiftExpiryNotification.prototype, "expiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ShiftExpiryNotification.prototype, "notificationSent", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ShiftExpiryNotification.prototype, "notificationSentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Employee', default: [] }),
    __metadata("design:type", Array)
], ShiftExpiryNotification.prototype, "notifiedTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 'pending',
        enum: ['pending', 'sent', 'acknowledged', 'resolved'],
    }),
    __metadata("design:type", String)
], ShiftExpiryNotification.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ShiftExpiryNotification.prototype, "resolvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ShiftExpiryNotification.prototype, "resolutionNotes", void 0);
exports.ShiftExpiryNotification = ShiftExpiryNotification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ShiftExpiryNotification);
exports.ShiftExpiryNotificationSchema = mongoose_1.SchemaFactory.createForClass(ShiftExpiryNotification);
exports.ShiftExpiryNotificationSchema.index({ expiryDate: 1, status: 1 });
exports.ShiftExpiryNotificationSchema.index({ shiftTemplateId: 1 });
exports.ShiftExpiryNotificationSchema.index({ scheduleAssignmentId: 1 });
exports.ShiftExpiryNotificationSchema.index({ notificationSent: 1, status: 1 });
//# sourceMappingURL=shift-expiry-notification.schema.js.map