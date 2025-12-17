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
exports.PolicyController = void 0;
const common_1 = require("@nestjs/common");
const policy_service_1 = require("../services/policy.service");
const policy_engine_service_1 = require("../services/policy-engine.service");
const time_policy_schema_1 = require("../schemas/time-policy.schema");
const mongoose_1 = require("mongoose");
const parse_object_id_pipe_1 = require("../../../common/pipes/parse-object-id.pipe");
let PolicyController = class PolicyController {
    policyService;
    policyEngineService;
    constructor(policyService, policyEngineService) {
        this.policyService = policyService;
        this.policyEngineService = policyEngineService;
    }
    async create(policyData) {
        const mappedData = { ...policyData };
        if (policyData.latenessRule) {
            const latenessRule = { ...policyData.latenessRule };
            if (latenessRule.graceMinutes !== undefined && latenessRule.gracePeriodMinutes === undefined) {
                latenessRule.gracePeriodMinutes = latenessRule.graceMinutes;
                delete latenessRule.graceMinutes;
            }
            if (latenessRule.penaltyPerMinute !== undefined && latenessRule.deductionPerMinute === undefined) {
                latenessRule.deductionPerMinute = latenessRule.penaltyPerMinute;
                delete latenessRule.penaltyPerMinute;
            }
            mappedData.latenessRule = latenessRule;
        }
        return this.policyService.create(mappedData);
    }
    async findAll(scope, active, departmentId, employeeId) {
        const filters = {};
        if (scope)
            filters.scope = scope;
        if (active !== undefined)
            filters.active = active === 'true';
        if (departmentId)
            filters.departmentId = new mongoose_1.Types.ObjectId(departmentId);
        if (employeeId)
            filters.employeeId = new mongoose_1.Types.ObjectId(employeeId);
        return this.policyService.findAll(filters);
    }
    async findById(id) {
        return this.policyService.findById(id);
    }
    async update(id, updateData) {
        const mappedData = { ...updateData };
        if (updateData.latenessRule) {
            const latenessRule = { ...updateData.latenessRule };
            if (latenessRule.graceMinutes !== undefined && latenessRule.gracePeriodMinutes === undefined) {
                latenessRule.gracePeriodMinutes = latenessRule.graceMinutes;
                delete latenessRule.graceMinutes;
            }
            if (latenessRule.penaltyPerMinute !== undefined && latenessRule.deductionPerMinute === undefined) {
                latenessRule.deductionPerMinute = latenessRule.penaltyPerMinute;
                delete latenessRule.penaltyPerMinute;
            }
            mappedData.latenessRule = latenessRule;
        }
        return this.policyService.update(id, mappedData);
    }
    async delete(id) {
        await this.policyService.delete(id);
        return { message: 'Policy deleted successfully' };
    }
    async assignToEmployee(policyId, employeeId) {
        return this.policyService.assignToEmployee(policyId, employeeId);
    }
    async assignToDepartment(policyId, departmentId) {
        return this.policyService.assignToDepartment(policyId, departmentId);
    }
    async computePolicyResults(attendanceRecordId, body) {
        const result = await this.policyEngineService.recalculatePolicyResults(attendanceRecordId, new Date(body.recordDate), body.scheduledStartTime ? new Date(body.scheduledStartTime) : undefined, body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined, body.scheduledMinutes);
        await this.policyEngineService.saveComputedResults(result);
        return result;
    }
};
exports.PolicyController = PolicyController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('active')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId, Object]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/assign/employee'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __param(1, (0, common_1.Body)('employeeId', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId, mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "assignToEmployee", null);
__decorate([
    (0, common_1.Post)(':id/assign/department'),
    __param(0, (0, common_1.Param)('id', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __param(1, (0, common_1.Body)('departmentId', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId, mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "assignToDepartment", null);
__decorate([
    (0, common_1.Post)('compute/:attendanceRecordId'),
    __param(0, (0, common_1.Param)('attendanceRecordId', parse_object_id_pipe_1.ParseObjectIdPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.Types.ObjectId, Object]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "computePolicyResults", null);
exports.PolicyController = PolicyController = __decorate([
    (0, common_1.Controller)('policies'),
    __metadata("design:paramtypes", [policy_service_1.PolicyService,
        policy_engine_service_1.PolicyEngineService])
], PolicyController);
//# sourceMappingURL=policy.controller.js.map