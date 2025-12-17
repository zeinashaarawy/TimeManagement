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
exports.ShiftExpiryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shift_expiry_notification_schema_1 = require("../schemas/shift-expiry-notification.schema");
const shift_schema_1 = require("../schemas/shift.schema");
const schedule_assignment_schema_1 = require("../schemas/schedule-assignment.schema");
let ShiftExpiryService = class ShiftExpiryService {
    shiftExpiryNotificationModel;
    shiftTemplateModel;
    scheduleAssignmentModel;
    constructor(shiftExpiryNotificationModel, shiftTemplateModel, scheduleAssignmentModel) {
        this.shiftExpiryNotificationModel = shiftExpiryNotificationModel;
        this.shiftTemplateModel = shiftTemplateModel;
        this.scheduleAssignmentModel = scheduleAssignmentModel;
    }
    async getNotifications(status) {
        const query = {};
        if (status) {
            query.status = status;
        }
        return this.shiftExpiryNotificationModel
            .find(query)
            .populate('shiftTemplateId')
            .populate('scheduleAssignmentId')
            .sort({ expiryDate: 1 })
            .exec();
    }
    async detectExpiringShifts(daysBeforeExpiry = 30) {
        const today = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(today.getDate() + daysBeforeExpiry);
        let notificationCount = 0;
        const expiringTemplates = await this.shiftTemplateModel
            .find({
            expirationDate: { $lte: expiryThreshold, $gte: today },
            status: 'Active',
        })
            .exec();
        for (const template of expiringTemplates) {
            const existingNotification = await this.shiftExpiryNotificationModel
                .findOne({
                shiftTemplateId: template._id,
                status: { $in: ['pending', 'sent'] },
            })
                .exec();
            if (!existingNotification && template.expirationDate) {
                await this.shiftExpiryNotificationModel.create({
                    shiftTemplateId: template._id,
                    expiryDate: template.expirationDate,
                    notificationSent: false,
                    status: 'pending',
                });
                notificationCount++;
            }
        }
        const expiringAssignments = await this.scheduleAssignmentModel
            .find({
            effectiveTo: { $lte: expiryThreshold, $gte: today },
            status: 'Active',
        })
            .exec();
        for (const assignment of expiringAssignments) {
            const existingNotification = await this.shiftExpiryNotificationModel
                .findOne({
                scheduleAssignmentId: assignment._id,
                status: { $in: ['pending', 'sent'] },
            })
                .exec();
            if (!existingNotification && assignment.effectiveTo) {
                await this.shiftExpiryNotificationModel.create({
                    scheduleAssignmentId: assignment._id,
                    expiryDate: assignment.effectiveTo,
                    notificationSent: false,
                    status: 'pending',
                });
                notificationCount++;
            }
        }
        return notificationCount;
    }
};
exports.ShiftExpiryService = ShiftExpiryService;
exports.ShiftExpiryService = ShiftExpiryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(shift_expiry_notification_schema_1.ShiftExpiryNotification.name)),
    __param(1, (0, mongoose_1.InjectModel)(shift_schema_1.ShiftTemplate.name)),
    __param(2, (0, mongoose_1.InjectModel)(schedule_assignment_schema_1.ScheduleAssignment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ShiftExpiryService);
//# sourceMappingURL=shift-expiry.service.js.map