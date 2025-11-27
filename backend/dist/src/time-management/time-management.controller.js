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
exports.TimeManagementController = void 0;
const common_1 = require("@nestjs/common");
const time_management_service_1 = require("./time-management.service");
const create_punch_dto_1 = require("./attendance/dto/create-punch.dto");
let TimeManagementController = class TimeManagementController {
    tmService;
    constructor(tmService) {
        this.tmService = tmService;
    }
    async recordPunch(dto) {
        if (!dto.employeeId || !dto.timestamp || !dto.type) {
            throw new common_1.BadRequestException('Missing required punch data');
        }
        return this.tmService.recordPunch(dto);
    }
    async getAttendance(employeeId, date) {
        if (!employeeId) {
            throw new common_1.BadRequestException('Missing employeeId');
        }
        return this.tmService.getAttendance(employeeId, date);
    }
    async getExceptions(employeeId) {
        if (!employeeId) {
            throw new common_1.BadRequestException('Missing employeeId');
        }
        return this.tmService.getExceptions(employeeId);
    }
    async createException(body) {
        if (!body.employeeId || !body.recordId || !body.reason || !body.assignedToId) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        return this.tmService.createTimeException(body.employeeId, body.recordId, body.reason, body.assignedToId);
    }
    async correctAttendance(body) {
        if (!body.employeeId || !body.date || !body.punches) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        const dateObj = new Date(body.date);
        return this.tmService.correctAttendance(body.employeeId, dateObj, body.punches);
    }
    async detectMissedPunch(body) {
        if (!body.employeeId || !body.date) {
            throw new common_1.BadRequestException('Missing employeeId/date');
        }
        const dateObj = new Date(body.date);
        return this.tmService.detectMissedPunches(body.employeeId, dateObj);
    }
    async getNotifications(employeeId) {
        return this.tmService.getNotifications(employeeId);
    }
};
exports.TimeManagementController = TimeManagementController;
__decorate([
    (0, common_1.Post)('punch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_punch_dto_1.CreatePunchDto]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "recordPunch", null);
__decorate([
    (0, common_1.Get)('attendance/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Get)('exceptions/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "getExceptions", null);
__decorate([
    (0, common_1.Post)('exceptions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "createException", null);
__decorate([
    (0, common_1.Post)('attendance/correct'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "correctAttendance", null);
__decorate([
    (0, common_1.Post)('attendance/detect-missed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "detectMissedPunch", null);
__decorate([
    (0, common_1.Get)('notifications/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TimeManagementController.prototype, "getNotifications", null);
exports.TimeManagementController = TimeManagementController = __decorate([
    (0, common_1.Controller)('time-management'),
    __metadata("design:paramtypes", [time_management_service_1.TimeManagementService])
], TimeManagementController);
//# sourceMappingURL=time-management.controller.js.map