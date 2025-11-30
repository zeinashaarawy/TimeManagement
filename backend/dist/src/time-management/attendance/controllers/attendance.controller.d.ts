import { AttendanceService } from '../services/attendance.service';
import { CreatePunchDto } from '../dto/create-punch.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    punch(dto: CreatePunchDto): Promise<import("../schemas/attendance-record.schema").AttendanceRecordDocument>;
    getAttendance(employeeId: string, date?: string): Promise<import("../schemas/attendance-record.schema").AttendanceRecordDocument | null>;
}
