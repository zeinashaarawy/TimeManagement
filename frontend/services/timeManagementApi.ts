import axios from "axios";

// Base URL - automatically detects hostname when running in browser
// Backend runs on port 5001 (or from env PORT), frontend on port 3001
// This ensures API calls work when accessing via network IP (e.g., 172.20.10.3:3001)
// You can override by setting NEXT_PUBLIC_API_URL in frontend/.env.local
const getBaseURL = (): string => {
  // If NEXT_PUBLIC_API_URL is set, use it (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If running in browser, use current hostname but with backend port (5001 or from env)
  // This works for both localhost and network IPs (e.g., 172.20.10.3)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Backend port defaults to 5001, but can be overridden via env
    // IMPORTANT: Always use port 5001 for backend, not the frontend port
    // Force port 5001 unless explicitly set via environment variable
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '5001';
    const baseURL = `http://${hostname}:${backendPort}`;
    
    // Log for debugging - always log in development
    console.log('[API Config] BASE_URL:', baseURL);
    console.log('[API Config] Frontend URL:', window.location.origin);
    console.log('[API Config] Frontend Port:', window.location.port);
    console.log('[API Config] Backend Port:', backendPort);
    console.log('[API Config] NEXT_PUBLIC_BACKEND_PORT env:', process.env.NEXT_PUBLIC_BACKEND_PORT || 'not set (using default 5001)');
    
    return baseURL;
  }
  
  // Server-side fallback (SSR)
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
};

const BASE_URL = getBaseURL();

// ==========================================
// API INSTANCES - Matching Backend Controllers
// ==========================================

// Request interceptor to serialize Date objects to ISO strings
const serializeDates = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return data.map(serializeDates);
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeDates(data[key]);
      }
    }
    return serialized;
  }
  return data;
};

// Response interceptor for error handling
const handleError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    let message = 'An error occurred';
    const status = error.response.status;
    
    // Check if we got an HTML response (likely a 404 from Next.js frontend)
    const contentType = error.response.headers?.['content-type'] || '';
    if (contentType.includes('text/html') || (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>'))) {
      const requestUrl = error.config?.url || error.config?.baseURL || 'unknown';
      message = `API endpoint not found (404). The request was sent to: ${requestUrl}. ` +
        `This usually means:\n` +
        `1. The backend server is not running (check if it's running on port ${process.env.NEXT_PUBLIC_BACKEND_PORT || '3000'})\n` +
        `2. The API URL is incorrect (current BASE_URL: ${BASE_URL})\n` +
        `3. The endpoint doesn't exist on the backend`;
    }
    
    try {
      // Try to extract message from response data
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          // If response is a string, try to parse it as JSON
          try {
            const parsed = JSON.parse(error.response.data);
            message = parsed.message || parsed.error || message;
          } catch {
            // If parsing fails, use the string as message (but truncate if it's HTML)
            if (error.response.data.includes('<!DOCTYPE html>')) {
              message = 'Received HTML response instead of JSON. Check if backend is running.';
            } else {
              message = error.response.data.substring(0, 200) || message;
            }
          }
        } else if (typeof error.response.data === 'object') {
          message = error.response.data.message || error.response.data.error || message;
        }
      }
    } catch (e) {
      // If anything fails, use default message
      message = error.message || 'An error occurred';
    }
    
    // Attach the formatted message to the error object instead of throwing
    // This allows the component to catch it properly without Next.js catching it as a runtime error
    const formattedMessage = `${message} (Status: ${status})`;
    error.formattedMessage = formattedMessage;
    error.userMessage = message; // Store the clean message without status
    // Don't throw - let the promise rejection handle it
  } else if (error.request) {
    // Request made but no response
    const networkMessage = `Network error: No response from server. ` +
      `Please check if the backend is running on ${BASE_URL}. ` +
      `Make sure the backend server is started with 'npm run start:dev' in the backend directory.`;
    error.userMessage = networkMessage;
    error.formattedMessage = networkMessage;
  } else {
    // Something else happened
    const defaultMessage = error.message || 'An unexpected error occurred';
    error.userMessage = defaultMessage;
    error.formattedMessage = defaultMessage;
  }
  
  // NEVER throw - always attach properties to error object
  // The interceptor will reject the promise, which the component can catch
};

