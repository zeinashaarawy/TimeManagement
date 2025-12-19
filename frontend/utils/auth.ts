/**
 * User Role Types
 * Maps to backend SystemRole enum from employee-profile.enums.ts
 * These values must match exactly with the backend SystemRole enum
 */
export type UserRole = 
  | 'department employee'      // SystemRole.DEPARTMENT_EMPLOYEE
  | 'department head'          // SystemRole.DEPARTMENT_HEAD
  | 'HR Manager'               // SystemRole.HR_MANAGER
  | 'HR Employee'              // SystemRole.HR_EMPLOYEE
  | 'Payroll Specialist'       // SystemRole.PAYROLL_SPECIALIST
  | 'Payroll Manager'           // SystemRole.PAYROLL_MANAGER
  | 'System Admin'             // SystemRole.SYSTEM_ADMIN
  | 'Legal & Policy Admin'      // SystemRole.LEGAL_POLICY_ADMIN
  | 'Recruiter'                // SystemRole.RECRUITER
  | 'Finance Staff'             // SystemRole.FINANCE_STAFF
  | 'Job Candidate'            // SystemRole.JOB_CANDIDATE
  | 'HR Admin'                 // SystemRole.HR_ADMIN
  | string;                    // Allow other roles for flexibility

/**
 * Policy Management Permissions
 */
export interface PolicyPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canActivate: boolean;
  canAssignScope: boolean;
  isReadOnly: boolean;
}

/**
 * Decode JWT token payload (without verification - for client-side use only)
 * In production, token verification should be done on the backend
 */
const decodeJWT = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get current user role from JWT token, localStorage, or URL parameter
 * Priority: JWT Token > localStorage > URL parameter > default
 * 
 * The backend auth service returns: { access_token, payload: { id, role, username } }
 * The role comes from employee.systemRole which matches SystemRole enum
 */
export const getCurrentUserRole = (): UserRole | null => {
  if (typeof window === 'undefined') return null;
  
  // 1. Try to get role from JWT token (production approach)
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded?.role) {
      // Store role in localStorage for quick access (optional optimization)
      localStorage.setItem('userRole', decoded.role);
      return decoded.role as UserRole;
    }
  }
  
  // 2. Check localStorage for stored role (fallback)
  // Check both 'userRole' and 'role' keys for compatibility
  const storedRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  if (storedRole) {
    return storedRole as UserRole;
  }
  
  // 3. Check URL parameter (for testing/demo)
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam) {
    localStorage.setItem('userRole', roleParam);
    return roleParam as UserRole;
  }
  
  // 4. Default role for testing (REMOVE IN PRODUCTION)
  // Only use default if no role is found anywhere
  // In production, return null if no valid auth is found
  if (process.env.NODE_ENV === 'development') {
    // Don't use default if there's a role in localStorage (even if it's 'department employee')
    // This ensures consistency between getCurrentUserRole() and API interceptor
    return null; // Let the API interceptor handle the actual role from localStorage
  }
  
  return null; // No role found - user needs to authenticate
};

/**
 * Get policy management permissions based on user role
 */
export const getPolicyPermissions = (role: UserRole | null): PolicyPermissions => {
  if (!role) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canAssignScope: false,
      isReadOnly: false,
    };
  }

  // Employee: Denied all
  if (role === 'department employee') {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canAssignScope: false,
      isReadOnly: false,
    };
  }

  // Manager: Read-only view
  if (role === 'department head') {
    return {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canAssignScope: false,
      isReadOnly: true,
    };
  }

  // HR Manager: Full access
  if (role === 'HR Manager') {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canActivate: true,
      canAssignScope: true,
      isReadOnly: false,
    };
  }

  // Legal & Policy Admin: Full access (may have policy management permissions)
  if (role === 'Legal & Policy Admin') {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canActivate: true,
      canAssignScope: true,
      isReadOnly: false,
    };
  }

  // System Admin: Full access
  if (role === 'System Admin') {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canActivate: true,
      canAssignScope: true,
      isReadOnly: false,
    };
  }
  
  // HR Admin: Full policy management access (same as HR Manager)
  if (role === 'HR Admin') {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canActivate: true,
      canAssignScope: true,
      isReadOnly: false,
    };
  }

  // HR Employee: Read-only access to policies
  if (role === 'HR Employee') {
    return {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canAssignScope: false,
      isReadOnly: true,
    };
  }

  // Payroll Specialist / Payroll Officer: Read-only access
  if (role === 'Payroll Specialist' || role === 'Payroll Manager') {
    return {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canActivate: false,
      canAssignScope: false,
      isReadOnly: true,
    };
  }

  // Default: No access
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canActivate: false,
    canAssignScope: false,
    isReadOnly: false,
  };
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  role: UserRole | null,
  permission: keyof PolicyPermissions
): boolean => {
  const permissions = getPolicyPermissions(role);
  return permissions[permission] || false;
};

/**
 * Store authentication token and user info after login
 * Call this after successful login with backend auth service
 * 
 * @param accessToken - JWT token from backend auth service
 * @param payload - User payload from backend (optional, will decode from token if not provided)
 * @param useSessionStorage - If true, use sessionStorage instead of localStorage
 */
export const storeAuthToken = (
  accessToken: string,
  payload?: { id: string; role: UserRole; username: string },
  useSessionStorage: boolean = false
): void => {
  if (typeof window === 'undefined') return;
  
  const storage = useSessionStorage ? sessionStorage : localStorage;
  storage.setItem('access_token', accessToken);
  
  // Decode token to get role if payload not provided
  if (!payload) {
    const decoded = decodeJWT(accessToken);
    if (decoded?.role) {
      storage.setItem('userRole', decoded.role);
    }
  } else {
    storage.setItem('userRole', payload.role);
  }
};

/**
 * Clear authentication data (logout)
 */
export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('userRole');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('userRole');
};

/**
 * Get current user info from JWT token
 */
export const getCurrentUser = (): { id: string; role: UserRole; username: string } | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded?.id && decoded?.role) {
      return {
        id: decoded.id,
        role: decoded.role as UserRole,
        username: decoded.username || 'Unknown User',
      };
    }
  }
  
  return null;
};

