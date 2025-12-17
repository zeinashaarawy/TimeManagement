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
exports.PolicyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const time_policy_schema_1 = require("../schemas/time-policy.schema");
let PolicyService = class PolicyService {
    policyModel;
    constructor(policyModel) {
        this.policyModel = policyModel;
    }
    async create(policyData) {
        if (policyData.scope === time_policy_schema_1.PolicyScope.DEPARTMENT && !policyData.departmentId) {
            throw new common_1.BadRequestException('Department ID is required for DEPARTMENT scope');
        }
        if (policyData.scope === time_policy_schema_1.PolicyScope.EMPLOYEE && !policyData.employeeId) {
            throw new common_1.BadRequestException('Employee ID is required for EMPLOYEE scope');
        }
        const policy = new this.policyModel(policyData);
        return policy.save();
    }
    async findAll(filters) {
        const query = {};
        if (filters?.scope) {
            query.scope = filters.scope;
        }
        if (filters?.active !== undefined) {
            query.active = filters.active;
        }
        if (filters?.departmentId) {
            query.departmentId = filters.departmentId;
        }
        if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }
        return this.policyModel.find(query).sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        const policy = await this.policyModel.findById(id);
        if (!policy) {
            throw new common_1.NotFoundException(`Policy with ID ${id} not found`);
        }
        return policy;
    }
    async update(id, updateData) {
        const policy = await this.findById(id);
        if (updateData.scope === time_policy_schema_1.PolicyScope.DEPARTMENT && !updateData.departmentId && !policy.departmentId) {
            throw new common_1.BadRequestException('Department ID is required for DEPARTMENT scope');
        }
        if (updateData.scope === time_policy_schema_1.PolicyScope.EMPLOYEE && !updateData.employeeId && !policy.employeeId) {
            throw new common_1.BadRequestException('Employee ID is required for EMPLOYEE scope');
        }
        Object.assign(policy, updateData);
        return policy.save();
    }
    async delete(id) {
        const policy = await this.findById(id);
        await policy.deleteOne();
    }
    async assignToEmployee(policyId, employeeId) {
        const policy = await this.findById(policyId);
        const employeePolicy = new this.policyModel({
            ...policy.toObject(),
            _id: undefined,
            scope: time_policy_schema_1.PolicyScope.EMPLOYEE,
            employeeId,
        });
        return employeePolicy.save();
    }
    async assignToDepartment(policyId, departmentId) {
        const policy = await this.findById(policyId);
        const departmentPolicy = new this.policyModel({
            ...policy.toObject(),
            _id: undefined,
            scope: time_policy_schema_1.PolicyScope.DEPARTMENT,
            departmentId,
        });
        return departmentPolicy.save();
    }
};
exports.PolicyService = PolicyService;
exports.PolicyService = PolicyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(time_policy_schema_1.TimePolicy.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PolicyService);
//# sourceMappingURL=policy.service.js.map