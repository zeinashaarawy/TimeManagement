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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attendance_record_schema_1 = require("../schemas/attendance-record.schema");
const time_exception_schema_1 = require("../schemas/time-exception.schema");
const index_1 = require("../../enums/index");
let AttendanceService = class AttendanceService {
    recordModel;
    exceptionModel;
    constructor(recordModel, exceptionModel) {
        this.recordModel = recordModel;
        this.exceptionModel = exceptionModel;
    }
    async createPunch(dto) {
        const dateOnly = new Date(dto.timestamp);
        dateOnly.setHours(0, 0, 0, 0);
        let record = await this.recordModel.findOne({
            employeeId: new mongoose_2.Types.ObjectId(dto.employeeId),
            recordDate: dateOnly,
            finalisedForPayroll: true,
        });
        if (!record) {
            record = new this.recordModel({
                employeeId: new mongoose_2.Types.ObjectId(dto.employeeId),
                recordDate: dateOnly,
                punches: [],
                totalWorkMinutes: 0,
                hasMissedPunch: false,
                exceptionIds: [],
                finalisedForPayroll: true,
            });
        }
        if (dto.type === index_1.PunchType.IN) {
            record.punches.push({ type: index_1.PunchType.IN, time: dto.timestamp });
        }
        else if (dto.type === index_1.PunchType.OUT) {
            const lastInPunch = record.punches
                .filter(p => p.type === index_1.PunchType.IN)
                .slice(-1)[0];
            const lastOutPunch = record.punches
                .filter(p => p.type === index_1.PunchType.OUT)
                .slice(-1)[0];
            if (!lastInPunch || !lastOutPunch || lastOutPunch.time < lastInPunch.time) {
                record.punches.push({ type: index_1.PunchType.OUT, time: dto.timestamp });
            }
            else {
                const exception = await this.exceptionModel.create({
                    employeeId: new mongoose_2.Types.ObjectId(dto.employeeId),
                    type: index_1.TimeExceptionType.MISSED_PUNCH,
                    attendanceRecordId: record._id,
                    assignedTo: new mongoose_2.Types.ObjectId('managerObjectIdHere'),
                    status: index_1.TimeExceptionStatus.OPEN,
                    reason: 'Out punch without corresponding IN punch',
                });
                record.exceptionIds.push(exception._id);
            }
        }
        await record.save();
        return record;
    }
    async getAttendance(employeeId, date) {
        const query = {
            employeeId: new mongoose_2.Types.ObjectId(employeeId)
        };
        if (date) {
            const dateOnly = new Date(date);
            dateOnly.setHours(0, 0, 0, 0);
            query.recordDate = dateOnly;
        }
        return this.recordModel.findOne(query).exec();
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(attendance_record_schema_1.AttendanceRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(time_exception_schema_1.TimeException.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map