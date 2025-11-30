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
exports.TimeManagementService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attendance_record_schema_1 = require("./attendance/schemas/attendance-record.schema");
const time_exception_schema_1 = require("./attendance/schemas/time-exception.schema");
const index_1 = require("./enums/index");
const notification_log_schema_1 = require("./notifications/schemas/notification-log.schema");
let TimeManagementService = class TimeManagementService {
    attendanceModel;
    exceptionModel;
    notificationModel;
    constructor(attendanceModel, exceptionModel, notificationModel) {
        this.attendanceModel = attendanceModel;
        this.exceptionModel = exceptionModel;
        this.notificationModel = notificationModel;
    }
    async recordPunch(dto) {
        const employeeObjectId = new mongoose_2.Types.ObjectId(dto.employeeId);
        const punchTime = new Date(dto.timestamp);
        const startOfDay = new Date(punchTime);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(punchTime);
        endOfDay.setHours(23, 59, 59, 999);
        let attendance = await this.attendanceModel.findOne({
            employeeId: employeeObjectId,
            'punches.time': { $gte: startOfDay, $lte: endOfDay },
        });
        if (!attendance) {
            attendance = new this.attendanceModel({
                employeeId: employeeObjectId,
                punches: [],
            });
        }
        attendance.punches.push({
            type: dto.type,
            time: punchTime,
        });
        const savedRecord = await attendance.save();
        const punchesToday = savedRecord.punches.length;
        if (punchesToday < 2) {
            const existing = await this.exceptionModel.findOne({
                employeeId: employeeObjectId,
                type: 'MISSED_PUNCH',
                'createdAt': { $gte: startOfDay, $lte: endOfDay }
            });
            if (!existing) {
                const exception = await this.exceptionModel.create({
                    employeeId: employeeObjectId,
                    attendanceRecordId: savedRecord._id,
                    type: 'MISSED_PUNCH',
                    status: 'OPEN',
                    reason: `Employee has only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`,
                });
                await this.sendNotification(dto.employeeId, 'MISSED_PUNCH', `Missed punch detected: only ${punchesToday} punch(es) on ${startOfDay.toDateString()}`);
            }
        }
        return {
            message: 'Punch recorded successfully',
            attendance: savedRecord,
        };
    }
    async getNotifications(employeeId) {
        return this.notificationModel.find({ to: new mongoose_2.Types.ObjectId(employeeId) }).lean();
    }
    async sendNotification(to, type, message) {
        const notification = new this.notificationModel({
            to: new mongoose_2.Types.ObjectId(to),
            type,
            message,
        });
        return notification.save();
    }
    async getAttendance(employeeId, date) {
        const query = { employeeId: new mongoose_2.Types.ObjectId(employeeId) };
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query['punches.time'] = { $gte: start, $lte: end };
        }
        const record = await this.attendanceModel.findOne(query).lean();
        if (!record)
            return { message: 'No attendance found', punches: [] };
        return {
            employeeId: record.employeeId,
            punches: record.punches,
            totalWorkMinutes: record.totalWorkMinutes,
            hasMissedPunch: record.hasMissedPunch,
            exceptionIds: record.exceptionIds,
        };
    }
    async createTimeException(employeeId, recordId, reason, assignedToId) {
        const exception = new this.exceptionModel({
            employeeId: new mongoose_2.Types.ObjectId(employeeId),
            attendanceRecordId: new mongoose_2.Types.ObjectId(recordId),
            reason,
            type: index_1.TimeExceptionType.MISSED_PUNCH,
            status: index_1.TimeExceptionStatus.OPEN,
            assignedTo: new mongoose_2.Types.ObjectId(assignedToId),
        });
        return exception.save();
    }
    async getExceptions(employeeId) {
        return this.exceptionModel.find({
            employeeId: new mongoose_2.Types.ObjectId(employeeId),
        }).exec();
    }
    async correctAttendance(employeeId, date, punches) {
        const employeeObjectId = new mongoose_2.Types.ObjectId(employeeId);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        let attendance = await this.attendanceModel.findOne({
            employeeId: employeeObjectId,
            'punches.time': { $gte: startOfDay, $lte: endOfDay },
        });
        if (!attendance) {
            attendance = new this.attendanceModel({
                employeeId: employeeObjectId,
                punches: [],
            });
        }
        attendance.punches = punches.map((p) => ({
            type: p.type,
            time: p.timestamp,
        }));
        const saved = await attendance.save();
        return {
            message: 'Attendance corrected successfully',
            attendance: saved,
        };
    }
    async detectMissedPunches(employeeId, date) {
        const employeeObjectId = new mongoose_2.Types.ObjectId(employeeId);
        const attendance = await this.attendanceModel.findOne({
            employeeId: employeeObjectId,
            'punches.time': {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lte: new Date(date.setHours(23, 59, 59, 999)),
            },
        });
        const punchesCount = attendance?.punches.length || 0;
        if (punchesCount < 2) {
            const exception = new this.exceptionModel({
                employeeId: employeeObjectId,
                type: index_1.TimeExceptionType.MISSED_PUNCH,
                attendanceRecordId: attendance?._id,
                assignedTo: null,
                status: index_1.TimeExceptionStatus.OPEN,
                reason: `Missed punches on ${date.toDateString()}`,
            });
            await exception.save();
            return { message: 'Time exception created', exception };
        }
        return { message: 'No missed punches detected' };
    }
};
exports.TimeManagementService = TimeManagementService;
exports.TimeManagementService = TimeManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(attendance_record_schema_1.AttendanceRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(time_exception_schema_1.TimeException.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_log_schema_1.NotificationLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], TimeManagementService);
//# sourceMappingURL=time-management.service.js.map