import React, { useState, useEffect } from 'react';
import { 
  assignShift, 
  bulkAssignShift, 
  getAssignments, 
  updateAssignmentStatus, 
  renewAssignment,
  getShiftTemplates 
} from '../../../services/timeManagementApi';
import { getCurrentUserRole, getCurrentUser } from '../../../utils/auth';
import api from '../../../api/axios';

interface ShiftAssignment {
  _id?: string;
  shiftTemplateId: string | { _id: string; name: string; type: string };
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ShiftTemplate {
  _id: string;
  name: string;
  type: string;
}

export default function ShiftsAssignments() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(null);
  const [formData, setFormData] = useState({
    shiftTemplateId: '',
    assignmentType: 'individual' as 'individual' | 'department' | 'position',
    employeeId: '',
    departmentId: '',
    positionId: '',
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  });
  const [bulkFormData, setBulkFormData] = useState({
    shiftTemplateId: '',
    assignmentType: 'department' as 'department' | 'position',
    departmentId: '',
    positionId: '',
    employeeIds: [] as string[],
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  });
  const [filters, setFilters] = useState({
    status: '',
    employeeId: '',
    departmentId: '',
    positionId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // For dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  // Employee profile for regular employees
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  
  // Get current user info
  const currentUser = getCurrentUser();
  const currentUserRole = getCurrentUserRole();
  const isRegularEmployee = currentUserRole && !['HR Manager', 'System Admin', 'HR Admin', 'Payroll Manager', 'Payroll Specialist', 'department head'].includes(currentUserRole);
  
  // Get employee ID - try multiple sources
  const getEmployeeId = () => {
    // Try from getCurrentUser first (from JWT token)
    if (currentUser?.id) {
      return currentUser.id;
    }
    // Fallback to localStorage userId (set during login)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || null;
    }
    return null;
  };
  
  const employeeId = getEmployeeId();
  
  // Load employee profile for regular employees to get department and position
  useEffect(() => {
    const loadEmployeeProfile = async () => {
      if (isRegularEmployee && employeeId) {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get('/employee-profile/profile/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEmployeeProfile(res.data);
          console.log('[Shift Assignments] Loaded employee profile:', res.data);
        } catch (err) {
          console.error('[Shift Assignments] Failed to load employee profile:', err);
        }
      }
    };
    loadEmployeeProfile();
  }, [isRegularEmployee, employeeId]);

  // Initialize filters for regular employees (only once on mount)
  useEffect(() => {
    // If user is a regular employee, automatically filter by their employee ID
    if (isRegularEmployee && employeeId) {
      console.log('[Shift Assignments] Regular employee detected, filtering by employee ID:', employeeId);
      setFilters(prev => {
        // Only set if not already set to avoid unnecessary re-renders
        if (prev.employeeId !== employeeId) {
          return {
            ...prev,
            employeeId: employeeId,
          };
        }
        return prev;
      });
    } else if (isRegularEmployee && !employeeId) {
      console.warn('[Shift Assignments] Regular employee but no employee ID found');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    loadData();
    loadDropdowns(); // Load dropdowns on component mount
  }, [filters]);
  
  // Reload data when employee profile is loaded (for regular employees)
  useEffect(() => {
    if (isRegularEmployee && employeeProfile && employeeId) {
      console.log('[Shift Assignments] Employee profile loaded, reloading assignments');
      loadData();
    }
  }, [employeeProfile]);

  // Load departments and employees when modals open
  useEffect(() => {
    if (showModal || showBulkModal) {
      loadDropdowns();
    }
  }, [showModal, showBulkModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      let allAssignments: any[] = [];
      
      if (isRegularEmployee && employeeId) {
        // For regular employees, fetch assignments from multiple sources:
        // 1. Direct employee assignments (always try this first)
        // 2. Department assignments (if employee has a department)
        // 3. Position assignments (if employee has a position)
        
        console.log('[Shift Assignments] ===== Loading assignments for employee =====');
        console.log('[Shift Assignments] Employee ID:', employeeId);
        console.log('[Shift Assignments] Employee profile:', employeeProfile);
        
        const departmentId = employeeProfile?.primaryDepartmentId?._id || employeeProfile?.primaryDepartmentId;
        const positionId = employeeProfile?.primaryPositionId?._id || employeeProfile?.primaryPositionId;
        
        console.log('[Shift Assignments] Department ID:', departmentId);
        console.log('[Shift Assignments] Position ID:', positionId);
        
        // Fetch all possible assignments
        const promises: Promise<any>[] = [];
        
        // ALWAYS try direct employee assignment first (even without profile)
        console.log('[Shift Assignments] Fetching direct employee assignments...');
        promises.push(
          getAssignments({ employeeId })
            .then(res => {
              console.log('[Shift Assignments] Direct employee assignments result:', res.data);
              return res;
            })
            .catch(err => {
              console.error('[Shift Assignments] Error fetching employee assignments:', err);
              console.error('[Shift Assignments] Error details:', err.response?.data || err.message);
              return { data: [] };
            })
        );
        
        // Department assignments (only if we have department ID)
        if (departmentId) {
          console.log('[Shift Assignments] Fetching department assignments...');
          promises.push(
            getAssignments({ departmentId })
              .then(res => {
                console.log('[Shift Assignments] Department assignments result:', res.data);
                return res;
              })
              .catch(err => {
                console.error('[Shift Assignments] Error fetching department assignments:', err);
                return { data: [] };
              })
          );
        } else {
          console.log('[Shift Assignments] No department ID, skipping department assignments');
        }
        
        // Position assignments (only if we have position ID)
        if (positionId) {
          console.log('[Shift Assignments] Fetching position assignments...');
          promises.push(
            getAssignments({ positionId })
              .then(res => {
                console.log('[Shift Assignments] Position assignments result:', res.data);
                return res;
              })
              .catch(err => {
                console.error('[Shift Assignments] Error fetching position assignments:', err);
                return { data: [] };
              })
          );
        } else {
          console.log('[Shift Assignments] No position ID, skipping position assignments');
        }
        
        const results = await Promise.all(promises);
        console.log('[Shift Assignments] All query results:', results);
        
        // Combine all assignments and remove duplicates
        const assignmentMap = new Map();
        results.forEach((result, index) => {
          const assignments = result.data || [];
          console.log(`[Shift Assignments] Source ${index} returned ${assignments.length} assignments`);
          assignments.forEach((assignment: any) => {
            // Use _id as key to avoid duplicates
            if (assignment._id) {
              assignmentMap.set(assignment._id.toString(), assignment);
            } else {
              console.warn('[Shift Assignments] Assignment without _id:', assignment);
            }
          });
        });
        
        allAssignments = Array.from(assignmentMap.values());
        console.log('[Shift Assignments] ===== Combined assignments:', allAssignments.length, 'total =====');
        console.log('[Shift Assignments] Assignment details:', allAssignments);
        
        // FALLBACK: If no assignments found, try fetching ALL assignments to see if any exist
        if (allAssignments.length === 0) {
          console.warn('[Shift Assignments] ⚠️ No assignments found with filters. Trying fallback: fetch ALL assignments...');
          try {
            const allAssignmentsRes = await getAssignments({});
            const allAssignmentsList = allAssignmentsRes.data || [];
            console.log('[Shift Assignments] Fallback: Total assignments in system:', allAssignmentsList.length);
            console.log('[Shift Assignments] Fallback: All assignments:', allAssignmentsList);
            
            if (allAssignmentsList.length > 0) {
              // Filter manually to find matches
              const matchingAssignments = allAssignmentsList.filter((assignment: any) => {
                const empId = assignment.employeeId?.toString();
                const deptId = assignment.departmentId?.toString();
                const posId = assignment.positionId?.toString();
                
                const matchesEmployee = empId === employeeId?.toString();
                const matchesDept = departmentId && deptId === departmentId.toString();
                const matchesPos = positionId && posId === positionId.toString();
                
                console.log('[Shift Assignments] Checking assignment:', {
                  assignmentId: assignment._id,
                  empId,
                  deptId,
                  posId,
                  matchesEmployee,
                  matchesDept,
                  matchesPos,
                  ourEmployeeId: employeeId?.toString(),
                  ourDeptId: departmentId?.toString(),
                  ourPosId: positionId?.toString()
                });
                
                return matchesEmployee || matchesDept || matchesPos;
              });
              
              console.log('[Shift Assignments] Fallback: Matching assignments found:', matchingAssignments.length);
              if (matchingAssignments.length > 0) {
                allAssignments = matchingAssignments;
                console.log('[Shift Assignments] ✅ Using fallback matching assignments');
              } else {
                console.warn('[Shift Assignments] ❌ No matching assignments found even in fallback');
                // Don't show all assignments - keep it empty so user knows they have none
                allAssignments = [];
              }
            } else {
              console.warn('[Shift Assignments] ❌ No assignments exist in the system at all');
            }
          } catch (fallbackErr: any) {
            console.error('[Shift Assignments] Fallback query failed:', fallbackErr);
            console.error('[Shift Assignments] Fallback error details:', fallbackErr.response?.data);
          }
        }
        
        // Also load templates
        const templatesRes = await getShiftTemplates();
        setTemplates(templatesRes.data || []);
      } else {
        // For admin/HR users, use normal filters
        console.log('[Shift Assignments] Loading assignments for admin/HR user with filters:', filters);
        const [assignmentsRes, templatesRes] = await Promise.all([
          getAssignments(filters),
          getShiftTemplates(),
        ]);
        allAssignments = assignmentsRes.data || [];
        console.log('[Shift Assignments] Admin/HR assignments:', allAssignments.length);
        setTemplates(templatesRes.data || []);
      }
      
      setAssignments(allAssignments);
      
      // Show helpful message if no assignments found for regular employee
      if (isRegularEmployee && allAssignments.length === 0) {
        console.warn('[Shift Assignments] No assignments found for employee:', employeeId);
      }
    } catch (err: any) {
      console.error('[Shift Assignments] Error loading data:', err);
      console.error('[Shift Assignments] Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      setLoadingDropdowns(true);
      const token = localStorage.getItem('token');
      
      // Load departments, employees, and positions in parallel
      const [deptRes, empRes, posRes] = await Promise.allSettled([
        api.get('/organization-structure/departments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/employee-profile', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }, // Get all employees
        }),
        api.get('/organization-structure/positions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (deptRes.status === 'fulfilled') {
        // Handle different response structures
        let deptData = deptRes.value.data;
        
        if (deptData?.items && Array.isArray(deptData.items)) {
          deptData = deptData.items;
        } else if (deptData?.data && Array.isArray(deptData.data)) {
          deptData = deptData.data;
        } else if (!Array.isArray(deptData)) {
          deptData = [];
        }
        
        const allDepartments = Array.isArray(deptData) ? deptData : [];
        setDepartments(allDepartments);
      } else {
        console.error('Failed to load departments:', deptRes.reason);
        setDepartments([]);
      }

      if (empRes.status === 'fulfilled') {
        let empData = empRes.value.data;
        
        // Handle different response structures
        if (empData?.items && Array.isArray(empData.items)) {
          empData = empData.items;
        } else if (empData?.data && Array.isArray(empData.data)) {
          empData = empData.data;
        } else if (!Array.isArray(empData)) {
          empData = [];
        }
        
        const allEmployees = Array.isArray(empData) ? empData : [];
        setEmployees(allEmployees);
      } else {
        console.error('Failed to load employees:', empRes.reason);
        setEmployees([]);
      }

      if (posRes.status === 'fulfilled') {
        let posData = posRes.value.data;
        
        // Handle different response structures
        if (posData?.items && Array.isArray(posData.items)) {
          posData = posData.items;
        } else if (posData?.data && Array.isArray(posData.data)) {
          posData = posData.data;
        } else if (!Array.isArray(posData)) {
          posData = [];
        }
        
        const allPositions = Array.isArray(posData) ? posData : [];
        setPositions(allPositions);
      } else {
        console.error('Failed to load positions:', posRes.reason);
        setPositions([]);
      }
    } catch (err) {
      console.error('Error loading dropdowns:', err);
      setDepartments([]);
      setEmployees([]);
      setPositions([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.shiftTemplateId) {
        setError('Please select a shift template');
        return;
      }

      if (!formData.effectiveFrom) {
        setError('Effective From date is required');
        return;
      }

      if (!formData.effectiveTo) {
        setError('Effective To date is required');
        return;
      }

      // Validate that exactly one target is selected
      const targetCount = [
        formData.assignmentType === 'individual' && formData.employeeId,
        formData.assignmentType === 'department' && formData.departmentId,
        formData.assignmentType === 'position' && formData.positionId,
      ].filter(Boolean).length;

      if (targetCount !== 1) {
        setError('Please select an employee, department, or position');
        return;
      }

      // Validate date range
      const fromDate = new Date(formData.effectiveFrom);
      const toDate = new Date(formData.effectiveTo);
      if (fromDate >= toDate) {
        setError('Effective From date must be before Effective To date');
        return;
      }

      // Prepare assignment data with proper date format
      const assignmentData: any = {
        shiftTemplateId: formData.shiftTemplateId.trim(),
        effectiveFrom: new Date(formData.effectiveFrom).toISOString(),
        effectiveTo: new Date(formData.effectiveTo).toISOString(),
      };

      // Add metadata if reason is provided
      if (formData.reason) {
        assignmentData.metadata = {
          reason: formData.reason,
        };
      }

      // Add exactly one target
      if (formData.assignmentType === 'individual') {
        if (!formData.employeeId?.trim()) {
          setError('Employee ID is required');
          return;
        }
        assignmentData.employeeId = formData.employeeId.trim();
      } else if (formData.assignmentType === 'department') {
        if (!formData.departmentId?.trim()) {
          setError('Department ID is required');
          return;
        }
        assignmentData.departmentId = formData.departmentId.trim();
      } else if (formData.assignmentType === 'position') {
        if (!formData.positionId?.trim()) {
          setError('Position ID is required');
          return;
        }
        assignmentData.positionId = formData.positionId.trim();
      }

      console.log('Submitting assignment data:', assignmentData);
      await assignShift(assignmentData);
      setSuccess('Shift assigned successfully');
      setShowModal(false);
      setFormData({
        shiftTemplateId: '',
        assignmentType: 'individual',
        employeeId: '',
        departmentId: '',
        positionId: '',
        effectiveFrom: '',
        effectiveTo: '',
        reason: '',
      });
      loadData();
    } catch (err: any) {
      console.error('Assignment error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Failed to assign shift';
      
      // First, try to get the user-friendly message from the error object
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (Array.isArray(err.response.data) && err.response.data.length > 0) {
          // Handle validation error array from class-validator
          errorMessage = err.response.data.map((e: any) => {
            if (typeof e === 'string') return e;
            return e.message || Object.values(e.constraints || {}).join(', ');
          }).join('; ');
        } else if (err.response.data.statusCode === 400 || err.response.data.statusCode === 409) {
          errorMessage = err.response.data.message || 'Invalid request data. Please check all fields.';
        }
      } else if (err.message) {
        // Remove the "(Status: XXX)" suffix if present for cleaner display
        errorMessage = err.message.replace(/\s*\(Status:\s*\d+\)\s*$/, '');
      }
      
      setError(errorMessage);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!bulkFormData.shiftTemplateId) {
        setError('Please select a shift template');
        return;
      }

      if (!bulkFormData.effectiveFrom) {
        setError('Effective From date is required');
        return;
      }

      if (!bulkFormData.effectiveTo) {
        setError('Effective To date is required');
        return;
      }

      // Validate date range
      const fromDate = new Date(bulkFormData.effectiveFrom);
      const toDate = new Date(bulkFormData.effectiveTo);
      if (fromDate >= toDate) {
        setError('Effective From date must be before Effective To date');
        return;
      }

      // Prepare bulk assignment data with proper date format
      const bulkData: any = {
        shiftTemplateId: bulkFormData.shiftTemplateId.trim(),
        effectiveFrom: new Date(bulkFormData.effectiveFrom).toISOString(),
        effectiveTo: new Date(bulkFormData.effectiveTo).toISOString(),
      };

      // Add metadata if reason is provided
      if (bulkFormData.reason) {
        bulkData.metadata = {
          reason: bulkFormData.reason,
        };
      }

      // Add target (department or position)
      if (bulkFormData.assignmentType === 'department') {
        if (!bulkFormData.departmentId?.trim()) {
          setError('Department ID is required');
          return;
        }
        bulkData.departmentId = bulkFormData.departmentId.trim();
      } else if (bulkFormData.assignmentType === 'position') {
        if (!bulkFormData.positionId?.trim()) {
          setError('Position ID is required');
          return;
        }
        bulkData.positionId = bulkFormData.positionId.trim();
      }

      // Add employee IDs if provided
      if (bulkFormData.employeeIds.length > 0) {
        bulkData.employeeIds = bulkFormData.employeeIds.map(id => id.trim()).filter(Boolean);
      }

      console.log('Submitting bulk assignment data:', bulkData);
      await bulkAssignShift(bulkData);
      setSuccess('Bulk shift assignment completed successfully');
      setShowBulkModal(false);
      setBulkFormData({
        shiftTemplateId: '',
        assignmentType: 'department',
        departmentId: '',
        positionId: '',
        employeeIds: [],
        effectiveFrom: '',
        effectiveTo: '',
        reason: '',
      });
      loadData();
    } catch (err: any) {
      console.error('Bulk assignment error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Failed to bulk assign shifts';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (Array.isArray(err.response.data) && err.response.data.length > 0) {
          // Handle validation error array
          errorMessage = err.response.data.map((e: any) => {
            if (typeof e === 'string') return e;
            return e.message || Object.values(e.constraints || {}).join(', ');
          }).join('; ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateAssignmentStatus(id, { status, reason: 'Status updated' });
      setSuccess('Assignment status updated successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment?._id) return;

    setError(null);
    setSuccess(null);

    try {
      await renewAssignment(selectedAssignment._id, {
        effectiveTo: formData.effectiveTo,
        reason: formData.reason || 'Assignment renewed',
      });
      setSuccess('Assignment renewed successfully');
      setShowRenewModal(false);
      setSelectedAssignment(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to renew assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-500/20 text-green-300 border-green-400/30',
      INACTIVE: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      EXPIRED: 'bg-red-500/20 text-red-300 border-red-400/30',
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    };
    return colors[status] || colors.INACTIVE;
  };

  const getAssignmentTarget = (assignment: ShiftAssignment) => {
    if (assignment.employeeId) {
      const employee = employees.find(emp => emp._id === assignment.employeeId);
      const employeeName = employee 
        ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeId || assignment.employeeId
        : assignment.employeeId;
      return `Employee: ${employeeName}`;
    }
    if (assignment.departmentId) {
      const department = departments.find(dept => dept._id === assignment.departmentId);
      const departmentName = department 
        ? (department.name || department.code || assignment.departmentId)
        : assignment.departmentId;
      return `Department: ${departmentName}`;
    }
    if (assignment.positionId) {
      const position = positions.find(pos => pos._id === assignment.positionId);
      const positionName = position 
        ? (position.title || position.name || position.code || assignment.positionId)
        : assignment.positionId;
      return `Position: ${positionName}`;
    }
    return 'Unknown';
  };

  const getTemplateName = (templateId: any) => {
    if (typeof templateId === 'object' && templateId?.name) {
      return templateId.name;
    }
    const template = templates.find(t => t._id === templateId);
    return template?.name || 'Unknown Template';
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-white">Shift Assignments</h2>
          <p className="text-gray-400 text-sm">Assign shifts to employees, departments, or positions</p>
        </div>
        <div className="flex gap-3">
          {/* Only show assign buttons for admin/HR users */}
          {!isRegularEmployee && (
            <>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                Bulk Assign
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
              >
                + Assign Shift
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300">
          {success}
        </div>
      )}

      {/* Filters - Only show for admin/HR users */}
      {!isRegularEmployee && (
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-gray-500">All Statuses</option>
                <option value="ACTIVE" className="bg-slate-800 text-white">Active</option>
                <option value="INACTIVE" className="bg-slate-800 text-white">Inactive</option>
                <option value="EXPIRED" className="bg-slate-800 text-white">Expired</option>
                <option value="PENDING" className="bg-slate-800 text-white">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Employee
                <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                  (Refresh)
                </button>
              </label>
              <select
                value={filters.employeeId || ''}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-gray-500">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id} className="bg-slate-800 text-white">
                    {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Department
                <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                  (Refresh)
                </button>
              </label>
              <select
                value={filters.departmentId || ''}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-gray-500">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id} className="bg-slate-800 text-white">
                    {dept.name || dept.code || dept._id}
                    {dept.code && dept.name && ` (${dept.code})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Position
                <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                  (Refresh)
                </button>
              </label>
              <select
                value={filters.positionId || ''}
                onChange={(e) => setFilters({ ...filters, positionId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-gray-500">All Positions</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id} className="bg-slate-800 text-white">
                    {pos.title || pos.name || pos.code || pos._id}
                    {pos.code && pos.title && ` (${pos.code})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Info message for regular employees */}
      {isRegularEmployee && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {employeeProfile ? (
                  <>Your Shift Assignments - {employeeProfile.firstName} {employeeProfile.lastName}</>
                ) : (
                  <>Your Shift Assignments</>
                )}
                {employeeId && (
                  <span className="text-xs font-normal ml-2">
                    (ID: {employeeId.length > 20 ? `${employeeId.substring(0, 8)}...` : employeeId})
                  </span>
                )}
              </p>
              {employeeProfile ? (
                <p className="text-xs mt-1 text-blue-400">
                  Department: {employeeProfile.primaryDepartmentId?.name || employeeProfile.primaryDepartmentId || 'Not assigned'} | 
                  Position: {employeeProfile.primaryPositionId?.title || employeeProfile.primaryPositionId?.name || employeeProfile.primaryPositionId || 'Not assigned'}
                </p>
              ) : (
                <p className="text-xs mt-1 text-yellow-400">
                  Loading employee profile...
                </p>
              )}
              {loading && (
                <p className="text-xs mt-2 text-blue-400">
                  ⏳ Loading your shift assignments...
                </p>
              )}
              {!loading && assignments.length > 0 && (
                <p className="text-xs mt-2 text-green-400">
                  ✓ Found {assignments.length} shift assignment{assignments.length !== 1 ? 's' : ''}
                </p>
              )}
              {!loading && assignments.length === 0 && (
                <div className="text-xs mt-2 text-yellow-400">
                  <p className="font-semibold">⚠️ No shift assignments found.</p>
                  <p className="mt-1">This could mean:</p>
                  <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                    <li>No shifts have been assigned to you directly</li>
                    <li>No shifts have been assigned to your department ({employeeProfile?.primaryDepartmentId?.name || 'N/A'})</li>
                    <li>No shifts have been assigned to your position ({employeeProfile?.primaryPositionId?.title || employeeProfile?.primaryPositionId?.name || 'N/A'})</li>
                    <li>Contact your HR Manager to request shift assignments</li>
                  </ul>
                  <p className="mt-2 text-blue-300">
                    💡 Tip: Open browser console (F12) to see detailed debugging information
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                console.log('[Shift Assignments] ========== MANUAL REFRESH ==========');
                console.log('[Shift Assignments] Current state:', {
                  employeeId,
                  employeeProfile,
                  isRegularEmployee,
                  filters,
                  assignmentsCount: assignments.length,
                  loading
                });
                loadData();
              }}
              className="ml-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 text-blue-300 text-xs whitespace-nowrap"
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
          {/* Debug info - always show for employees to help troubleshoot */}
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-blue-400 hover:text-blue-300">🔍 Debug Info (Click to expand)</summary>
            <div className="mt-2 p-2 bg-black/20 rounded text-gray-300 font-mono text-xs overflow-auto max-h-40">
              <p><strong>Employee ID:</strong> {employeeId || '❌ NOT FOUND'}</p>
              <p><strong>Employee Profile:</strong> {employeeProfile ? '✅ Loaded' : '⏳ Not loaded'}</p>
              {employeeProfile && (
                <>
                  <p><strong>Name:</strong> {employeeProfile.firstName} {employeeProfile.lastName}</p>
                  <p><strong>Department ID:</strong> {employeeProfile.primaryDepartmentId?._id || employeeProfile.primaryDepartmentId || 'N/A'}</p>
                  <p><strong>Department Name:</strong> {employeeProfile.primaryDepartmentId?.name || 'N/A'}</p>
                  <p><strong>Position ID:</strong> {employeeProfile.primaryPositionId?._id || employeeProfile.primaryPositionId || 'N/A'}</p>
                  <p><strong>Position Name:</strong> {employeeProfile.primaryPositionId?.title || employeeProfile.primaryPositionId?.name || 'N/A'}</p>
                </>
              )}
              <p><strong>Assignments Found:</strong> {assignments.length}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Filters Applied:</strong> {JSON.stringify(filters, null, 2)}</p>
            </div>
          </details>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">Shift Template</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">Assigned To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">From</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {assignments.map((assignment) => (
                <tr key={assignment._id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-white">
                    {getTemplateName(assignment.shiftTemplateId)}
                  </td>
                  <td className="px-6 py-4 text-white/70 text-sm">
                    {getAssignmentTarget(assignment)}
                  </td>
                  <td className="px-6 py-4 text-white/70 text-sm">
                    {new Date(assignment.effectiveFrom).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-white/70 text-sm">
                    {new Date(assignment.effectiveTo).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setFormData({
                            ...formData,
                            effectiveTo: assignment.effectiveTo,
                          });
                          setShowRenewModal(true);
                        }}
                        className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs hover:bg-blue-500/20"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(assignment._id!, assignment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/10"
                      >
                        {assignment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No shift assignments found</p>
            {isRegularEmployee && (
              <p className="text-sm text-gray-500">
                If you expect to see assignments, check the debug info above or contact HR.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Assign Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Assign Shift</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shift Template *</label>
                <select
                  required
                  value={formData.shiftTemplateId}
                  onChange={(e) => setFormData({ ...formData, shiftTemplateId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-gray-500">Select a shift template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id} className="bg-slate-800 text-white">
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Assignment Type *</label>
                <select
                  required
                  value={formData.assignmentType}
                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="individual" className="bg-slate-800 text-white">Individual Employee</option>
                  <option value="department" className="bg-slate-800 text-white">Department</option>
                  <option value="position" className="bg-slate-800 text-white">Position</option>
                </select>
              </div>

              {formData.assignmentType === 'individual' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Employee *
                    {employees.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">({employees.length} available)</span>
                    )}
                    <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                      (Refresh)
                    </button>
                  </label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">
                      Loading employees...
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-gray-500">Select Employee</option>
                      {employees.length > 0 ? (
                        employees.map((emp) => (
                          <option key={emp._id} value={emp._id} className="bg-slate-800 text-white">
                            {emp.firstName} {emp.lastName} {emp.employeeId ? `(${emp.employeeId})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled className="bg-slate-800 text-gray-500">
                          No employees available
                        </option>
                      )}
                    </select>
                  )}
                  {employees.length === 0 && !loadingDropdowns && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                      <p className="font-semibold mb-1">No employees found</p>
                      <p>Please create employees first in <strong>HR → Employees</strong></p>
                    </div>
                  )}
                </div>
              )}

              {formData.assignmentType === 'department' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Department *
                    {departments.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">({departments.length} available)</span>
                    )}
                    <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                      (Refresh)
                    </button>
                  </label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">
                      Loading departments...
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.departmentId || ''}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-gray-500">Select Department</option>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept._id} value={dept._id} className="bg-slate-800 text-white">
                            {dept.name || dept.code || dept._id}
                            {dept.code && dept.name && ` (${dept.code})`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled className="bg-slate-800 text-gray-500">
                          No departments available
                        </option>
                      )}
                    </select>
                  )}
                  {departments.length === 0 && !loadingDropdowns && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                      <p className="font-semibold mb-1">No departments found</p>
                      <p>Please create departments first in <strong>Organization Structure → Departments</strong></p>
                    </div>
                  )}
                </div>
              )}

              {formData.assignmentType === 'position' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Position ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.positionId}
                    onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="Enter position ID"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Effective From *</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Effective To *</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={3}
                  placeholder="Optional reason for assignment..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  Assign Shift
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Bulk Assign Shift</h3>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shift Template *</label>
                <select
                  required
                  value={bulkFormData.shiftTemplateId}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, shiftTemplateId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-gray-500">Select a shift template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id} className="bg-slate-800 text-white">
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Assignment Type *</label>
                <select
                  required
                  value={bulkFormData.assignmentType}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, assignmentType: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                >
                  <option value="department" className="bg-slate-800 text-white">Department</option>
                  <option value="position" className="bg-slate-800 text-white">Position</option>
                </select>
              </div>

              {bulkFormData.assignmentType === 'department' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Department *
                    {departments.length > 0 && (
                      <span className="text-xs text-gray-500 ml-2">({departments.length} available)</span>
                    )}
                    <button type="button" onClick={loadDropdowns} className="ml-2 text-blue-400 hover:text-blue-300 text-xs">
                      (Refresh)
                    </button>
                  </label>
                  {loadingDropdowns ? (
                    <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">
                      Loading departments...
                    </div>
                  ) : (
                    <select
                      required
                      value={bulkFormData.departmentId || ''}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, departmentId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-gray-500">Select Department</option>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept._id} value={dept._id} className="bg-slate-800 text-white">
                            {dept.name || dept.code || dept._id}
                            {dept.code && dept.name && ` (${dept.code})`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled className="bg-slate-800 text-gray-500">
                          No departments available
                        </option>
                      )}
                    </select>
                  )}
                  {departments.length === 0 && !loadingDropdowns && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                      <p className="font-semibold mb-1">No departments found</p>
                      <p>Please create departments first in <strong>Organization Structure → Departments</strong></p>
                    </div>
                  )}
                </div>
              )}

              {bulkFormData.assignmentType === 'position' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Position ID *</label>
                  <input
                    type="text"
                    required
                    value={bulkFormData.positionId}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, positionId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="Enter position ID"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Effective From *</label>
                  <input
                    type="date"
                    required
                    value={bulkFormData.effectiveFrom}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, effectiveFrom: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Effective To *</label>
                  <input
                    type="date"
                    required
                    value={bulkFormData.effectiveTo}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, effectiveTo: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                  value={bulkFormData.reason}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={3}
                  placeholder="Optional reason for bulk assignment..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  Bulk Assign
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Renew Assignment</h3>
              <button
                onClick={() => {
                  setShowRenewModal(false);
                  setSelectedAssignment(null);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleRenew} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Effective To *</label>
                <input
                  type="date"
                  required
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={3}
                  placeholder="Reason for renewal..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  Renew
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setSelectedAssignment(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
