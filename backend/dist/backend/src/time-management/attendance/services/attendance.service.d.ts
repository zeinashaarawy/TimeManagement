import { Model } from 'mongoose';
import { AttendanceRecordDocument } from '../schemas/attendance-record.schema';
import { TimeExceptionDocument } from '../schemas/time-exception.schema';
import { CreatePunchDto } from '../dto/create-punch.dto';
export declare class AttendanceService {
    private recordModel;
    private exceptionModel;
    constructor(recordModel: Model<AttendanceRecordDocument>, exceptionModel: Model<TimeExceptionDocument>);
    createPunch(dto: CreatePunchDto): Promise<AttendanceRecordDocument>;
    getAttendance(employeeId: string, date?: Date): Promise<AttendanceRecordDocument | null>;
}
