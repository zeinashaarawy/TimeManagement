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
exports.PrePayrollService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const penalty_record_schema_1 = require("../../policy/schemas/penalty-record.schema");
const overtime_record_schema_1 = require("../../policy/schemas/overtime-record.schema");
const time_exception_schema_1 = require("../../attendance/schemas/time-exception.schema");
const index_1 = require("../../enums/index");
const payroll_service_1 = require("./payroll.service");
let PrePayrollService = class PrePayrollService {
    penaltyModel;
    overtimeModel;
    exceptionModel;
    payrollService;
    constructor(penaltyModel, overtimeModel, exceptionModel, payrollService) {
        this.penaltyModel = penaltyModel;
        this.overtimeModel = overtimeModel;
        this.exceptionModel = exceptionModel;
        this.payrollService = payrollService;
    }
    async runPrePayrollClosure(periodStart, periodEnd, escalationDeadlineHours = 24) {
        const validationResult = await this.payrollService.validatePrePayroll(periodStart, periodEnd);
        const report = await this.generatePreSyncReport(periodStart, periodEnd);
        const escalations = await this.checkAndEscalate(periodStart, periodEnd, escalationDeadlineHours);
        return {
            validationResult,
            report,
            escalations,
        };
    }
    async generatePreSyncReport(periodStart, periodEnd) {
        const pendingOvertime = await this.overtimeModel.find({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: overtime_record_schema_1.OvertimeStatus.PENDING,
        }).populate('employeeId', 'name email').exec();
        const pendingPenalties = await this.penaltyModel.find({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: penalty_record_schema_1.PenaltyStatus.PENDING,
        }).populate('employeeId', 'name email').exec();
        const pendingExceptions = await this.exceptionModel.find({
            createdAt: { $gte: periodStart, $lte: periodEnd },
            status: { $in: [index_1.TimeExceptionStatus.OPEN, index_1.TimeExceptionStatus.PENDING] },
        }).populate('employeeId', 'name email').exec();
        return {
            periodStart,
            periodEnd,
            generatedAt: new Date(),
            pendingOvertime: {
                count: pendingOvertime.length,
                records: pendingOvertime.map(ot => ({
                    id: ot._id,
                    employee: ot.employeeId?.name || 'Unknown',
                    minutes: ot.overtimeMinutes,
                    amount: ot.calculatedAmount,
                })),
            },
            pendingPenalties: {
                count: pendingPenalties.length,
                records: pendingPenalties.map(p => ({
                    id: p._id,
                    employee: p.employeeId?.name || 'Unknown',
                    type: p.type,
                    amount: p.amount,
                })),
            },
            pendingExceptions: {
                count: pendingExceptions.length,
                records: pendingExceptions.map(e => ({
                    id: e._id,
                    employee: e.employeeId?.name || 'Unknown',
                    type: e.type,
                    status: e.status,
                })),
            },
        };
    }
    async checkAndEscalate(periodStart, periodEnd, deadlineHours) {
        const escalations = [];
        const deadline = new Date();
        deadline.setHours(deadline.getHours() - deadlineHours);
        const oldPendingOvertime = await this.overtimeModel.find({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: overtime_record_schema_1.OvertimeStatus.PENDING,
            createdAt: { $lt: deadline },
        }).exec();
        for (const ot of oldPendingOvertime) {
            escalations.push({
                type: 'OVERTIME',
                recordId: ot._id.toString(),
                escalated: true,
                reason: `Overtime record pending for more than ${deadlineHours} hours`,
            });
        }
        const oldPendingPenalties = await this.penaltyModel.find({
            recordDate: { $gte: periodStart, $lte: periodEnd },
            status: penalty_record_schema_1.PenaltyStatus.PENDING,
            createdAt: { $lt: deadline },
        }).exec();
        for (const penalty of oldPendingPenalties) {
            escalations.push({
                type: 'PENALTY',
                recordId: penalty._id.toString(),
                escalated: true,
                reason: `Penalty record pending for more than ${deadlineHours} hours`,
            });
        }
        const oldPendingExceptions = await this.exceptionModel.find({
            createdAt: {
                $gte: periodStart,
                $lte: periodEnd,
                $lt: deadline
            },
            status: { $in: [index_1.TimeExceptionStatus.OPEN, index_1.TimeExceptionStatus.PENDING] },
        }).exec();
        for (const exception of oldPendingExceptions) {
            escalations.push({
                type: 'EXCEPTION',
                recordId: exception._id.toString(),
                escalated: true,
                reason: `Exception pending for more than ${deadlineHours} hours`,
            });
        }
        return escalations;
    }
};
exports.PrePayrollService = PrePayrollService;
exports.PrePayrollService = PrePayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(penalty_record_schema_1.PenaltyRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(overtime_record_schema_1.OvertimeRecord.name)),
    __param(2, (0, mongoose_1.InjectModel)(time_exception_schema_1.TimeException.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        payroll_service_1.PayrollService])
], PrePayrollService);
//# sourceMappingURL=pre-payroll.service.js.map