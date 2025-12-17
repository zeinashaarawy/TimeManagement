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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payroll_sync_log_schema_1 = require("../schemas/payroll-sync-log.schema");
const attendance_record_schema_1 = require("../../attendance/schemas/attendance-record.schema");
const penalty_record_schema_1 = require("../../policy/schemas/penalty-record.schema");
const overtime_record_schema_1 = require("../../policy/schemas/overtime-record.schema");
const time_exception_schema_1 = require("../../attendance/schemas/time-exception.schema");
const index_1 = require("../../enums/index");
let PayrollService = class PayrollService {
    syncLogModel;
    attendanceModel;
    penaltyModel;
    overtimeModel;
    exceptionModel;
    constructor(syncLogModel, attendanceModel, penaltyModel, overtimeModel, exceptionModel) {
        this.syncLogModel = syncLogModel;
        this.attendanceModel = attendanceModel;
        this.penaltyModel = penaltyModel;
        this.overtimeModel = overtimeModel;
        this.exceptionModel = exceptionModel;
    }
    async generatePayrollPayload(periodStart, periodEnd, employeeIds) {
        const attendanceQuery = {
            finalisedForPayroll: true,
            recordDate: {
                $gte: periodStart,
                $lte: periodEnd,
            },
        };
        if (employeeIds && employeeIds.length > 0) {
            attendanceQuery.employeeId = { $in: employeeIds };
        }
        const attendanceRecords = await this.attendanceModel.find(attendanceQuery).exec();
        const employeeMap = new Map();
        for (const record of attendanceRecords) {
            const empId = record.employeeId.toString();
            if (!employeeMap.has(empId)) {
                employeeMap.set(empId, {
                    employeeId: empId,
                    attendanceRecords: [],
                    totals: {
                        totalWorkedMinutes: 0,
                        totalOvertimeMinutes: 0,
                        totalOvertimeAmount: 0,
                        totalPenalties: 0,
                    },
                });
            }
            const employeeData = employeeMap.get(empId);
            const overtimeRecords = await this.overtimeModel.find({
                attendanceRecordId: record._id,
                status: overtime_record_schema_1.OvertimeStatus.APPROVED,
            }).exec();
            const penaltyRecords = await this.penaltyModel.find({
                attendanceRecordId: record._id,
                status: penalty_record_schema_1.PenaltyStatus.APPROVED,
            }).exec();
            const overtime = overtimeRecords.map(ot => ({
                minutes: ot.overtimeMinutes,
                multiplier: ot.multiplier,
                amount: ot.calculatedAmount,
                isWeekend: ot.isWeekend,
            }));
            const penalties = penaltyRecords.map(p => ({
                type: p.type,
                amount: p.amount,
                minutes: p.minutes,
            }));
            const totalOvertimeMinutes = overtimeRecords.reduce((sum, ot) => sum + ot.overtimeMinutes, 0);
            const totalOvertimeAmount = overtimeRecords.reduce((sum, ot) => sum + ot.calculatedAmount, 0);
            const totalPenalties = penaltyRecords.reduce((sum, p) => sum + p.amount, 0);
            employeeData.attendanceRecords.push({
                recordId: record._id.toString(),
                date: record.recordDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                workedMinutes: record.totalWorkMinutes,
                overtime,
                penalties,
            });
            employeeData.totals.totalWorkedMinutes += record.totalWorkMinutes;
            employeeData.totals.totalOvertimeMinutes += totalOvertimeMinutes;
            employeeData.totals.totalOvertimeAmount += totalOvertimeAmount;
            employeeData.totals.totalPenalties += totalPenalties;
        }
        const records = Array.from(employeeMap.values());
        const summary = {
            totalEmployees: records.length,
            totalRecords: attendanceRecords.length,
            totalOvertimeMinutes: records.reduce((sum, r) => sum + r.totals.totalOvertimeMinutes, 0),
            totalPenalties: records.reduce((sum, r) => sum + r.totals.totalPenalties, 0),
            totalAmount: records.reduce((sum, r) => sum + r.totals.totalOvertimeAmount - r.totals.totalPenalties, 0),
        };
        return {
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: periodEnd.toISOString().split('T')[0],
            records,
            summary,
        };
    }
    async syncPayroll(periodStart, periodEnd, initiatedBy, employeeIds) {
        if (periodStart >= periodEnd) {
            throw new common_1.BadRequestException('Period start must be before period end');
        }
        const payload = await this.generatePayrollPayload(periodStart, periodEnd, employeeIds);
        const syncLog = new this.syncLogModel({
            periodStart,
            periodEnd,
            status: payroll_sync_log_schema_1.PayrollSyncStatus.IN_PROGRESS,
            payloadSummary: {
                totalRecords: payload.summary.totalRecords,
                totalEmployees: payload.summary.totalEmployees,
                totalOvertimeMinutes: payload.summary.totalOvertimeMinutes,
                totalPenalties: payload.summary.totalPenalties,
                totalAmount: payload.summary.totalAmount,
            },
            rawPayload: payload,
            initiatedBy,
            retryCount: 0,
        });
        await syncLog.save();
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            syncLog.status = payroll_sync_log_schema_1.PayrollSyncStatus.COMPLETED;
            syncLog.syncedAt = new Date();
            syncLog.externalSyncId = `SYNC-${Date.now()}`;
            await syncLog.save();
        }
        catch (error) {
            syncLog.status = payroll_sync_log_schema_1.PayrollSyncStatus.FAILED;
            syncLog.lastError = error instanceof Error ? error.message : 'Unknown error';
            syncLog.errors = [{
                    employeeId: 'SYSTEM',
                    recordId: 'SYSTEM',
                    error: syncLog.lastError || 'Unknown error',
                    timestamp: new Date(),
                }];
            await syncLog.save();
            throw error;
        }
        return syncLog;
    }
    async retryPayrollSync(syncLogId) {
        const syncLog = await this.syncLogModel.findById(syncLogId);
        if (!syncLog) {
            throw new common_1.NotFoundException(`Payroll sync log ${syncLogId} not found`);
        }
        if (syncLog.status === payroll_sync_log_schema_1.PayrollSyncStatus.COMPLETED) {
            throw new common_1.BadRequestException('Sync is already completed');
        }
        syncLog.status = payroll_sync_log_schema_1.PayrollSyncStatus.IN_PROGRESS;
        syncLog.retryCount += 1;
        await syncLog.save();
        try {
            const payload = await this.generatePayrollPayload(syncLog.periodStart, syncLog.periodEnd);
            await new Promise(resolve => setTimeout(resolve, 100));
            syncLog.status = payroll_sync_log_schema_1.PayrollSyncStatus.COMPLETED;
            syncLog.syncedAt = new Date();
            syncLog.externalSyncId = `SYNC-${Date.now()}`;
            syncLog.lastError = undefined;
            await syncLog.save();
        }
        catch (error) {
            syncLog.status = payroll_sync_log_schema_1.PayrollSyncStatus.FAILED;
            syncLog.lastError = error instanceof Error ? error.message : 'Unknown error';
            await syncLog.save();
            throw error;
        }
        return syncLog;
    }
    async getSyncStatus(syncLogId) {
        const syncLog = await this.syncLogModel.findById(syncLogId);
        if (!syncLog) {
            throw new common_1.NotFoundException(`Payroll sync log ${syncLogId} not found`);
        }
        return syncLog;
    }
    async validatePrePayroll(periodStart, periodEnd) {
        const issues = [];
        let pendingApprovals = 0;
        let inconsistentRecords = 0;
        const pendingOvertime = await this.overtimeModel.countDocuments({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: overtime_record_schema_1.OvertimeStatus.PENDING,
        });
        if (pendingOvertime > 0) {
            issues.push(`${pendingOvertime} pending overtime approvals`);
            pendingApprovals += pendingOvertime;
        }
        const pendingPenalties = await this.penaltyModel.countDocuments({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: penalty_record_schema_1.PenaltyStatus.PENDING,
        });
        if (pendingPenalties > 0) {
            issues.push(`${pendingPenalties} pending penalty approvals`);
            pendingApprovals += pendingPenalties;
        }
        const attendanceRecords = await this.attendanceModel.find({
            recordDate: { $gte: periodStart, $lte: periodEnd },
        }).exec();
        for (const record of attendanceRecords) {
            const exceptions = await this.exceptionModel.find({
                attendanceRecordId: record._id,
                status: { $in: [index_1.TimeExceptionStatus.OPEN, index_1.TimeExceptionStatus.PENDING] },
            });
            if (exceptions.length > 0) {
                issues.push(`Record ${record._id} has ${exceptions.length} unresolved exceptions`);
                inconsistentRecords += exceptions.length;
            }
            if (!record.finalisedForPayroll) {
                issues.push(`Record ${record._id} is not finalized for payroll`);
                inconsistentRecords += 1;
            }
        }
        return {
            isValid: issues.length === 0,
            issues,
            pendingApprovals,
            inconsistentRecords,
        };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payroll_sync_log_schema_1.PayrollSyncLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(attendance_record_schema_1.AttendanceRecord.name)),
    __param(2, (0, mongoose_1.InjectModel)(penalty_record_schema_1.PenaltyRecord.name)),
    __param(3, (0, mongoose_1.InjectModel)(overtime_record_schema_1.OvertimeRecord.name)),
    __param(4, (0, mongoose_1.InjectModel)(time_exception_schema_1.TimeException.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map