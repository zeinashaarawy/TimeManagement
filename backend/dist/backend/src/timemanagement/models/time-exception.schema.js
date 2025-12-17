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
exports.TimeExceptionSchema = exports.TimeException = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let TimeException = class TimeException {
    employeeId;
    type;
    requestDate;
    status;
    resolvedBy;
    notes;
};
exports.TimeException = TimeException;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TimeException.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TimeException.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], TimeException.prototype, "requestDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TimeException.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TimeException.prototype, "resolvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], TimeException.prototype, "notes", void 0);
exports.TimeException = TimeException = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TimeException);
exports.TimeExceptionSchema = mongoose_1.SchemaFactory.createForClass(TimeException);
//# sourceMappingURL=time-exception.schema.js.map