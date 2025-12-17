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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("../services/payroll.service");
const pre_payroll_service_1 = require("../services/pre-payroll.service");
const mongoose_1 = require("mongoose");
const parse_object_id_pipe_1 = require("../../../common/pipes/parse-object-id.pipe");
let PayrollController = class PayrollController {
    payrollService;
    prePayrollService;
    constructor(payrollService, prePayrollService) {
        this.payrollService = payrollService;
        this.prePayrollService = prePayrollService;
    }
    async syncPayroll(body) {
        const periodStart = new Date(body.periodStart);
        const periodEnd = new Date(body.periodEnd);
        const employeeIds = body.employeeIds?.map(id => new mongoose_1.Types.ObjectId(id));
        const initiatedBy = body.initiatedBy ? new mongoose_1.Types.ObjectId(body.initiatedBy) : undefined;
        return this.payrollService.syncPayroll(periodStart, periodEnd, initiatedBy, employeeIds);
    }
    async getSyncStatus(id) {
        return this.payrollService.getSyncStatus(id);
    }
    async retrySync(id) {
        return this.payrollService.retryPayrollSync(id);
    }
    async validatePrePayroll(body) {
        const periodStart = new Date(body.periodStart);
        const periodEnd = new Date(body.periodEnd);
        return this.payrollService.validatePrePayroll(periodStart, periodEnd);
    }
    async runPrePayrollClosure(body) {
        const periodStart = new Date(body.periodStart);
        const periodEnd = new Date(body.periodEnd);
        const escalationDeadlineHours = body.escalationDeadlineHours || 24;
        return this.prePayrollService.runPrePayrollClosure(periodStart, periodEnd, escalationDeadlineHours);
    }
    async generatePayload(periodStart, periodEnd, employeeIds) {
        if (!periodStart || !periodEnd) {
            throw new common_1.BadRequestException('periodStart and periodEnd query parameters are required');
        }
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        if (isNaN(start.getTime())) {
            throw new common_1.BadRequestException(`Invalid periodStart date: ${periodStart}`);
        }
        if (isNaN(end.getTime())) {
            throw new common_1.BadRequestException(`Invalid periodEnd date: ${periodEnd}`);
        }
        if (start >= end) {
            throw new common_1.BadRequestException('periodStart must be before periodEnd');
        }
        const empIds = employeeIds
            ? employeeIds.split(',').map(id => new mongoose_1.Types.ObjectId(id))
            : undefined;
        return this.payrollService.generatePayrollPayload(start, end, empIds);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "syncPayroll", null);
__decorate([
    (0, common_1.Get)('sync-status/:id'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Post)('sync/:id/retry'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "retrySync", null);
__decorate([
    (0, common_1.Post)('pre-payroll/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "validatePrePayroll", null);
__decorate([
    (0, common_1.Post)('pre-payroll/closure'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "runPrePayrollClosure", null);
__decorate([
    (0, common_1.Get)('payload'),
    __param(0, (0, common_1.Query)('periodStart')),
    __param(1, (0, common_1.Query)('periodEnd')),
    __param(2, (0, common_1.Query)('employeeIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "generatePayload", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService,
        pre_payroll_service_1.PrePayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map