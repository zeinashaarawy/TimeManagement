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
exports.PolicyEngineService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attendance_record_schema_1 = require("../../attendance/schemas/attendance-record.schema");
const time_exception_schema_1 = require("../../attendance/schemas/time-exception.schema");
const time_policy_schema_1 = require("../schemas/time-policy.schema");
const penalty_record_schema_1 = require("../schemas/penalty-record.schema");
const overtime_record_schema_1 = require("../schemas/overtime-record.schema");
const index_1 = require("../../enums/index");
let PolicyEngineService = class PolicyEngineService {
    policyModel;
    attendanceModel;
    exceptionModel;
    penaltyModel;
    overtimeModel;
    constructor(policyModel, attendanceModel, exceptionModel, penaltyModel, overtimeModel) {
        this.policyModel = policyModel;
        this.attendanceModel = attendanceModel;
        this.exceptionModel = exceptionModel;
        this.penaltyModel = penaltyModel;
        this.overtimeModel = overtimeModel;
    }
    async getApplicablePolicy(employeeId, date) {
        const employeePolicy = await this.policyModel.findOne({
            scope: time_policy_schema_1.PolicyScope.EMPLOYEE,
            employeeId,
            active: true,
            $or: [
                { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
                { effectiveFrom: { $lte: date }, effectiveTo: null },
                { effectiveFrom: null, effectiveTo: { $gte: date } },
                { effectiveFrom: null, effectiveTo: null },
            ],
        }).sort({ createdAt: -1 });
        if (employeePolicy)
            return employeePolicy;
        const globalPolicy = await this.policyModel.findOne({
            scope: time_policy_schema_1.PolicyScope.GLOBAL,
            active: true,
            $or: [
                { effectiveFrom: { $lte: date }, effectiveTo: { $gte: date } },
                { effectiveFrom: { $lte: date }, effectiveTo: null },
                { effectiveFrom: null, effectiveTo: { $gte: date } },
                { effectiveFrom: null, effectiveTo: null },
            ],
        }).sort({ createdAt: -1 });
        return globalPolicy;
    }
    async computePolicyResults(attendanceRecord, recordDate, scheduledStartTime, scheduledEndTime, scheduledMinutes) {
        const policy = await this.getApplicablePolicy(attendanceRecord.employeeId, recordDate);
        if (!policy) {
            throw new Error(`No applicable policy found for employee ${attendanceRecord.employeeId} on ${recordDate}`);
        }
        const approvedExceptions = await this.exceptionModel.find({
            attendanceRecordId: attendanceRecord._id,
            status: index_1.TimeExceptionStatus.APPROVED,
        });
        let workedMinutes = this.calculateWorkedMinutes(attendanceRecord.punches);
        workedMinutes = this.applyRounding(workedMinutes, policy.roundingRule, policy.roundingIntervalMinutes);
        let latenessMinutes = 0;
        if (scheduledStartTime) {
            const scheduledDate = new Date(scheduledStartTime);
            const recordDateOnly = new Date(recordDate);
            recordDateOnly.setHours(0, 0, 0, 0);
            scheduledDate.setHours(0, 0, 0, 0);
            if (scheduledDate.getTime() === recordDateOnly.getTime()) {
                latenessMinutes = this.calculateLateness(attendanceRecord.punches, scheduledStartTime, policy.latenessRule);
            }
            else {
                console.warn(`Scheduled start time date (${scheduledDate.toISOString()}) doesn't match record date (${recordDateOnly.toISOString()}). Skipping lateness calculation.`);
            }
        }
        const shortTimeMinutes = scheduledMinutes
            ? Math.max(0, scheduledMinutes - workedMinutes)
            : 0;
        const overtimeMinutes = scheduledMinutes
            ? Math.max(0, workedMinutes - scheduledMinutes)
            : 0;
        const isWeekend = this.isWeekend(recordDate, policy.weekendRule);
        const exceptionAdjustments = this.applyExceptions(approvedExceptions, {
            workedMinutes,
            overtimeMinutes,
            latenessMinutes,
            shortTimeMinutes,
        });
        const penalties = await this.computePenalties(attendanceRecord, policy, latenessMinutes, shortTimeMinutes, exceptionAdjustments, recordDate);
        const overtimeRecords = await this.computeOvertime(attendanceRecord, policy, overtimeMinutes, workedMinutes, scheduledMinutes || 0, isWeekend, exceptionAdjustments, recordDate);
        return {
            workedMinutes: exceptionAdjustments.workedMinutes,
            overtimeMinutes: exceptionAdjustments.overtimeMinutes,
            latenessMinutes: exceptionAdjustments.latenessMinutes,
            shortTimeMinutes: exceptionAdjustments.shortTimeMinutes,
            penalties,
            overtime: overtimeRecords,
            appliedPolicy: policy,
        };
    }
    calculateWorkedMinutes(punches) {
        if (punches.length === 0)
            return 0;
        const sortedPunches = [...punches].sort((a, b) => a.time.getTime() - b.time.getTime());
        let totalMinutes = 0;
        let lastInTime = null;
        for (const punch of sortedPunches) {
            if (punch.type === 'IN') {
                lastInTime = punch.time;
            }
            else if (punch.type === 'OUT' && lastInTime) {
                const diffMs = punch.time.getTime() - lastInTime.getTime();
                totalMinutes += Math.floor(diffMs / (1000 * 60));
                lastInTime = null;
            }
        }
        return totalMinutes;
    }
    applyRounding(minutes, rule, interval) {
        if (rule === time_policy_schema_1.RoundingRule.NONE || interval === 0)
            return minutes;
        switch (rule) {
            case time_policy_schema_1.RoundingRule.ROUND_UP:
                return Math.ceil(minutes / interval) * interval;
            case time_policy_schema_1.RoundingRule.ROUND_DOWN:
                return Math.floor(minutes / interval) * interval;
            case time_policy_schema_1.RoundingRule.ROUND_NEAREST:
                return Math.round(minutes / interval) * interval;
            default:
                return minutes;
        }
    }
    calculateLateness(punches, scheduledStart, latenessRule) {
        const firstInPunch = punches.find(p => p.type === 'IN');
        if (!firstInPunch)
            return 0;
        const gracePeriod = latenessRule?.gracePeriodMinutes || 0;
        const punchTime = firstInPunch.time instanceof Date ? firstInPunch.time : new Date(firstInPunch.time);
        const scheduledTime = scheduledStart instanceof Date ? scheduledStart : new Date(scheduledStart);
        const timeDiffMinutes = (punchTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        const lateBy = Math.max(0, timeDiffMinutes - gracePeriod);
        return Math.floor(lateBy);
    }
    isWeekend(date, weekendRule) {
        if (!weekendRule?.enabled)
            return false;
        const dayOfWeek = date.getDay();
        return weekendRule.weekendDays?.includes(dayOfWeek) || false;
    }
    applyExceptions(exceptions, baseValues) {
        let adjusted = { ...baseValues };
        for (const exception of exceptions) {
            switch (exception.type) {
                case index_1.TimeExceptionType.MANUAL_ADJUSTMENT:
                    break;
                case index_1.TimeExceptionType.LATE:
                    adjusted.latenessMinutes = 0;
                    break;
                case index_1.TimeExceptionType.OVERTIME_REQUEST:
                    break;
                case index_1.TimeExceptionType.SHORT_TIME:
                    adjusted.shortTimeMinutes = 0;
                    break;
            }
        }
        return adjusted;
    }
    async computePenalties(attendanceRecord, policy, latenessMinutes, shortTimeMinutes, exceptionAdjustments, recordDate) {
        const penalties = [];
        if (policy.latenessRule && exceptionAdjustments.latenessMinutes > 0) {
            const latenessRule = policy.latenessRule;
            const penaltyMinutes = exceptionAdjustments.latenessMinutes;
            let amount = penaltyMinutes * (latenessRule.deductionPerMinute || 0);
            if (latenessRule.maxDeductionPerDay && amount > latenessRule.maxDeductionPerDay) {
                amount = latenessRule.maxDeductionPerDay;
            }
            if (policy.penaltyCapPerDay && amount > policy.penaltyCapPerDay) {
                amount = policy.penaltyCapPerDay;
            }
            if (amount > 0) {
                const penalty = new this.penaltyModel({
                    employeeId: attendanceRecord.employeeId,
                    attendanceRecordId: attendanceRecord._id,
                    policyId: policy._id,
                    type: penalty_record_schema_1.PenaltyType.LATENESS,
                    amount,
                    minutes: penaltyMinutes,
                    status: penalty_record_schema_1.PenaltyStatus.PENDING,
                    recordDate,
                });
                penalties.push(penalty);
            }
        }
        if (policy.shortTimeRule && exceptionAdjustments.shortTimeMinutes > 0) {
            const shortTimeRule = policy.shortTimeRule;
            const penaltyMinutes = exceptionAdjustments.shortTimeMinutes;
            const gracePeriod = shortTimeRule.gracePeriodMinutes || 0;
            const effectiveShortMinutes = Math.max(0, penaltyMinutes - gracePeriod);
            if (effectiveShortMinutes > 0) {
                let amount = effectiveShortMinutes * (shortTimeRule.penaltyPerMinute || 0);
                if (policy.penaltyCapPerDay && amount > policy.penaltyCapPerDay) {
                    amount = policy.penaltyCapPerDay;
                }
                if (amount > 0) {
                    const penalty = new this.penaltyModel({
                        employeeId: attendanceRecord.employeeId,
                        attendanceRecordId: attendanceRecord._id,
                        policyId: policy._id,
                        type: penalty_record_schema_1.PenaltyType.SHORT_TIME,
                        amount,
                        minutes: effectiveShortMinutes,
                        status: penalty_record_schema_1.PenaltyStatus.PENDING,
                        recordDate,
                    });
                    penalties.push(penalty);
                }
            }
        }
        if (attendanceRecord.hasMissedPunch) {
            const penalty = new this.penaltyModel({
                employeeId: attendanceRecord.employeeId,
                attendanceRecordId: attendanceRecord._id,
                policyId: policy._id,
                type: penalty_record_schema_1.PenaltyType.MISSED_PUNCH,
                amount: 0,
                minutes: 0,
                status: penalty_record_schema_1.PenaltyStatus.PENDING,
                recordDate,
            });
            penalties.push(penalty);
        }
        return penalties;
    }
    async computeOvertime(attendanceRecord, policy, overtimeMinutes, workedMinutes, scheduledMinutes, isWeekend, exceptionAdjustments, recordDate) {
        const overtimeRecords = [];
        if (!policy.overtimeRule || exceptionAdjustments.overtimeMinutes <= 0) {
            return overtimeRecords;
        }
        const overtimeRule = policy.overtimeRule;
        const effectiveOvertime = exceptionAdjustments.overtimeMinutes;
        if (effectiveOvertime < overtimeRule.thresholdMinutes) {
            return overtimeRecords;
        }
        let cappedOvertime = effectiveOvertime;
        if (overtimeRule.dailyCapMinutes && cappedOvertime > overtimeRule.dailyCapMinutes) {
            cappedOvertime = overtimeRule.dailyCapMinutes;
        }
        const multiplier = isWeekend && overtimeRule.weekendMultiplier
            ? overtimeRule.weekendMultiplier
            : overtimeRule.multiplier;
        const regularMinutes = scheduledMinutes;
        const calculatedAmount = cappedOvertime * multiplier;
        const overtimeRecord = new this.overtimeModel({
            employeeId: attendanceRecord.employeeId,
            attendanceRecordId: attendanceRecord._id,
            policyId: policy._id,
            overtimeMinutes: cappedOvertime,
            regularMinutes,
            multiplier,
            calculatedAmount,
            status: overtime_record_schema_1.OvertimeStatus.PENDING,
            recordDate,
            isWeekend,
        });
        overtimeRecords.push(overtimeRecord);
        return overtimeRecords;
    }
    async recalculatePolicyResults(attendanceRecordId, recordDate, scheduledStartTime, scheduledEndTime, scheduledMinutes) {
        const attendanceRecord = await this.attendanceModel.findById(attendanceRecordId);
        if (!attendanceRecord) {
            throw new Error(`Attendance record ${attendanceRecordId} not found`);
        }
        await this.penaltyModel.deleteMany({
            attendanceRecordId,
            status: { $in: [penalty_record_schema_1.PenaltyStatus.PENDING] },
        });
        await this.overtimeModel.deleteMany({
            attendanceRecordId,
            status: { $in: [overtime_record_schema_1.OvertimeStatus.PENDING] },
        });
        return this.computePolicyResults(attendanceRecord, recordDate, scheduledStartTime, scheduledEndTime, scheduledMinutes);
    }
    async saveComputedResults(result) {
        for (const penalty of result.penalties) {
            await penalty.save();
        }
        for (const overtime of result.overtime) {
            await overtime.save();
        }
    }
};
exports.PolicyEngineService = PolicyEngineService;
exports.PolicyEngineService = PolicyEngineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(time_policy_schema_1.TimePolicy.name)),
    __param(1, (0, mongoose_1.InjectModel)(attendance_record_schema_1.AttendanceRecord.name)),
    __param(2, (0, mongoose_1.InjectModel)(time_exception_schema_1.TimeException.name)),
    __param(3, (0, mongoose_1.InjectModel)(penalty_record_schema_1.PenaltyRecord.name)),
    __param(4, (0, mongoose_1.InjectModel)(overtime_record_schema_1.OvertimeRecord.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PolicyEngineService);
//# sourceMappingURL=policy-engine.service.js.map