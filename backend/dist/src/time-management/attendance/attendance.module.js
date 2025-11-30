"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const attendance_service_1 = require("./services/attendance.service");
const attendance_controller_1 = require("./controllers/attendance.controller");
const attendance_record_schema_1 = require("./schemas/attendance-record.schema");
const attendance_correction_request_schema_1 = require("./schemas/attendance-correction-request.schema");
const time_exception_schema_1 = require("./schemas/time-exception.schema");
const punch_schema_1 = require("./schemas/punch.schema");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: punch_schema_1.Punch.name, schema: punch_schema_1.PunchSchema },
                { name: attendance_record_schema_1.AttendanceRecord.name, schema: attendance_record_schema_1.AttendanceRecordSchema },
                { name: attendance_correction_request_schema_1.AttendanceCorrectionRequest.name, schema: attendance_correction_request_schema_1.AttendanceCorrectionRequestSchema },
                { name: time_exception_schema_1.TimeException.name, schema: time_exception_schema_1.TimeExceptionSchema },
            ]),
        ],
        providers: [attendance_service_1.AttendanceService],
        controllers: [attendance_controller_1.AttendanceController],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map