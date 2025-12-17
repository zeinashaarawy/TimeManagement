import { Model, Types } from 'mongoose';
import { TimePolicy, TimePolicyDocument, PolicyScope } from '../schemas/time-policy.schema';
export declare class PolicyService {
    private policyModel;
    constructor(policyModel: Model<TimePolicyDocument>);
    create(policyData: Partial<TimePolicy>): Promise<TimePolicyDocument>;
    findAll(filters?: {
        scope?: PolicyScope;
        active?: boolean;
        departmentId?: Types.ObjectId;
        employeeId?: Types.ObjectId;
    }): Promise<TimePolicyDocument[]>;
    findById(id: Types.ObjectId): Promise<TimePolicyDocument>;
    update(id: Types.ObjectId, updateData: Partial<TimePolicy>): Promise<TimePolicyDocument>;
    delete(id: Types.ObjectId): Promise<void>;
    assignToEmployee(policyId: Types.ObjectId, employeeId: Types.ObjectId): Promise<TimePolicyDocument>;
    assignToDepartment(policyId: Types.ObjectId, departmentId: Types.ObjectId): Promise<TimePolicyDocument>;
}
