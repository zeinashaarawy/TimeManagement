import axios from "axios";

// Base URL - automatically detects hostname when running in browser
// Backend runs on port 4000, frontend on port 3000
// This ensures API calls work when accessing via network IP (e.g., 172.20.10.3:3000)
// You can override by setting NEXT_PUBLIC_API_URL in frontend/.env.local
const getBaseURL = (): string => {
  // If NEXT_PUBLIC_API_URL is set, use it (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If running in browser, use current hostname but with backend port (4000)
  // This works for both localhost and network IPs (e.g., 172.20.10.3)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:4000`;
  }
  
  // Server-side fallback (SSR)
  return "http://localhost:4000";
};

const BASE_URL = getBaseURL();

// ==========================================
// API INSTANCES - Matching Backend Controllers
// ==========================================

// Time Management API - @Controller('time-management')
const TimeManagementAPI = axios.create({
  baseURL: `${BASE_URL}/time-management`,
});

// Attendance API - @Controller('attendance')
const AttendanceAPI = axios.create({
  baseURL: `${BASE_URL}/attendance`,
});

// Policies API - @Controller('policies')
const PoliciesAPI = axios.create({
  baseURL: `${BASE_URL}/policies`,
});

// Reports API - @Controller('reports')
const ReportsAPI = axios.create({
  baseURL: `${BASE_URL}/reports`,
});

// Payroll API - @Controller('payroll')
const PayrollAPI = axios.create({
  baseURL: `${BASE_URL}/payroll`,
});

// Leaves API - @Controller() (for calendar/holiday management)
const LeavesAPI = axios.create({
  baseURL: `${BASE_URL}`,
});

// ==========================================
// TIME MANAGEMENT ENDPOINTS
// @Controller('time-management')
// ==========================================

/**
 * Record a punch (clock in/out)
 * POST /time-management/punch
 */
export const recordPunch = (data: {
  employeeId: string;
  timestamp: Date | string;
  type: 'IN' | 'OUT';
  device?: string;
  location?: string;
}) => TimeManagementAPI.post("/punch", data);

/**
 * Get attendance record for an employee
 * GET /time-management/attendance/:employeeId
 */
export const getAttendance = (employeeId: string, date?: string) => {
  const params = date ? `?date=${date}` : '';
  return TimeManagementAPI.get(`/attendance/${employeeId}${params}`);
};

/**
 * Correct attendance record
 * POST /time-management/attendance/correct
 */
export const correctAttendance = (data: {
  employeeId: string;
  date: string;
  punches: Array<{ type: 'IN' | 'OUT'; timestamp: string }>;
}) => TimeManagementAPI.post("/attendance/correct", data);

/**
 * Detect missed punches
 * POST /time-management/attendance/detect-missed
 */
export const detectMissedPunch = (data: {
  employeeId: string;
  date: string;
}) => TimeManagementAPI.post("/attendance/detect-missed", data);

/**
 * Get notifications for an employee
 * GET /time-management/notifications/:employeeId
 */
export const getNotifications = (employeeId: string) => 
  TimeManagementAPI.get(`/notifications/${employeeId}`);

/**
 * Get all exceptions with optional filters (for managers)
 * GET /time-management/exceptions
 */
