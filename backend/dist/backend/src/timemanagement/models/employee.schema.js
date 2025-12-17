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
exports.EmployeeSchema = exports.Employee = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Employee = class Employee {
    employeeId;
    firstName;
    lastName;
    email;
    phoneNumber;
    address;
    departmentId;
    positionId;
    shiftIds;
};
exports.Employee = Employee;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Employee.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Employee.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Employee.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Employee.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Employee.prototype, "positionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: [] }),
    __metadata("design:type", Array)
], Employee.prototype, "shiftIds", void 0);
exports.Employee = Employee = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Employee);
exports.EmployeeSchema = mongoose_1.SchemaFactory.createForClass(Employee);
//# sourceMappingURL=employee.schema.js.map