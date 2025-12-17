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
exports.ShiftExpiryNotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shift_expiry_service_1 = require("../services/shift-expiry.service");
const shift_expiry_scheduler_service_1 = require("../services/shift-expiry-scheduler.service");
const shift_expiry_notification_response_dto_1 = require("../dto/shift-expiry-notification-response.dto");
let ShiftExpiryNotificationController = class ShiftExpiryNotificationController {
    shiftExpiryService;
    shiftExpirySchedulerService;
    constructor(shiftExpiryService, shiftExpirySchedulerService) {
        this.shiftExpiryService = shiftExpiryService;
        this.shiftExpirySchedulerService = shiftExpirySchedulerService;
    }
    async getNotifications(status) {
        return await this.shiftExpiryService.getNotifications(status);
    }
    async triggerDetection(daysBeforeExpiry) {
        const days = daysBeforeExpiry
            ? parseInt(daysBeforeExpiry.toString(), 10)
            : 30;
        const count = await this.shiftExpirySchedulerService.triggerExpiryDetection(days);
        return {
            notificationsCreated: count,
            message: `Expiry detection completed. Created ${count} new notification(s) for shifts/assignments expiring within ${days} days.`,
        };
    }
};
exports.ShiftExpiryNotificationController = ShiftExpiryNotificationController;
__decorate([
    (0, common_1.Get)('shifts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all shift expiry notifications' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filter by notification status',
        enum: ['pending', 'sent', 'acknowledged', 'resolved'],
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of expiry notifications',
        type: [shift_expiry_notification_response_dto_1.ShiftExpiryNotificationResponseDto],
    }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftExpiryNotificationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('shifts/detect'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually trigger expiry detection',
        description: 'Manually trigger the expiry detection job to create notifications for shifts/assignments expiring within the specified days. Normally runs automatically at 9 AM daily.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'daysBeforeExpiry',
        required: false,
        description: 'Number of days before expiry to detect (default: 30)',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Expiry detection completed',
        schema: {
            type: 'object',
            properties: {
                notificationsCreated: { type: 'number' },
                message: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Query)('daysBeforeExpiry')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ShiftExpiryNotificationController.prototype, "triggerDetection", null);
exports.ShiftExpiryNotificationController = ShiftExpiryNotificationController = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, common_1.Controller)('time-management/notifications'),
    __metadata("design:paramtypes", [shift_expiry_service_1.ShiftExpiryService,
        shift_expiry_scheduler_service_1.ShiftExpirySchedulerService])
], ShiftExpiryNotificationController);
//# sourceMappingURL=shift-expiry-notification.controller.js.map