export const getAllExceptions = (filters?: {
  status?: string;
  assignedTo?: string;
  employeeId?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  
  const queryString = params.toString();
  return TimeManagementAPI.get(`/exceptions${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get exceptions for a specific employee
 * GET /time-management/exceptions/:employeeId
 */
export const getEmployeeExceptions = (employeeId: string) => 
  TimeManagementAPI.get(`/exceptions/${employeeId}`);

/**
 * Create a time exception manually
 * POST /time-management/exceptions
 */
export const createException = (data: {
  employeeId: string;
  recordId: string;
  reason: string;
  assignedToId: string;
  type?: string;
}) => TimeManagementAPI.post("/exceptions", data);

/**
 * Approve a time exception
 * POST /time-management/exceptions/:id/approve
 */
export const approveException = (exceptionId: string, data: {
  approvedBy: string;
  notes?: string;
}) => TimeManagementAPI.post(`/exceptions/${exceptionId}/approve`, data);

/**
 * Reject a time exception
 * POST /time-management/exceptions/:id/reject
 */
export const rejectException = (exceptionId: string, data: {
  rejectedBy: string;
  reason?: string;
}) => TimeManagementAPI.post(`/exceptions/${exceptionId}/reject`, data);

/**
 * Escalate a time exception
 * POST /time-management/exceptions/:id/escalate
 */
export const escalateException = (exceptionId: string, data: {
  escalatedTo: string;
  reason?: string;
}) => TimeManagementAPI.post(`/exceptions/${exceptionId}/escalate`, data);

/**
 * Get all shift templates
 * GET /time-management/shifts
 */
export const getShiftTemplates = () => TimeManagementAPI.get("/shifts");

/**
 * Get shift template by ID
 * GET /time-management/shifts/:id
 */
export const getShiftTemplate = (id: string) => TimeManagementAPI.get(`/shifts/${id}`);

/**
 * Create a new shift template
 * POST /time-management/shifts
 */
export const createShiftTemplate = (data: any) => TimeManagementAPI.post("/shifts", data);

/**
 * Update a shift template
 * PATCH /time-management/shifts/:id
 */
export const updateShiftTemplate = (id: string, data: any) => 
  TimeManagementAPI.patch(`/shifts/${id}`, data);

/**
 * Delete a shift template
 * DELETE /time-management/shifts/:id
 */
export const deleteShiftTemplate = (id: string) => TimeManagementAPI.delete(`/shifts/${id}`);

/**
 * Assign shift template to employee/department/position
 * POST /time-management/shifts/assign
 */
export const assignShift = (data: any) => TimeManagementAPI.post("/shifts/assign", data);

/**
 * Bulk assign shift template
 * POST /time-management/shifts/assign/bulk
 */
export const bulkAssignShift = (data: any) => TimeManagementAPI.post("/shifts/assign/bulk", data);

/**
 * Query schedule assignments with filters
 * GET /time-management/scheduling/assignments
 */
export const getAssignments = (filters?: {
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  shiftTemplateId?: string;
  from?: string;
  to?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.positionId) params.append('positionId', filters.positionId);
  if (filters?.shiftTemplateId) params.append('shiftTemplateId', filters.shiftTemplateId);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return TimeManagementAPI.get(`/scheduling/assignments${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get assignment by ID
 * GET /time-management/scheduling/assignments/:id
 */
export const getAssignment = (id: string) => 
  TimeManagementAPI.get(`/scheduling/assignments/${id}`);

/**
 * Update assignment status
 * PATCH /time-management/scheduling/assignments/:id/status
 */
export const updateAssignmentStatus = (id: string, data: { status: string }) => 
  TimeManagementAPI.patch(`/scheduling/assignments/${id}/status`, data);

// ==========================================
// ATTENDANCE ENDPOINTS (Alternative)
// @Controller('attendance')
// ==========================================

/**
 * Record a punch via AttendanceController
 * POST /attendance/punch
 */
export const recordPunchViaAttendance = (data: {
  employeeId: string;
  timestamp: Date | string;
  type: 'IN' | 'OUT';
  device?: string;
  location?: string;
}) => AttendanceAPI.post("/punch", data);

/**
 * Get attendance via AttendanceController
 * GET /attendance/:employeeId
 */
export const getAttendanceViaAttendance = (employeeId: string, date?: string) => {
  const params = date ? `?date=${date}` : '';
  return AttendanceAPI.get(`/${employeeId}${params}`);
};

// ==========================================
// POLICIES ENDPOINTS
// @Controller('policies')
// ==========================================

/**
 * Get all policies with optional filters
 * GET /policies
 */
export const getPolicies = (filters?: {
  scope?: string;
  active?: boolean;
  departmentId?: string;
  employeeId?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.scope) params.append('scope', filters.scope);
  if (filters?.active !== undefined) params.append('active', String(filters.active));
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  
  const queryString = params.toString();
  return PoliciesAPI.get(`${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get policy by ID
 * GET /policies/:id
 */
export const getPolicy = (id: string) => PoliciesAPI.get(`/${id}`);

/**
 * Create a new policy
 * POST /policies
 */
export const createPolicy = (data: any) => PoliciesAPI.post("", data);

/**
 * Update a policy
 * PUT /policies/:id
 */
export const updatePolicy = (id: string, data: any) => PoliciesAPI.put(`/${id}`, data);

/**
 * Update policies (legacy - uses POST, but backend uses PUT for updates)
 * @deprecated Use updatePolicy instead
 */
export const updatePolicies = (data: any) => PoliciesAPI.post("", data);

/**
 * Delete a policy
 * DELETE /policies/:id
 */
export const deletePolicy = (id: string) => PoliciesAPI.delete(`/${id}`);

/**
 * Assign policy to employee
 * POST /policies/:id/assign/employee
 */
export const assignPolicyToEmployee = (policyId: string, employeeId: string) => 
  PoliciesAPI.post(`/${policyId}/assign/employee`, { employeeId });

/**
 * Assign policy to department
 * POST /policies/:id/assign/department
 */
export const assignPolicyToDepartment = (policyId: string, departmentId: string) => 
  PoliciesAPI.post(`/${policyId}/assign/department`, { departmentId });

/**
 * Compute policy results for an attendance record
 * POST /policies/compute/:attendanceRecordId
 */
export const computePolicyResults = (
  attendanceRecordId: string,
  data: {
    recordDate: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    scheduledMinutes?: number;
  }
) => PoliciesAPI.post(`/compute/${attendanceRecordId}`, data);

// ==========================================
// REPORTS ENDPOINTS
// @Controller('reports')
// ==========================================

/**
 * Get attendance report
 * GET /reports/attendance
 */
export const getAttendanceReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  includeExceptions?: boolean;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.includeExceptions !== undefined) params.append('includeExceptions', String(filters.includeExceptions));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  return ReportsAPI.get(`/attendance${queryString ? `?${queryString}` : ''}`);
};

/**
 * Export attendance report as CSV
 * GET /reports/attendance/export
 * Returns URL string for window.open()
 */
export const exportAttendanceReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const queryString = params.toString();
  return `${BASE_URL}/reports/attendance/export${queryString ? `?${queryString}` : ''}`;
};

/**
 * Get overtime report
 * GET /reports/overtime
 */
export const getOvertimeReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  return ReportsAPI.get(`/overtime${queryString ? `?${queryString}` : ''}`);
};

/**
 * Export overtime report as CSV
 * GET /reports/overtime/export
 * Returns URL string for window.open()
 */
export const exportOvertimeReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return `${BASE_URL}/reports/overtime/export${queryString ? `?${queryString}` : ''}`;
};

/**
 * Get penalty report
 * GET /reports/penalties
 */
export const getPenaltyReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  return ReportsAPI.get(`/penalties${queryString ? `?${queryString}` : ''}`);
};

/**
 * Export penalty report as CSV
 * GET /reports/penalties/export
 * Returns URL string for window.open()
 */
export const exportPenaltyReport = (filters?: {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.departmentId) params.append('departmentId', filters.departmentId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return `${BASE_URL}/reports/penalties/export${queryString ? `?${queryString}` : ''}`;
};

/**
 * Get reports (legacy endpoint)
 * @deprecated Use specific report functions instead
 */
export const getReports = () => ReportsAPI.get("");

// ==========================================
// PAYROLL ENDPOINTS
// @Controller('payroll')
// ==========================================

/**
 * Sync payroll data
 * POST /payroll/sync
 */
export const syncPayroll = (data: {
  periodStart: string;
  periodEnd: string;
  employeeIds?: string[];
  initiatedBy?: string;
}) => PayrollAPI.post("/sync", data);

/**
 * Get payroll sync status
 * GET /payroll/sync-status/:id
 */
export const getPayrollSyncStatus = (id: string) => PayrollAPI.get(`/sync-status/${id}`);

/**
 * Retry payroll sync
 * POST /payroll/sync/:id/retry
 */
export const retryPayrollSync = (id: string) => PayrollAPI.post(`/sync/${id}/retry`);

/**
 * Validate pre-payroll data
 * POST /payroll/pre-payroll/validate
 */
export const validatePrePayroll = (data: {
  periodStart: string;
  periodEnd: string;
}) => PayrollAPI.post("/pre-payroll/validate", data);

/**
 * Run pre-payroll closure
 * POST /payroll/pre-payroll/closure
 */
export const runPrePayrollClosure = (data: {
  periodStart: string;
  periodEnd: string;
  escalationDeadlineHours?: number;
}) => PayrollAPI.post("/pre-payroll/closure", data);

/**
 * Generate payroll payload
 * GET /payroll/payload
 */
export const generatePayrollPayload = (filters: {
  periodStart: string;
  periodEnd: string;
  employeeIds?: string;
}) => {
  const params = new URLSearchParams();
  params.append('periodStart', filters.periodStart);
  params.append('periodEnd', filters.periodEnd);
  if (filters.employeeIds) params.append('employeeIds', filters.employeeIds);
  
  return PayrollAPI.get(`/payload?${params.toString()}`);
};

// ==========================================
// LEGACY/COMPATIBILITY ENDPOINTS
// ==========================================

/**
 * Get violations (legacy)
 * @deprecated Use getEmployeeExceptions or getAllExceptions instead
 */
export const getViolations = () => TimeManagementAPI.get("/attendance/violations");

/**
 * Get corrections (legacy)
 * @deprecated Use getEmployeeExceptions or getAllExceptions instead
 */
export const getCorrections = () => TimeManagementAPI.get("/attendance/corrections");

// ==========================================
// HOLIDAY & CALENDAR ENDPOINTS
// @Controller() (Leaves module)
// ==========================================

/**
 * Create calendar for a year
 * POST /calendar
 */
export const createCalendar = (data: {
  year: number;
  holidays?: Array<{
    date: string;
    name: string;
    type: string;
    isRecurring?: boolean;
  }>;
  blockedPeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
  }>;
  workingDays?: number[];
  isActive?: boolean;
}) => LeavesAPI.post("/calendar", data);

/**
 * Get calendar by year
 * GET /calendar/:year
 */
export const getCalendar = (year: number) => LeavesAPI.get(`/calendar/${year}`);

/**
 * Get all calendars
 * GET /calendar
 */
export const getAllCalendars = () => LeavesAPI.get("/calendar");

/**
 * Update calendar
 * PATCH /calendar/:year
 */
export const updateCalendar = (year: number, data: {
  holidays?: Array<{
    date: string;
    name: string;
    type: string;
    isRecurring?: boolean;
  }>;
  blockedPeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
  }>;
  workingDays?: number[];
  isActive?: boolean;
}) => LeavesAPI.patch(`/calendar/${year}`, data);

/**
 * Delete calendar
 * DELETE /calendar/:year
 */
export const deleteCalendar = (year: number) => LeavesAPI.delete(`/calendar/${year}`);

/**
 * Add blocked period to calendar
 * POST /calendar/:year/blocked-period
 */
export const addBlockedPeriod = (year: number, data: {
  startDate: string;
  endDate: string;
  reason: string;
}) => LeavesAPI.post(`/calendar/${year}/blocked-period`, data);

/**
 * Remove blocked period from calendar
 * DELETE /calendar/:year/blocked-period/:index
 */
export const removeBlockedPeriod = (year: number, index: number) => 
  LeavesAPI.delete(`/calendar/${year}/blocked-period/${index}`);