// Time Management API - @Controller('time-management')
const TimeManagementAPI = axios.create({
  baseURL: `${BASE_URL}/time-management`,
});

TimeManagementAPI.interceptors.request.use((config) => {
  // Serialize dates
  if (config.data) {
    config.data = serializeDates(config.data);
  }
  
  // Add authentication headers
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (userId) {
      config.headers = config.headers || {};
      config.headers['x-user-id'] = userId;
    }
    
    if (userRole) {
      config.headers = config.headers || {};
      // Map role formats to match backend expectations
      // Backend uses mixed formats: "HR_ADMIN" (underscore) or "HR Manager" (space)
      // The RolesGuard normalizes both, so we can send either format
      // We'll send the format that matches backend decorators exactly
      const roleMapping: Record<string, string> = {
        // HR roles - backend uses both "HR Manager" and "HR_ADMIN"
        'hr manager': 'HR Manager',  // Matches backend decorator
        'hr_manager': 'HR_ADMIN',   // Matches backend decorator
        'hrmanager': 'HR Manager',
        'hr admin': 'HR_ADMIN',     // Backend uses HR_ADMIN in decorators
        'hr_admin': 'HR_ADMIN',
        'hradmin': 'HR_ADMIN',
        // System Admin - backend uses "SYSTEM_ADMIN"
        'system admin': 'SYSTEM_ADMIN',
        'system_admin': 'SYSTEM_ADMIN',
        'systemadmin': 'SYSTEM_ADMIN',
        // Employee roles
        'employee': 'EMPLOYEE',
        'department employee': 'department employee',
        'department_head': 'department head',
        'departmenthead': 'department head',
        // Payroll roles
        'payroll manager': 'Payroll Manager',
        'payroll_manager': 'Payroll Manager',
        'payroll specialist': 'Payroll Specialist',
        'payroll_specialist': 'Payroll Specialist',
      };
      
      // Normalize input (lowercase, replace underscores/spaces)
      const normalizedInput = userRole.toLowerCase().trim().replace(/_/g, ' ');
      // Map to backend format, or use original if no mapping found
      const mappedRole = roleMapping[normalizedInput] || userRole;
      
      // Log for debugging - always log to help debug 403 errors
      console.log('[API] Role mapping:', {
        original: userRole,
        normalized: normalizedInput,
        mapped: mappedRole,
        url: config.url,
        method: config.method,
      });
      
      config.headers = config.headers || {};
      config.headers['x-user-role'] = mappedRole;
      
      // Also log the final headers being sent
      console.log('[API] Request headers:', {
        'x-user-id': config.headers['x-user-id'],
        'x-user-role': config.headers['x-user-role'],
        'Authorization': config.headers['Authorization'] ? 'Bearer ***' : 'none',
      });
    }
  }
  
  return config;
});

TimeManagementAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    // Handle error and attach user-friendly message
    // This prevents Next.js from catching it as a runtime error
    handleError(error);
    return Promise.reject(error);
  }
);

// Attendance API - @Controller('attendance')
const AttendanceAPI = axios.create({
  baseURL: `${BASE_URL}/attendance`,
});

AttendanceAPI.interceptors.request.use((config) => {
  if (config.data) {
    config.data = serializeDates(config.data);
  }
  return config;
});

AttendanceAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

// Policies API - @Controller('policies')
const PoliciesAPI = axios.create({
  baseURL: `${BASE_URL}/policies`,
});

PoliciesAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

// Reports API - @Controller('reports')
const ReportsAPI = axios.create({
  baseURL: `${BASE_URL}/reports`,
});

ReportsAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

// Payroll API - @Controller('payroll')
const PayrollAPI = axios.create({
  baseURL: `${BASE_URL}/payroll`,
});

