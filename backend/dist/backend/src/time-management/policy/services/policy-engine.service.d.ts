import { Model, Types } from 'mongoose';
import { AttendanceRecordDocument } from '../../attendance/schemas/attendance-record.schema';
import { TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { TimePolicy, TimePolicyDocument } from '../schemas/time-policy.schema';
import { PenaltyRecordDocument } from '../schemas/penalty-record.schema';
import { OvertimeRecordDocument } from '../schemas/overtime-record.schema';
export interface ComputedResult {
    workedMinutes: number;
    overtimeMinutes: number;
    latenessMinutes: number;
    shortTimeMinutes: number;
    penalties: PenaltyRecordDocument[];
    overtime: OvertimeRecordDocument[];
    appliedPolicy: TimePolicy;
}
export declare class PolicyEngineService {
    private policyModel;
    private attendanceModel;
    private exceptionModel;
    private penaltyModel;
    private overtimeModel;
    constructor(policyModel: Model<TimePolicyDocument>, attendanceModel: Model<AttendanceRecordDocument>, exceptionModel: Model<TimeExceptionDocument>, penaltyModel: Model<PenaltyRecordDocument>, overtimeModel: Model<OvertimeRecordDocument>);
    getApplicablePolicy(employeeId: Types.ObjectId, date: Date): Promise<TimePolicyDocument | null>;
    computePolicyResults(attendanceRecord: AttendanceRecordDocument, recordDate: Date, scheduledStartTime?: Date, scheduledEndTime?: Date, scheduledMinutes?: number): Promise<ComputedResult>;
    private calculateWorkedMinutes;
    private applyRounding;
    private calculateLateness;
    private isWeekend;
    private applyExceptions;
    private computePenalties;
    private computeOvertime;
    recalculatePolicyResults(attendanceRecordId: Types.ObjectId, recordDate: Date, scheduledStartTime?: Date, scheduledEndTime?: Date, scheduledMinutes?: number): Promise<ComputedResult>;
    saveComputedResults(result: ComputedResult): Promise<void>;
}
