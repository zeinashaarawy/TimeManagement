import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
export declare enum PolicyScope {
    GLOBAL = "GLOBAL",
    DEPARTMENT = "DEPARTMENT",
    EMPLOYEE = "EMPLOYEE"
}
export declare enum RoundingRule {
    NONE = "NONE",
    ROUND_UP = "ROUND_UP",
    ROUND_DOWN = "ROUND_DOWN",
    ROUND_NEAREST = "ROUND_NEAREST"
}
export type OvertimeRuleConfig = {
    thresholdMinutes: number;
    multiplier: number;
    dailyCapMinutes?: number;
    weeklyCapMinutes?: number;
    weekendMultiplier?: number;
};
export type LatenessRuleConfig = {
    gracePeriodMinutes: number;
    deductionPerMinute: number;
    cumulativeThresholdMinutes?: number;
    maxDeductionPerDay?: number;
};
export type ShortTimeRuleConfig = {
    minimumWorkMinutes: number;
    penaltyPerMinute?: number;
    gracePeriodMinutes?: number;
};
export type WeekendRuleConfig = {
    enabled: boolean;
    weekendDays: number[];
    specialRate?: number;
};
export type TimePolicyDocument = HydratedDocument<TimePolicy>;
export declare class TimePolicy {
    name: string;
    description?: string;
    scope: PolicyScope;
    departmentId?: Types.ObjectId;
    employeeId?: Types.ObjectId;
    latenessRule?: LatenessRuleConfig;
    overtimeRule?: OvertimeRuleConfig;
    shortTimeRule?: ShortTimeRuleConfig;
    weekendRule?: WeekendRuleConfig;
    roundingRule: RoundingRule;
    roundingIntervalMinutes: number;
    penaltyCapPerDay?: number;
    active: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
}
export declare const TimePolicySchema: import("mongoose").Schema<TimePolicy, import("mongoose").Model<TimePolicy, any, any, any, import("mongoose").Document<unknown, any, TimePolicy, any, {}> & TimePolicy & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TimePolicy, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<TimePolicy>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TimePolicy> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
