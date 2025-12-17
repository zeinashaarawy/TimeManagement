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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const reporting_service_1 = require("../services/reporting.service");
const mongoose_1 = require("mongoose");
const penalty_record_schema_1 = require("../../policy/schemas/penalty-record.schema");
const overtime_record_schema_1 = require("../../policy/schemas/overtime-record.schema");
let ReportingController = class ReportingController {
    reportingService;
    constructor(reportingService) {
        this.reportingService = reportingService;
    }
    async getAttendanceReport(employeeId, departmentId, startDate, endDate, includeExceptions, page, limit) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (includeExceptions)
            filters.includeExceptions = includeExceptions === 'true';
        return this.reportingService.getAttendanceReport(filters, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async exportAttendanceReport(res, employeeId, departmentId, startDate, endDate) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        const csv = await this.reportingService.exportAttendanceReportCSV(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
        res.send(csv);
    }
    async getOvertimeReport(employeeId, departmentId, startDate, endDate, status, page, limit) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (status)
            filters.status = status;
        return this.reportingService.getOvertimeReport(filters, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async exportOvertimeReport(res, employeeId, departmentId, startDate, endDate, status) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (status)
            filters.status = status;
        const csv = await this.reportingService.exportOvertimeReportCSV(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=overtime-report.csv');
        res.send(csv);
    }
    async getPenaltyReport(employeeId, departmentId, startDate, endDate, type, status, page, limit) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (type)
            filters.type = type;
        if (status)
            filters.status = status;
        return this.reportingService.getPenaltyReport(filters, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
    }
    async exportPenaltyReport(res, employeeId, departmentId, startDate, endDate, type, status) {
        const filters = {};
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (type)
            filters.type = type;
        if (status)
            filters.status = status;
        const csv = await this.reportingService.exportPenaltyReportCSV(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=penalty-report.csv');
        res.send(csv);
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('attendance'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('includeExceptions')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getAttendanceReport", null);
__decorate([
    (0, common_1.Get)('attendance/export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportAttendanceReport", null);
__decorate([
    (0, common_1.Get)('overtime'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getOvertimeReport", null);
__decorate([
    (0, common_1.Get)('overtime/export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportOvertimeReport", null);
__decorate([
    (0, common_1.Get)('penalties'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getPenaltyReport", null);
__decorate([
    (0, common_1.Get)('penalties/export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('type')),
    __param(6, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportPenaltyReport", null);
exports.ReportingController = ReportingController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map