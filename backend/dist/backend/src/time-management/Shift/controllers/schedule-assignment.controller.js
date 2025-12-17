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
exports.ScheduleAssignmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const schedule_assignment_service_1 = require("../services/schedule-assignment.service");
const create_schedule_assignment_dto_1 = require("../dto/create-schedule-assignment.dto");
const bulk_assign_shift_dto_1 = require("../dto/bulk-assign-shift.dto");
const query_assignments_dto_1 = require("../dto/query-assignments.dto");
const update_assignment_status_dto_1 = require("../dto/update-assignment-status.dto");
const schedule_assignment_response_dto_1 = require("../dto/schedule-assignment-response.dto");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_guard_1 = require("../guards/roles.guard");
let ScheduleAssignmentController = class ScheduleAssignmentController {
    scheduleAssignmentService;
    constructor(scheduleAssignmentService) {
        this.scheduleAssignmentService = scheduleAssignmentService;
    }
    async assign(createDto) {
        return await this.scheduleAssignmentService.assign(createDto);
    }
    async bulkAssign(bulkDto) {
        return await this.scheduleAssignmentService.bulkAssign(bulkDto);
    }
    async query(queryDto) {
        return await this.scheduleAssignmentService.query(queryDto);
    }
    async findOne(id) {
        return await this.scheduleAssignmentService.findById(id);
    }
    async updateStatus(id, updateDto) {
        return await this.scheduleAssignmentService.updateStatus(id, updateDto);
    }
};
exports.ScheduleAssignmentController = ScheduleAssignmentController;
__decorate([
    (0, common_1.Post)('shifts/assign'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign shift template to employee/department/position',
    }),
    (0, swagger_1.ApiBody)({ type: create_schedule_assignment_dto_1.CreateScheduleAssignmentDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Assignment created successfully',
        type: schedule_assignment_response_dto_1.ScheduleAssignmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input or validation failed',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Assignment conflicts with existing active assignment',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_schedule_assignment_dto_1.CreateScheduleAssignmentDto]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('shifts/assign/bulk'),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Bulk assign shift template to multiple employees',
        description: 'Assign a shift template to multiple employees, all employees in a department, or all employees with a specific position. Examples provided below.',
    }),
    (0, swagger_1.ApiBody)({
        type: bulk_assign_shift_dto_1.BulkAssignShiftDto,
        examples: {
            'bulk-by-employees': {
                summary: 'Bulk assign to specific employees',
                description: 'Assign shift to multiple specific employees by their IDs',
                value: {
                    shiftTemplateId: '507f1f77bcf86cd799439011',
                    employeeIds: [
                        '507f1f77bcf86cd799439012',
                        '507f1f77bcf86cd799439013',
                        '507f1f77bcf86cd799439014',
                    ],
                    effectiveFrom: '2025-01-01T00:00:00.000Z',
                    effectiveTo: '2025-12-31T23:59:59.000Z',
                    assignedBy: '507f1f77bcf86cd799439015',
                    reason: 'New year shift assignment for customer service team',
                },
            },
            'bulk-by-department': {
                summary: 'Bulk assign to department',
                description: 'Assign shift to all employees in a department',
                value: {
                    shiftTemplateId: '507f1f77bcf86cd799439011',
                    departmentId: '507f1f77bcf86cd799439016',
                    effectiveFrom: '2025-01-01T00:00:00.000Z',
                    effectiveTo: null,
                    assignedBy: '507f1f77bcf86cd799439015',
                    reason: 'Department-wide shift change',
                },
            },
            'bulk-by-position': {
                summary: 'Bulk assign to position',
                description: 'Assign shift to all employees with a specific position',
                value: {
                    shiftTemplateId: '507f1f77bcf86cd799439011',
                    positionId: '507f1f77bcf86cd799439017',
                    effectiveFrom: '2025-01-01T00:00:00.000Z',
                    effectiveTo: '2025-06-30T23:59:59.000Z',
                    assignedBy: '507f1f77bcf86cd799439015',
                    reason: 'Temporary shift for managers during peak season',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Bulk assignment completed',
        schema: {
            type: 'object',
            properties: {
                success: {
                    type: 'number',
                    description: 'Number of successful assignments',
                    example: 5,
                },
                failed: {
                    type: 'number',
                    description: 'Number of failed assignments',
                    example: 1,
                },
                errors: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            employeeId: { type: 'string' },
                            error: { type: 'string' },
                        },
                    },
                    example: [
                        {
                            employeeId: '507f1f77bcf86cd799439018',
                            error: 'Assignment conflicts with existing active assignment',
                        },
                    ],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input - exactly one of employeeIds, departmentId, or positionId must be provided',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_assign_shift_dto_1.BulkAssignShiftDto]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentController.prototype, "bulkAssign", null);
__decorate([
    (0, common_1.Get)('scheduling/assignments'),
    (0, swagger_1.ApiOperation)({ summary: 'Query schedule assignments with filters' }),
    (0, swagger_1.ApiQuery)({
        name: 'employeeId',
        required: false,
        description: 'Filter by employee ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'departmentId',
        required: false,
        description: 'Filter by department ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'positionId',
        required: false,
        description: 'Filter by position ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'shiftTemplateId',
        required: false,
        description: 'Filter by shift template ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'Start date for calendar view',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'to',
        required: false,
        description: 'End date for calendar view',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filter by status (Active, Inactive, Cancelled, Approved, Expired)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of assignments',
        type: [schedule_assignment_response_dto_1.ScheduleAssignmentResponseDto],
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_assignments_dto_1.QueryAssignmentsDto]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentController.prototype, "query", null);
__decorate([
    (0, common_1.Get)('scheduling/assignments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get assignment by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Assignment ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assignment details',
        type: schedule_assignment_response_dto_1.ScheduleAssignmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Assignment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('scheduling/assignments/:id/status'),
    (0, roles_decorator_1.Roles)('HR Manager', 'System Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update assignment status',
        description: 'Update assignment status to Active, Inactive, Cancelled, Approved, or Expired',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Assignment ID' }),
    (0, swagger_1.ApiBody)({ type: update_assignment_status_dto_1.UpdateAssignmentStatusDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assignment status updated successfully',
        type: schedule_assignment_response_dto_1.ScheduleAssignmentResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Assignment not found' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid status or validation failed',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - HR Manager or System Admin role required',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_assignment_status_dto_1.UpdateAssignmentStatusDto]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentController.prototype, "updateStatus", null);
exports.ScheduleAssignmentController = ScheduleAssignmentController = __decorate([
    (0, swagger_1.ApiTags)('assignments'),
    (0, common_1.Controller)('time-management'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [schedule_assignment_service_1.ScheduleAssignmentService])
], ScheduleAssignmentController);
//# sourceMappingURL=schedule-assignment.controller.js.map