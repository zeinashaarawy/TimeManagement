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
var ShiftExpirySchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftExpirySchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const shift_expiry_service_1 = require("./shift-expiry.service");
let ShiftExpirySchedulerService = ShiftExpirySchedulerService_1 = class ShiftExpirySchedulerService {
    shiftExpiryService;
    logger = new common_1.Logger(ShiftExpirySchedulerService_1.name);
    constructor(shiftExpiryService) {
        this.shiftExpiryService = shiftExpiryService;
    }
    async handleExpiringShifts() {
        this.logger.log('Starting scheduled job: Detecting expiring shifts...');
        try {
            const notificationCount = await this.shiftExpiryService.detectExpiringShifts(30);
            if (notificationCount > 0) {
                this.logger.log(`Created ${notificationCount} new expiry notifications`);
            }
            else {
                this.logger.log('No new expiring shifts detected');
            }
        }
        catch (error) {
            this.logger.error(`Error detecting expiring shifts: ${error.message}`, error.stack);
        }
    }
    async triggerExpiryDetection(daysBeforeExpiry = 30) {
        this.logger.log(`Manually triggering expiry detection (${daysBeforeExpiry} days before expiry)`);
        return await this.shiftExpiryService.detectExpiringShifts(daysBeforeExpiry);
    }
};
exports.ShiftExpirySchedulerService = ShiftExpirySchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShiftExpirySchedulerService.prototype, "handleExpiringShifts", null);
exports.ShiftExpirySchedulerService = ShiftExpirySchedulerService = ShiftExpirySchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shift_expiry_service_1.ShiftExpiryService])
], ShiftExpirySchedulerService);
//# sourceMappingURL=shift-expiry-scheduler.service.js.map