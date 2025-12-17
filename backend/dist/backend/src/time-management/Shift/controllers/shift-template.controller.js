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
exports.ShiftTemplateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shift_template_service_1 = require("../services/shift-template.service");
const create_shift_template_dto_1 = require("../dto/create-shift-template.dto");
const update_shift_template_dto_1 = require("../dto/update-shift-template.dto");
const shift_template_response_dto_1 = require("../dto/shift-template-response.dto");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_guard_1 = require("../guards/roles.guard");
let ShiftTemplateController = class ShiftTemplateController {
    shiftTemplateService;
    constructor(shiftTemplateService) {
        this.shiftTemplateService = shiftTemplateService;
    }
    async create(createDto) {
        return await this.shiftTemplateService.create(createDto);
    }
    async findAll() {
        return await this.shiftTemplateService.findAll();
    }
    async findOne(id) {
        return await this.shiftTemplateService.findById(id);
    }
    async update(id, updateDto) {
        return await this.shiftTemplateService.update(id, updateDto);
    }
    async remove(id) {
        await this.shiftTemplateService.delete(id);
    }
};
exports.ShiftTemplateController = ShiftTemplateController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new shift template',
        description: 'Create shift templates for various work arrangements including normal, split, overnight, rotational, flexible hours, and compressed workweeks. Each type has specific required fields.',
    }),
    (0, swagger_1.ApiBody)({ type: create_shift_template_dto_1.CreateShiftTemplateDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Shift template created successfully',
        type: shift_template_response_dto_1.ShiftTemplateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data or missing required fields for shift type',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_shift_template_dto_1.CreateShiftTemplateDto]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all shift templates' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of shift templates',
        type: [shift_template_response_dto_1.ShiftTemplateResponseDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shift template by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift template ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift template details',
        type: shift_template_response_dto_1.ShiftTemplateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Shift template not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update shift template' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift template ID' }),
    (0, swagger_1.ApiBody)({ type: update_shift_template_dto_1.UpdateShiftTemplateDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift template updated successfully',
        type: shift_template_response_dto_1.ShiftTemplateResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Shift template not found' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_shift_template_dto_1.UpdateShiftTemplateDto]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete shift template' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift template ID' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Shift template deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Shift template not found' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Cannot delete: active assignments exist',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "remove", null);
exports.ShiftTemplateController = ShiftTemplateController = __decorate([
    (0, swagger_1.ApiTags)('shifts'),
    (0, common_1.Controller)('time-management/shifts'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [shift_template_service_1.ShiftTemplateService])
], ShiftTemplateController);
//# sourceMappingURL=shift-template.controller.js.map