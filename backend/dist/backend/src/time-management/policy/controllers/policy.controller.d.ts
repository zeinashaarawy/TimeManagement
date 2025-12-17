import { PolicyService } from '../services/policy.service';
import { PolicyEngineService } from '../services/policy-engine.service';
import { TimePolicy, PolicyScope } from '../schemas/time-policy.schema';
import { Types } from 'mongoose';
export declare class PolicyController {
    private readonly policyService;
    private readonly policyEngineService;
    constructor(policyService: PolicyService, policyEngineService: PolicyEngineService);
    create(policyData: any): Promise<import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(scope?: PolicyScope, active?: string, departmentId?: string, employeeId?: string): Promise<(import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findById(id: Types.ObjectId): Promise<import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: Types.ObjectId, updateData: any): Promise<import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    delete(id: Types.ObjectId): Promise<{
        message: string;
    }>;
    assignToEmployee(policyId: Types.ObjectId, employeeId: Types.ObjectId): Promise<import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    assignToDepartment(policyId: Types.ObjectId, departmentId: Types.ObjectId): Promise<import("mongoose").Document<unknown, {}, TimePolicy, {}, {}> & TimePolicy & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }>;
    computePolicyResults(attendanceRecordId: Types.ObjectId, body: {
        recordDate: string;
        scheduledStartTime?: string;
        scheduledEndTime?: string;
        scheduledMinutes?: number;
    }): Promise<import("../services/policy-engine.service").ComputedResult>;
}