PayrollAPI.interceptors.request.use((config) => {
  if (config.data) {
    config.data = serializeDates(config.data);
  }
  return config;
});

PayrollAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

// Leaves API - @Controller() (for calendar/holiday management)
const LeavesAPI = axios.create({
  baseURL: `${BASE_URL}`,
});

LeavesAPI.interceptors.request.use((config) => {
  if (config.data) {
    config.data = serializeDates(config.data);
  }
  return config;
});

LeavesAPI.interceptors.response.use(
  (response) => {
    // Handle empty responses
    if (!response.data && response.status === 200) {
      return { ...response, data: null };
    }
    // Ensure response.data exists
    if (response.data === '' || response.data === undefined) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    handleError(error);
    return Promise.reject(error);
  }
);

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
export const updateAssignmentStatus = (id: string, data: { status: string; reason?: string }) => 
  TimeManagementAPI.patch(`/scheduling/assignments/${id}/status`, data);

/**
 * Renew/Extend assignment
 * PATCH /time-management/scheduling/assignments/:id/renew
 */
export const renewAssignment = (id: string, data: { effectiveTo: string; reason?: string }) =>
  TimeManagementAPI.patch(`/scheduling/assignments/${id}/renew`, data);

/**
 * Get shift expiry notifications
 * GET /time-management/notifications/shifts
 */
export const getShiftExpiryNotifications = (status?: string) => {
  const params = status ? `?status=${status}` : '';
  return TimeManagementAPI.get(`/notifications/shifts${params}`);
};

/**
 * Manually trigger expiry detection
 * POST /time-management/notifications/shifts/detect
 */
export const triggerExpiryDetection = (daysBeforeExpiry?: number) => {
  const params = daysBeforeExpiry ? `?daysBeforeExpiry=${daysBeforeExpiry}` : '';
  return TimeManagementAPI.post(`/notifications/shifts/detect${params}`);
};

/**
 * Resolve shift expiry notification
 * PATCH /time-management/notifications/shifts/:id/resolve
 */
export const resolveShiftExpiryNotification = (id: string, data: { resolutionNotes?: string }) =>
  TimeManagementAPI.patch(`/notifications/shifts/${id}/resolve`, data);

// ==========================================
// SCHEDULING RULES ENDPOINTS
// @Controller('scheduling-rules')
// ==========================================

/**
 * Get all scheduling rules
 * GET /time-management/scheduling-rules
 */
export const getSchedulingRules = () => TimeManagementAPI.get("/scheduling-rules");

/**
 * Get scheduling rule by ID
 * GET /time-management/scheduling-rules/:id
 */
export const getSchedulingRule = (id: string) => TimeManagementAPI.get(`/scheduling-rules/${id}`);

/**
 * Create a new scheduling rule
 * POST /time-management/scheduling-rules
 */
export const createSchedulingRule = (data: any) => TimeManagementAPI.post("/scheduling-rules", data);

/**
 * Update a scheduling rule
 * PATCH /time-management/scheduling-rules/:id
 */
export const updateSchedulingRule = (id: string, data: any) => 
  TimeManagementAPI.patch(`/scheduling-rules/${id}`, data);

/**
 * Toggle scheduling rule active status
 * PATCH /time-management/scheduling-rules/:id/toggle-active
 */
export const toggleSchedulingRuleActive = (id: string) => 
  TimeManagementAPI.patch(`/scheduling-rules/${id}/toggle-active`);

/**
 * Delete a scheduling rule
 * DELETE /time-management/scheduling-rules/:id
 */
export const deleteSchedulingRule = (id: string) => TimeManagementAPI.delete(`/scheduling-rules/${id}`);

// Export scheduling rules API object for convenience
export const schedulingRulesApi = {
  getAll: getSchedulingRules,
  getById: getSchedulingRule,
  create: createSchedulingRule,
  update: updateSchedulingRule,
  toggleActive: toggleSchedulingRuleActive,
  delete: deleteSchedulingRule,
};

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
