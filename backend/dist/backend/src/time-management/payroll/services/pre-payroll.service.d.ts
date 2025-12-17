import { Model } from 'mongoose';
import { PenaltyRecordDocument } from '../../policy/schemas/penalty-record.schema';
import { OvertimeRecordDocument } from '../../policy/schemas/overtime-record.schema';
import { TimeExceptionDocument } from '../../attendance/schemas/time-exception.schema';
import { PayrollService } from './payroll.service';
export declare class PrePayrollService {
    private penaltyModel;
    private overtimeModel;
    private exceptionModel;
    private payrollService;
    constructor(penaltyModel: Model<PenaltyRecordDocument>, overtimeModel: Model<OvertimeRecordDocument>, exceptionModel: Model<TimeExceptionDocument>, payrollService: PayrollService);
    runPrePayrollClosure(periodStart: Date, periodEnd: Date, escalationDeadlineHours?: number): Promise<{
        validationResult: any;
        report: any;
        escalations: any[];
    }>;
    private generatePreSyncReport;
    private checkAndEscalate;
}
