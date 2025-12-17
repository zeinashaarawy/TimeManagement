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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimePolicySchema = exports.TimePolicy = exports.RoundingRule = exports.PolicyScope = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PolicyScope;
(function (PolicyScope) {
    PolicyScope["GLOBAL"] = "GLOBAL";
    PolicyScope["DEPARTMENT"] = "DEPARTMENT";
    PolicyScope["EMPLOYEE"] = "EMPLOYEE";
})(PolicyScope || (exports.PolicyScope = PolicyScope = {}));
var RoundingRule;
(function (RoundingRule) {
    RoundingRule["NONE"] = "NONE";
    RoundingRule["ROUND_UP"] = "ROUND_UP";
    RoundingRule["ROUND_DOWN"] = "ROUND_DOWN";
    RoundingRule["ROUND_NEAREST"] = "ROUND_NEAREST";
})(RoundingRule || (exports.RoundingRule = RoundingRule = {}));
let TimePolicy = class TimePolicy {
    name;
    description;
    scope;
    departmentId;
    employeeId;
    latenessRule;
    overtimeRule;
    shortTimeRule;
    weekendRule;
    roundingRule;
    roundingIntervalMinutes;
    penaltyCapPerDay;
    active;
    effectiveFrom;
    effectiveTo;
};
exports.TimePolicy = TimePolicy;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TimePolicy.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TimePolicy.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PolicyScope, required: true, default: PolicyScope.GLOBAL }),
    __metadata("design:type", String)
], TimePolicy.prototype, "scope", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TimePolicy.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeProfile', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TimePolicy.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], TimePolicy.prototype, "latenessRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], TimePolicy.prototype, "overtimeRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], TimePolicy.prototype, "shortTimeRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: false }),
    __metadata("design:type", Object)
], TimePolicy.prototype, "weekendRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: RoundingRule, default: RoundingRule.NONE }),
    __metadata("design:type", String)
], TimePolicy.prototype, "roundingRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 15 }),
    __metadata("design:type", Number)
], TimePolicy.prototype, "roundingIntervalMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], TimePolicy.prototype, "penaltyCapPerDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], TimePolicy.prototype, "active", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], TimePolicy.prototype, "effectiveFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], TimePolicy.prototype, "effectiveTo", void 0);
exports.TimePolicy = TimePolicy = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TimePolicy);
exports.TimePolicySchema = mongoose_1.SchemaFactory.createForClass(TimePolicy);
//# sourceMappingURL=time-policy.schema.js.map