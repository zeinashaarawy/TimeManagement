"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const shift_template_service_1 = require("./services/shift-template.service");
const schedule_assignment_service_1 = require("./services/schedule-assignment.service");
const shift_expiry_service_1 = require("./services/shift-expiry.service");
const shift_expiry_scheduler_service_1 = require("./services/shift-expiry-scheduler.service");
const shift_template_controller_1 = require("./controllers/shift-template.controller");
const schedule_assignment_controller_1 = require("./controllers/schedule-assignment.controller");
const shift_expiry_notification_controller_1 = require("./controllers/shift-expiry-notification.controller");
const shift_schema_1 = require("./schemas/shift.schema");
const schedule_assignment_schema_1 = require("./schemas/schedule-assignment.schema");
const shift_expiry_notification_schema_1 = require("./schemas/shift-expiry-notification.schema");
const roles_guard_1 = require("./guards/roles.guard");
let ShiftModule = class ShiftModule {
};
exports.ShiftModule = ShiftModule;
exports.ShiftModule = ShiftModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: shift_schema_1.ShiftTemplate.name, schema: shift_schema_1.ShiftTemplateSchema },
                { name: schedule_assignment_schema_1.ScheduleAssignment.name, schema: schedule_assignment_schema_1.ScheduleAssignmentSchema },
                {
                    name: shift_expiry_notification_schema_1.ShiftExpiryNotification.name,
                    schema: shift_expiry_notification_schema_1.ShiftExpiryNotificationSchema,
                },
            ]),
        ],
        controllers: [
            shift_template_controller_1.ShiftTemplateController,
            schedule_assignment_controller_1.ScheduleAssignmentController,
            shift_expiry_notification_controller_1.ShiftExpiryNotificationController,
        ],
        providers: [
            shift_template_service_1.ShiftTemplateService,
            schedule_assignment_service_1.ScheduleAssignmentService,
            shift_expiry_service_1.ShiftExpiryService,
            shift_expiry_scheduler_service_1.ShiftExpirySchedulerService,
            roles_guard_1.RolesGuard,
        ],
        exports: [
            shift_template_service_1.ShiftTemplateService,
            schedule_assignment_service_1.ScheduleAssignmentService,
            shift_expiry_service_1.ShiftExpiryService,
        ],
    })
], ShiftModule);
//# sourceMappingURL=shift.module.js.map