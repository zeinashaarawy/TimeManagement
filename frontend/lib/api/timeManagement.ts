import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shift Types
export const shiftTypesApi = {
  getAll: () => api.get('/shifts/types'),
  create: (data: any) => api.post('/shifts/types', data),
  update: (id: string, data: any) => api.put(`/shifts/types/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/types/${id}`),
};

// Shift Assignments
export const shiftAssignmentsApi = {
  getAll: (params?: any) => api.get('/shifts/assignments', { params }),
  create: (data: any) => api.post('/shifts/assignments', data),
  update: (id: string, data: any) => api.put(`/shifts/assignments/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/assignments/${id}`),
  getByEmployee: (employeeId: string) => api.get(`/shifts/assignments/employee/${employeeId}`),
  getByDepartment: (departmentId: string) => api.get(`/shifts/assignments/department/${departmentId}`),
};

// Scheduling Rules
export const schedulingRulesApi = {
  getAll: () => api.get('/scheduling/rules'),
  create: (data: any) => api.post('/scheduling/rules', data),
  update: (id: string, data: any) => api.put(`/scheduling/rules/${id}`, data),
  delete: (id: string) => api.delete(`/scheduling/rules/${id}`),
};

// Shift Expiry Notifications
export const shiftExpiryApi = {
  getNotifications: () => api.get('/shifts/expiry/notifications'),
  acknowledge: (id: string) => api.post(`/shifts/expiry/${id}/acknowledge`),
};

// Attendance/Punch
export const attendanceApi = {
  punchIn: (data: any) => api.post('/attendance/punch/in', data),
  punchOut: (data: any) => api.post('/attendance/punch/out', data),
  getTodayPunches: (employeeId: string) => api.get(`/attendance/punches/${employeeId}/today`),
  getMissedPunches: (employeeId?: string) => api.get('/attendance/missed', { params: { employeeId } }),
};

export default api;

