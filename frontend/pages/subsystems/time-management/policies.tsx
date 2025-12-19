import React, { useState, useEffect } from 'react';
import { getPolicies, createPolicy, updatePolicy, deletePolicy, assignPolicyToEmployee, assignPolicyToDepartment } from '../../../services/timeManagementApi';
import api from '../../../api/axios';

interface TimePolicy {
  _id?: string;
  name: string;
  description?: string;
  scope: 'GLOBAL' | 'DEPARTMENT' | 'EMPLOYEE';
  departmentId?: string;
  employeeId?: string;
  latenessRule?: {
    gracePeriodMinutes?: number;
    deductionPerMinute?: number;
    disciplinaryThreshold?: number;
    autoPenalty?: boolean;
  };
  overtimeRule?: {
    eligibility?: boolean;
    multiplier?: number;
    approvalRequired?: boolean;
    weekendMultiplier?: number;
    holidayMultiplier?: number;
  };
  shortTimeRule?: {
    minimumHours?: number;
    penaltyPerHour?: number;
    autoDeduction?: boolean;
  };
  weekendRule?: {
    enabled?: boolean;
    multiplier?: number;
  };
  roundingRule?: string;
  roundingIntervalMinutes?: number;
  penaltyCapPerDay?: number;
  active?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export default function Policies() {
  const [policies, setPolicies] = useState<TimePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<TimePolicy | null>(null);
  const [formData, setFormData] = useState<Partial<TimePolicy>>({
    name: '',
    description: '',
    scope: 'GLOBAL',
    active: true,
    roundingRule: 'NONE',
    roundingIntervalMinutes: 15,
    penaltyCapPerDay: 0,
  });
  const [filters, setFilters] = useState({
    scope: '',
    active: '',
    departmentId: '',
    employeeId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // For dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, [filters]);

  // Load departments and employees when modal opens
  useEffect(() => {
    if (showModal) {
      loadDropdowns();
    }
  }, [showModal]);

  // Load dropdowns when filters require them (only once)
  useEffect(() => {
    const needsDepartments = (filters.scope === 'DEPARTMENT' || !filters.scope) && departments.length === 0;
    const needsEmployees = (filters.scope === 'EMPLOYEE' || !filters.scope) && employees.length === 0;
    
    if (needsDepartments || needsEmployees) {
      loadDropdowns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.scope]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const filterParams: any = {};
      
      // Add scope filter
      if (filters.scope) {
        filterParams.scope = filters.scope;
      }
      
      // Add active filter
      if (filters.active) {
        filterParams.active = filters.active === 'true';
      }
      
      // Add departmentId filter (only if scope is DEPARTMENT or not specified)
      if (filters.departmentId && (filters.scope === 'DEPARTMENT' || !filters.scope)) {
        filterParams.departmentId = filters.departmentId;
      }
      
      // Add employeeId filter (only if scope is EMPLOYEE or not specified)
      if (filters.employeeId && (filters.scope === 'EMPLOYEE' || !filters.scope)) {
        filterParams.employeeId = filters.employeeId;
      }
      
      const response = await getPolicies(filterParams);
      setPolicies(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      setLoadingDropdowns(true);
      const token = localStorage.getItem('token');
      
      // Load departments and employees in parallel
      const [deptRes, empRes] = await Promise.allSettled([
        api.get('/organization-structure/departments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/employee-profile', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }, // Get all employees
        }),
      ]);

      if (deptRes.status === 'fulfilled') {
        // Handle different response structures
        let deptData = deptRes.value.data;
        
        // Check if it's wrapped in items, data, or is direct array
        if (deptData?.items && Array.isArray(deptData.items)) {
          deptData = deptData.items;
        } else if (deptData?.data && Array.isArray(deptData.data)) {
          deptData = deptData.data;
        } else if (!Array.isArray(deptData)) {
          deptData = [];
        }
        
        // Filter out inactive departments if needed, or show all
        const allDepartments = Array.isArray(deptData) ? deptData : [];
        console.log('Loaded departments:', allDepartments.length, allDepartments);
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
        console.log('Loaded employees:', allEmployees.length);
        setEmployees(allEmployees);
      } else {
        console.error('Failed to load employees:', empRes.reason);
        setEmployees([]);
      }
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
      setDepartments([]);
      setEmployees([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingPolicy?._id) {
        await updatePolicy(editingPolicy._id, formData);
        setSuccess('Policy updated successfully');
      } else {
        await createPolicy(formData);
        setSuccess('Policy created successfully');
      }

      setShowModal(false);
      setEditingPolicy(null);
      resetForm();
      loadPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save policy');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await deletePolicy(id);
      setSuccess('Policy deleted successfully');
      loadPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete policy');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      scope: 'GLOBAL',
      active: true,
      roundingRule: 'NONE',
      roundingIntervalMinutes: 15,
      penaltyCapPerDay: 0,
    });
  };

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      GLOBAL: 'Global',
      DEPARTMENT: 'Department',
      EMPLOYEE: 'Employee',
    };
    return labels[scope] || scope;
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
          <h2 className="text-2xl font-semibold mb-2 text-white">Time Policies</h2>
          <p className="text-gray-400 text-sm">Configure overtime, lateness, and penalty rules</p>
        </div>
        <button
          onClick={() => {
            setEditingPolicy(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
        >
          + Create Policy
        </button>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <button
            onClick={() => {
              setFilters({ scope: '', active: '', departmentId: '', employeeId: '' });
            }}
            className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Scope</label>
            <select
              value={filters.scope}
              onChange={(e) => {
                const newScope = e.target.value;
                setFilters({ 
                  ...filters, 
                  scope: newScope,
                  // Clear department/employee filters when scope changes
                  departmentId: newScope !== 'DEPARTMENT' ? '' : filters.departmentId,
                  employeeId: newScope !== 'EMPLOYEE' ? '' : filters.employeeId,
                });
              }}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Scopes</option>
              <option value="GLOBAL">Global</option>
              <option value="DEPARTMENT">Department</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.active}
              onChange={(e) => setFilters({ ...filters, active: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Department Filter - Show when scope is DEPARTMENT or empty */}
        {(filters.scope === 'DEPARTMENT' || !filters.scope) && (
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              Filter by Department
              {departments.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">({departments.length} available)</span>
              )}
            </label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id} className="bg-slate-800 text-white">
                  {dept.name || dept.code || dept._id}
                  {dept.code && dept.name && ` (${dept.code})`}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                No departments available. Load departments first.
              </p>
            )}
          </div>
        )}
        
        {/* Employee Filter - Show when scope is EMPLOYEE or empty */}
        {(filters.scope === 'EMPLOYEE' || !filters.scope) && (
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              Filter by Employee
              {employees.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">({employees.length} available)</span>
              )}
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id} className="bg-slate-800 text-white">
                  {emp.firstName && emp.lastName
                    ? `${emp.firstName} ${emp.lastName}${emp.employeeNumber ? ` (${emp.employeeNumber})` : ''}`
                    : emp.employeeNumber || emp._id}
                </option>
              ))}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                No employees available. Load employees first.
              </p>
            )}
          </div>
        )}
        
        {/* Active Filter Summary */}
        {(filters.scope || filters.active || filters.departmentId || filters.employeeId) && (
          <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <p className="text-xs text-teal-300 font-semibold mb-1">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.scope && (
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-300 rounded">
                  Scope: {getScopeLabel(filters.scope)}
                </span>
              )}
              {filters.active && (
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-300 rounded">
                  Status: {filters.active === 'true' ? 'Active' : 'Inactive'}
                </span>
              )}
              {filters.departmentId && (
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-300 rounded">
                  Department: {departments.find(d => d._id === filters.departmentId)?.name || filters.departmentId}
                </span>
              )}
              {filters.employeeId && (
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-300 rounded">
                  Employee: {employees.find(e => e._id === filters.employeeId)?.firstName && employees.find(e => e._id === filters.employeeId)?.lastName
                    ? `${employees.find(e => e._id === filters.employeeId)?.firstName} ${employees.find(e => e._id === filters.employeeId)?.lastName}`
                    : filters.employeeId}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policies.map((policy) => (
          <div
            key={policy._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{policy.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {getScopeLabel(policy.scope)}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                policy.active
                  ? 'bg-green-500/20 text-green-300 border-green-400/30'
                  : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
              }`}>
                {policy.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {policy.description && (
              <p className="text-sm text-gray-400 mb-4">{policy.description}</p>
            )}

            <div className="space-y-2 mb-4">
              {policy.latenessRule && (
                <div className="text-sm">
                  <span className="text-gray-400">Lateness: </span>
                  <span className="text-white">
                    {policy.latenessRule.gracePeriodMinutes || 0} min grace, 
                    ${policy.latenessRule.deductionPerMinute || 0}/min
                  </span>
                </div>
              )}
              {policy.overtimeRule && (
                <div className="text-sm">
                  <span className="text-gray-400">Overtime: </span>
                  <span className="text-white">
                    {policy.overtimeRule.multiplier || 1.5}x
                    {policy.overtimeRule.approvalRequired && ' (Approval Required)'}
                  </span>
                </div>
              )}
              {policy.shortTimeRule && (
                <div className="text-sm">
                  <span className="text-gray-400">Short Time: </span>
                  <span className="text-white">
                    Min {policy.shortTimeRule.minimumHours || 0}h, 
                    ${policy.shortTimeRule.penaltyPerHour || 0}/h
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingPolicy(policy);
                  setFormData(policy);
                  setShowModal(true);
                }}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => policy._id && handleDelete(policy._id)}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {policies.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400 mb-4">No policies found</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl"
          >
            Create Your First Policy
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">
                {editingPolicy ? 'Edit Time Policy' : 'Create Time Policy'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPolicy(null);
                  resetForm();
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Policy Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Scope *</label>
                  <select
                    required
                    value={formData.scope || 'GLOBAL'}
                    onChange={(e) => {
                      const newScope = e.target.value as 'GLOBAL' | 'DEPARTMENT' | 'EMPLOYEE';
                      console.log('Scope changed to:', newScope); // Debug log
                      // Clear departmentId/employeeId when scope changes
                      const updatedData: Partial<TimePolicy> = { ...formData, scope: newScope };
                      if (newScope !== 'DEPARTMENT') {
                        delete updatedData.departmentId;
                      }
                      if (newScope !== 'EMPLOYEE') {
                        delete updatedData.employeeId;
                      }
                      setFormData(updatedData);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="GLOBAL" className="bg-slate-800 text-white">Global</option>
                    <option value="DEPARTMENT" className="bg-slate-800 text-white">Department</option>
                    <option value="EMPLOYEE" className="bg-slate-800 text-white">Employee</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Current: {formData.scope || 'GLOBAL'}</p>
                </div>
              </div>

              {formData.scope === 'DEPARTMENT' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-gray-400">
                      Department * 
                      {departments.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">({departments.length} available)</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={loadDropdowns}
                      className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                      title="Refresh departments list"
                    >
                      🔄 Refresh
                    </button>
                  </div>
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
                      <option value="" className="bg-slate-800 text-white">Select Department</option>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option 
                            key={dept._id} 
                            value={dept._id}
                            className="bg-slate-800 text-white"
                          >
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
                  {departments.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ Showing all {departments.length} department{departments.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {formData.scope === 'EMPLOYEE' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-gray-400">
                      Employee * 
                      {employees.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">({employees.length} available)</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={loadDropdowns}
                      className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                      title="Refresh employees list"
                    >
                      🔄 Refresh
                    </button>
                  </div>
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
                      <option value="" className="bg-slate-800 text-white">Select Employee</option>
                      {employees.length > 0 ? (
                        employees.map((emp) => (
                          <option 
                            key={emp._id} 
                            value={emp._id}
                            className="bg-slate-800 text-white"
                          >
                            {emp.firstName && emp.lastName
                              ? `${emp.firstName} ${emp.lastName}${emp.employeeNumber ? ` (${emp.employeeNumber})` : ''}`
                              : emp.employeeNumber || emp._id}
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
                      <p>Please create employees first in <strong>HR → Employees → Create Employee</strong></p>
                    </div>
                  )}
                  {employees.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ Showing all {employees.length} employee{employees.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={3}
                />
              </div>

              {/* Lateness Rules */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">Lateness Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Grace Period (minutes)</label>
                    <input
                      type="number"
                      value={formData.latenessRule?.gracePeriodMinutes || 15}
                      onChange={(e) => setFormData({
                        ...formData,
                        latenessRule: {
                          ...formData.latenessRule,
                          gracePeriodMinutes: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Deduction per Minute ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.latenessRule?.deductionPerMinute || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        latenessRule: {
                          ...formData.latenessRule,
                          deductionPerMinute: parseFloat(e.target.value),
                        },
                      })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime Rules */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">Overtime Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.overtimeRule?.multiplier || 1.5}
                      onChange={(e) => setFormData({
                        ...formData,
                        overtimeRule: {
                          ...formData.overtimeRule,
                          multiplier: parseFloat(e.target.value),
                        },
                      })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={formData.overtimeRule?.approvalRequired || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            approvalRequired: e.target.checked,
                          },
                        })}
                        className="w-4 h-4 rounded bg-white/5 border-white/10"
                      />
                      <span className="text-sm text-gray-400">Approval Required</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active !== undefined ? formData.active : true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/5 border-white/10"
                  />
                  <span className="text-sm text-gray-400">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPolicy(null);
                    resetForm();
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
