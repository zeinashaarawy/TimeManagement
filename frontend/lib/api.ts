import axios from 'axios';

// Auto-detect API URL based on current hostname
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If running in browser, use current hostname with port 5001
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing via network IP (172.x.x.x), use that IP for backend too
    if (hostname.startsWith('172.') || hostname.startsWith('192.') || hostname.startsWith('10.')) {
      return `http://${hostname}:5001`;
    }
  }
  
  // Default to localhost
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

// Log API base URL for debugging
if (typeof window !== 'undefined') {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor if needed
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For Phase 1 development: Always add mock user headers
  // TODO: Remove this when real authentication is implemented
  config.headers = config.headers || {};
  
  // Helper: Convert dev user string to valid ObjectId format
  // "dev-user-123" -> valid 24-char hex ObjectId
  const getDevUserId = (userId: string | null): string => {
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      // Already a valid ObjectId
      return userId;
    }
    // Use a consistent valid 24-character hex ObjectId for dev-user-123
    // This is a valid MongoDB ObjectId format (24 hex characters)
    return '646576757365723132330000'; // Valid 24-char hex ObjectId for dev-user-123
  };
  
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('userId');
    config.headers['x-user-id'] = getDevUserId(userId);
    // Backend expects 'HR_ADMIN' or 'SYSTEM_ADMIN' (uppercase with underscores)
    config.headers['x-user-role'] = localStorage.getItem('userRole') || 'SYSTEM_ADMIN';
  } else {
    // Server-side: still set headers for SSR compatibility
    config.headers['x-user-id'] = '646576757365723132330000';
    config.headers['x-user-role'] = 'SYSTEM_ADMIN';
  }
  
  return config;
});

// Response interceptor - removed the 500 error hiding for expiry notifications
// Now we'll see the actual errors to fix them properly
api.interceptors.response.use(
  (response) => response, // Success - pass through
  (error) => {
    // Log errors for debugging
    if (error.response?.status === 500) {
      console.error('Backend 500 error:', error.config?.url, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Shift Template APIs
export const shiftTemplateApi = {
  getAll: () => api.get('/time-management/shifts'),
  getById: (id: string) => api.get(`/time-management/shifts/${id}`),
  create: (data: any) => api.post('/time-management/shifts', data),
  update: (id: string, data: any) => api.patch(`/time-management/shifts/${id}`, data),
  delete: (id: string) => api.delete(`/time-management/shifts/${id}`),
};

// Shift Assignment APIs
export const shiftAssignmentApi = {
  assign: (data: any) => api.post('/time-management/shifts/assign', data),
  bulkAssign: (data: any) => api.post('/time-management/shifts/assign/bulk', data),
  query: (params: any) => api.get('/time-management/scheduling/assignments', { params }),
  getById: (id: string) => api.get(`/time-management/scheduling/assignments/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/time-management/scheduling/assignments/${id}/status`, data),
  renew: (id: string, data: any) => api.patch(`/time-management/scheduling/assignments/${id}/renew`, data),
};

// Shift Expiry Notification APIs
export const shiftExpiryApi = {
  getNotifications: (status?: string) => api.get('/time-management/notifications/shifts', { params: status ? { status } : {} }),
  triggerDetection: (daysBeforeExpiry?: number) => api.post('/time-management/notifications/shifts/detect', {}, { params: daysBeforeExpiry ? { daysBeforeExpiry } : {} }),
  resolve: (id: string, data: any) => api.patch(`/time-management/notifications/shifts/${id}/resolve`, data),
};

// Scheduling Rules APIs
export const schedulingRulesApi = {
  getAll: () => api.get('/time-management/scheduling-rules'),
  getById: (id: string) => api.get(`/time-management/scheduling-rules/${id}`),
  create: (data: any) => api.post('/time-management/scheduling-rules', data),
  update: (id: string, data: any) => api.patch(`/time-management/scheduling-rules/${id}`, data),
  toggleActive: (id: string) => api.patch(`/time-management/scheduling-rules/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/time-management/scheduling-rules/${id}`),
};

export default api;
