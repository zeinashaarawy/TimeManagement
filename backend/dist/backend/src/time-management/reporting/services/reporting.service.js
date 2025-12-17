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
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attendance_record_schema_1 = require("../../attendance/schemas/attendance-record.schema");
const penalty_record_schema_1 = require("../../policy/schemas/penalty-record.schema");
const overtime_record_schema_1 = require("../../policy/schemas/overtime-record.schema");
let ReportingService = class ReportingService {
    attendanceModel;
    penaltyModel;
    overtimeModel;
    constructor(attendanceModel, penaltyModel, overtimeModel) {
        this.attendanceModel = attendanceModel;
        this.penaltyModel = penaltyModel;
        this.overtimeModel = overtimeModel;
    }
    async getAttendanceReport(filters, page = 1, limit = 50) {
        const query = {};
        if (filters.employeeId) {
            query.employeeId = filters.employeeId;
        }
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate) {
                query.recordDate.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.recordDate.$lte = filters.endDate;
            }
        }
        const skip = (page - 1) * limit;
        const queryBuilder = this.attendanceModel.find(query);
        if (filters.includeExceptions) {
            queryBuilder.populate({
                path: 'exceptionIds',
                strictPopulate: false,
            });
        }
        const [records, total] = await Promise.all([
            queryBuilder
                .skip(skip)
                .limit(limit)
                .sort({ recordDate: -1 })
                .exec(),
            this.attendanceModel.countDocuments(query),
        ]);
        return {
            data: records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getOvertimeReport(filters, page = 1, limit = 50) {
        const query = {};
        if (filters.employeeId) {
            query.employeeId = filters.employeeId;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate) {
                query.recordDate.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.recordDate.$lte = filters.endDate;
            }
        }
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            this.overtimeModel
                .find(query)
                .populate('policyId', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ recordDate: -1 })
                .exec(),
            this.overtimeModel.countDocuments(query),
        ]);
        const aggregates = await this.overtimeModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalOvertimeMinutes: { $sum: '$overtimeMinutes' },
                    totalAmount: { $sum: '$calculatedAmount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        return {
            data: records,
            aggregates: aggregates[0] || { totalOvertimeMinutes: 0, totalAmount: 0, count: 0 },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getPenaltyReport(filters, page = 1, limit = 50) {
        const query = {};
        if (filters.employeeId) {
            query.employeeId = filters.employeeId;
        }
        if (filters.type) {
            query.type = filters.type;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate) {
                query.recordDate.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.recordDate.$lte = filters.endDate;
            }
        }
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            this.penaltyModel
                .find(query)
                .populate('policyId', 'name')
                .skip(skip)
                .limit(limit)
                .sort({ recordDate: -1 })
                .exec(),
            this.penaltyModel.countDocuments(query),
        ]);
        const aggregates = await this.penaltyModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalMinutes: { $sum: '$minutes' },
                    count: { $sum: 1 },
                },
            },
        ]);
        return {
            data: records,
            aggregates: aggregates[0] || { totalAmount: 0, totalMinutes: 0, count: 0 },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async exportAttendanceReportCSV(filters) {
        const records = await this.attendanceModel
            .find(this.buildAttendanceQuery(filters))
            .sort({ recordDate: -1 })
            .exec();
        const headers = ['Record ID', 'Date', 'Employee ID', 'Total Work Minutes', 'Punch Count', 'Has Missed Punch', 'Exception Count', 'Finalized'];
        const rows = records.map(record => {
            return [
                record._id.toString(),
                record.recordDate?.toISOString().split('T')[0] || '',
                record.employeeId.toString(),
                record.totalWorkMinutes.toString(),
                record.punches?.length?.toString() || '0',
                record.hasMissedPunch ? 'Yes' : 'No',
                record.exceptionIds?.length?.toString() || '0',
                record.finalisedForPayroll ? 'Yes' : 'No',
            ];
        });
        return this.generateCSV(headers, rows);
    }
    async exportOvertimeReportCSV(filters) {
        const records = await this.overtimeModel
            .find(this.buildOvertimeQuery(filters))
            .populate('policyId', 'name')
            .sort({ recordDate: -1 })
            .exec();
        const headers = ['Date', 'Employee ID', 'Overtime Minutes', 'Multiplier', 'Amount', 'Status', 'Is Weekend'];
        const rows = records.map(record => [
            record.recordDate.toISOString().split('T')[0],
            record.employeeId.toString(),
            record.overtimeMinutes.toString(),
            record.multiplier.toString(),
            record.calculatedAmount.toString(),
            record.status,
            record.isWeekend ? 'Yes' : 'No',
        ]);
        return this.generateCSV(headers, rows);
    }
    async exportPenaltyReportCSV(filters) {
        const records = await this.penaltyModel
            .find(this.buildPenaltyQuery(filters))
            .populate('policyId', 'name')
            .sort({ recordDate: -1 })
            .exec();
        const headers = ['Date', 'Employee ID', 'Type', 'Minutes', 'Amount', 'Status'];
        const rows = records.map(record => [
            record.recordDate.toISOString().split('T')[0],
            record.employeeId.toString(),
            record.type,
            record.minutes.toString(),
            record.amount.toString(),
            record.status,
        ]);
        return this.generateCSV(headers, rows);
    }
    buildAttendanceQuery(filters) {
        const query = {};
        if (filters.employeeId)
            query.employeeId = filters.employeeId;
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate)
                query.recordDate.$gte = filters.startDate;
            if (filters.endDate)
                query.recordDate.$lte = filters.endDate;
        }
        return query;
    }
    buildOvertimeQuery(filters) {
        const query = {};
        if (filters.employeeId)
            query.employeeId = filters.employeeId;
        if (filters.status)
            query.status = filters.status;
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate)
                query.recordDate.$gte = filters.startDate;
            if (filters.endDate)
                query.recordDate.$lte = filters.endDate;
        }
        return query;
    }
    buildPenaltyQuery(filters) {
        const query = {};
        if (filters.employeeId)
            query.employeeId = filters.employeeId;
        if (filters.type)
            query.type = filters.type;
        if (filters.status)
            query.status = filters.status;
        if (filters.startDate || filters.endDate) {
            query.recordDate = {};
            if (filters.startDate)
                query.recordDate.$gte = filters.startDate;
            if (filters.endDate)
                query.recordDate.$lte = filters.endDate;
        }
        return query;
    }
    generateCSV(headers, rows) {
        const escapeCSV = (value) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };
        const csvRows = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(',')),
        ];
        return csvRows.join('\n');
    }
};
exports.ReportingService = ReportingService;
exports.ReportingService = ReportingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(attendance_record_schema_1.AttendanceRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(penalty_record_schema_1.PenaltyRecord.name)),
    __param(2, (0, mongoose_1.InjectModel)(overtime_record_schema_1.OvertimeRecord.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReportingService);
//# sourceMappingURL=reporting.service.js.map