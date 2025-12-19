import React, { useState, useEffect } from 'react';
import { 
  assignShift, 
  bulkAssignShift, 
  getAssignments, 
  updateAssignmentStatus, 
  renewAssignment,
  getShiftTemplates 
} from '../../../services/timeManagementApi';

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

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, templatesRes] = await Promise.all([
        getAssignments(filters),
        getShiftTemplates(),
      ]);
      setAssignments(assignmentsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
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
      if (err.response?.data) {
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
        } else if (err.response.data.statusCode === 400) {
          errorMessage = err.response.data.message || 'Invalid request data. Please check all fields.';
        }
      } else if (err.message) {
        errorMessage = err.message;
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
    if (assignment.employeeId) return `Employee: ${assignment.employeeId}`;
    if (assignment.departmentId) return `Department: ${assignment.departmentId}`;
    if (assignment.positionId) return `Position: ${assignment.positionId}`;
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

      {/* Filters */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Employee ID</label>
            <input
              type="text"
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              placeholder="Filter by employee..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Department ID</label>
            <input
              type="text"
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              placeholder="Filter by department..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Position ID</label>
            <input
              type="text"
              value={filters.positionId}
              onChange={(e) => setFilters({ ...filters, positionId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              placeholder="Filter by position..."
            />
          </div>
        </div>
      </div>

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
        {assignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No shift assignments found</p>
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
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select a shift template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
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
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="individual">Individual Employee</option>
                  <option value="department">Department</option>
                  <option value="position">Position</option>
                </select>
              </div>

              {formData.assignmentType === 'individual' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="Enter employee ID"
                  />
                </div>
              )}

              {formData.assignmentType === 'department' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Department ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="Enter department ID"
                  />
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
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select a shift template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
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
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="department">Department</option>
                  <option value="position">Position</option>
                </select>
              </div>

              {bulkFormData.assignmentType === 'department' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Department ID *</label>
                  <input
                    type="text"
                    required
                    value={bulkFormData.departmentId}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="Enter department ID"
                  />
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
