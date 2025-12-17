export var CorrectionRequestStatus;
(function (CorrectionRequestStatus) {
    CorrectionRequestStatus["SUBMITTED"] = "SUBMITTED";
    CorrectionRequestStatus["IN_REVIEW"] = "IN_REVIEW";
    CorrectionRequestStatus["APPROVED"] = "APPROVED";
    CorrectionRequestStatus["REJECTED"] = "REJECTED";
    CorrectionRequestStatus["ESCALATED"] = "ESCALATED";
})(CorrectionRequestStatus || (CorrectionRequestStatus = {}));
export var PunchType;
(function (PunchType) {
    PunchType["IN"] = "IN";
    PunchType["OUT"] = "OUT";
})(PunchType || (PunchType = {}));
export var HolidayType;
(function (HolidayType) {
    HolidayType["NATIONAL"] = "NATIONAL";
    HolidayType["ORGANIZATIONAL"] = "ORGANIZATIONAL";
    HolidayType["WEEKLY_REST"] = "WEEKLY_REST";
})(HolidayType || (HolidayType = {}));
export var ShiftAssignmentStatus;
(function (ShiftAssignmentStatus) {
    ShiftAssignmentStatus["PENDING"] = "PENDING";
    ShiftAssignmentStatus["APPROVED"] = "APPROVED";
    ShiftAssignmentStatus["CANCELLED"] = "CANCELLED";
    ShiftAssignmentStatus["EXPIRED"] = "EXPIRED";
})(ShiftAssignmentStatus || (ShiftAssignmentStatus = {}));
export var PunchPolicy;
(function (PunchPolicy) {
    PunchPolicy["MULTIPLE"] = "MULTIPLE";
    PunchPolicy["FIRST_LAST"] = "FIRST_LAST";
    PunchPolicy["ONLY_FIRST"] = "ONLY_FIRST";
})(PunchPolicy || (PunchPolicy = {}));
export var TimeExceptionType;
(function (TimeExceptionType) {
    TimeExceptionType["MISSED_PUNCH"] = "MISSED_PUNCH";
    TimeExceptionType["LATE"] = "LATE";
    TimeExceptionType["EARLY_LEAVE"] = "EARLY_LEAVE";
    TimeExceptionType["SHORT_TIME"] = "SHORT_TIME";
    TimeExceptionType["OVERTIME_REQUEST"] = "OVERTIME_REQUEST";
    TimeExceptionType["MANUAL_ADJUSTMENT"] = "MANUAL_ADJUSTMENT";
})(TimeExceptionType || (TimeExceptionType = {}));
export var TimeExceptionStatus;
(function (TimeExceptionStatus) {
    TimeExceptionStatus["OPEN"] = "OPEN";
    TimeExceptionStatus["PENDING"] = "PENDING";
    TimeExceptionStatus["APPROVED"] = "APPROVED";
    TimeExceptionStatus["REJECTED"] = "REJECTED";
    TimeExceptionStatus["ESCALATED"] = "ESCALATED";
    TimeExceptionStatus["RESOLVED"] = "RESOLVED";
})(TimeExceptionStatus || (TimeExceptionStatus = {}));
//# sourceMappingURL=enums.js.map