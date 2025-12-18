import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, Eye, Lock } from "lucide-react";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../../../services/timeManagementApi";
import { getCurrentUserRole, getPolicyPermissions, type UserRole } from "../../../utils/auth";

interface Policy {
  _id: string;
  name: string;
  description?: string;
  scope: "GLOBAL" | "DEPARTMENT" | "EMPLOYEE";
  departmentId?: string;
  employeeId?: string;
  latenessRule?: {
    gracePeriodMinutes: number;
    deductionPerMinute: number;
    cumulativeThresholdMinutes?: number;
    maxDeductionPerDay?: number;
  };
  overtimeRule?: {
    thresholdMinutes: number;
    multiplier: number;
    dailyCapMinutes?: number;
    weeklyCapMinutes?: number;
    weekendMultiplier?: number;
  };
  shortTimeRule?: {
    minimumWorkMinutes?: number;
    penaltyPerMinute?: number;
    gracePeriodMinutes?: number;
  };
  weekendRule?: {
    approvalRequired?: boolean;
    specialRate?: number;
    multiplier?: number;
  };
  punchPolicy?: string;
  roundingRule?: string;
  roundingIntervalMinutes?: number;
  penaltyCapPerDay?: number;
  active: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Role-based access control
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState(getPolicyPermissions(null));
  
  // Initialize role and permissions
  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
    setPermissions(getPolicyPermissions(role));
  }, []);
  
  // Update role handler (for testing/demo)
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    setPermissions(getPolicyPermissions(newRole));
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', newRole);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "GLOBAL" as "GLOBAL" | "DEPARTMENT" | "EMPLOYEE",
    departmentId: "",
    employeeId: "",
    active: true,
    latenessRule: {
      gracePeriodMinutes: 0,
      deductionPerMinute: 0,
      cumulativeThresholdMinutes: 0,
      maxDeductionPerDay: 0,
    },
    overtimeRule: {
      thresholdMinutes: 480,
      multiplier: 1.5,
      dailyCapMinutes: 0,
      weeklyCapMinutes: 0,
      weekendMultiplier: 0,
    },
    shortTimeRule: {
      minimumWorkMinutes: 480,
      penaltyPerMinute: 0,
      gracePeriodMinutes: 0,
    },
    weekendRule: {
      approvalRequired: false,
      specialRate: 0,
      multiplier: 1.5,
    },
    punchPolicy: "FIRST_LAST",
    roundingRule: "NONE",
    roundingIntervalMinutes: 15,
    penaltyCapPerDay: 0,
    effectiveFrom: "",
    effectiveTo: "",
  });

  useEffect(() => {
    if (permissions.canView) {
      fetchPolicies();
    }
  }, [permissions.canView]);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPolicies();
      setPolicies(response.data);
    } catch (err: any) {
      console.error("Error fetching policies:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "Failed to fetch policies";
      setError(`Error: ${errorMessage}. ${err.response?.status ? `Status: ${err.response.status}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check permissions
    if (editingId && !permissions.canEdit) {
      setError("You do not have permission to edit policies");
      return;
    }
    if (!editingId && !permissions.canCreate) {
      setError("You do not have permission to create policies");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data according to backend schema
      const policyData: any = {
        name: formData.name,
        description: formData.description || undefined,
        scope: formData.scope,
        active: formData.active,
      };

      // Add scope-specific IDs
      if (formData.scope === "DEPARTMENT" && formData.departmentId) {
        policyData.departmentId = formData.departmentId;
      }
      if (formData.scope === "EMPLOYEE" && formData.employeeId) {
        policyData.employeeId = formData.employeeId;
      }

      // Add lateness rule if configured
      if (formData.latenessRule.gracePeriodMinutes > 0 || formData.latenessRule.deductionPerMinute > 0) {
        const latenessRule: any = {
          gracePeriodMinutes: formData.latenessRule.gracePeriodMinutes,
          deductionPerMinute: formData.latenessRule.deductionPerMinute,
        };
        if (formData.latenessRule.cumulativeThresholdMinutes > 0) {
          latenessRule.cumulativeThresholdMinutes = formData.latenessRule.cumulativeThresholdMinutes;
        }
        if (formData.latenessRule.maxDeductionPerDay > 0) {
          latenessRule.maxDeductionPerDay = formData.latenessRule.maxDeductionPerDay;
        }
        policyData.latenessRule = latenessRule;
      }

      // Add overtime rule if configured
      if (formData.overtimeRule.thresholdMinutes > 0) {
        const overtimeRule: any = {
          thresholdMinutes: formData.overtimeRule.thresholdMinutes,
          multiplier: formData.overtimeRule.multiplier,
        };
        if (formData.overtimeRule.dailyCapMinutes > 0) {
          overtimeRule.dailyCapMinutes = formData.overtimeRule.dailyCapMinutes;
        }
        if (formData.overtimeRule.weeklyCapMinutes > 0) {
          overtimeRule.weeklyCapMinutes = formData.overtimeRule.weeklyCapMinutes;
        }
        if (formData.overtimeRule.weekendMultiplier > 0) {
          overtimeRule.weekendMultiplier = formData.overtimeRule.weekendMultiplier;
        }
        policyData.overtimeRule = overtimeRule;
      }

      // Add short-time rule if configured
      if (formData.shortTimeRule.minimumWorkMinutes > 0) {
        const shortTimeRule: any = {
          minimumWorkMinutes: formData.shortTimeRule.minimumWorkMinutes,
        };
        if (formData.shortTimeRule.penaltyPerMinute > 0) {
          shortTimeRule.penaltyPerMinute = formData.shortTimeRule.penaltyPerMinute;
        }
        if (formData.shortTimeRule.gracePeriodMinutes > 0) {
          shortTimeRule.gracePeriodMinutes = formData.shortTimeRule.gracePeriodMinutes;
        }
        policyData.shortTimeRule = shortTimeRule;
      }

      // Add weekend rule if configured
      if (formData.weekendRule.approvalRequired || formData.weekendRule.multiplier > 0) {
        const weekendRule: any = {
          approvalRequired: formData.weekendRule.approvalRequired || false,
          multiplier: formData.weekendRule.multiplier || 1.5,
        };
        if (formData.weekendRule.specialRate > 0) {
          weekendRule.specialRate = formData.weekendRule.specialRate;
        }
        policyData.weekendRule = weekendRule;
      }

      // Add punch policy if configured
      if (formData.punchPolicy && formData.punchPolicy !== "FIRST_LAST") {
        policyData.punchPolicy = formData.punchPolicy;
      }

      // Add short-time rule if configured
      if (formData.shortTimeRule.minimumWorkMinutes > 0) {
        const shortTimeRule: any = {
          minimumWorkMinutes: formData.shortTimeRule.minimumWorkMinutes,
        };
        if (formData.shortTimeRule.penaltyPerMinute > 0) {
          shortTimeRule.penaltyPerMinute = formData.shortTimeRule.penaltyPerMinute;
        }
        if (formData.shortTimeRule.gracePeriodMinutes > 0) {
          shortTimeRule.gracePeriodMinutes = formData.shortTimeRule.gracePeriodMinutes;
        }
        policyData.shortTimeRule = shortTimeRule;
      }

      // Add weekend rule if configured
      if (formData.weekendRule.approvalRequired || formData.weekendRule.multiplier > 0) {
        const weekendRule: any = {
          approvalRequired: formData.weekendRule.approvalRequired || false,
          multiplier: formData.weekendRule.multiplier || 1.5,
        };
        if (formData.weekendRule.specialRate > 0) {
          weekendRule.specialRate = formData.weekendRule.specialRate;
        }
        policyData.weekendRule = weekendRule;
      }

      // Add punch policy if configured
      if (formData.punchPolicy && formData.punchPolicy !== "FIRST_LAST") {
        policyData.punchPolicy = formData.punchPolicy;
      }

      // Add rounding rule
      if (formData.roundingRule !== "NONE") {
        policyData.roundingRule = formData.roundingRule;
        policyData.roundingIntervalMinutes = formData.roundingIntervalMinutes;
      }

      // Add penalty cap
      if (formData.penaltyCapPerDay > 0) {
        policyData.penaltyCapPerDay = formData.penaltyCapPerDay;
      }

      // Add effective dates
      if (formData.effectiveFrom) {
        policyData.effectiveFrom = new Date(formData.effectiveFrom).toISOString();
      }
      if (formData.effectiveTo) {
        policyData.effectiveTo = new Date(formData.effectiveTo).toISOString();
      }

      if (editingId) {
        await updatePolicy(editingId, policyData);
        setSuccess("Policy updated successfully!");
      } else {
        await createPolicy(policyData);
        setSuccess("Policy created successfully!");
      }

      resetForm();
      fetchPolicies();
    } catch (err: any) {
      console.error("Error saving policy:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "Failed to save policy";
      setError(`Error: ${errorMessage}. ${err.response?.status ? `Status: ${err.response.status}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy: Policy) => {
    setEditingId(policy._id);
    setFormData({
      name: policy.name,
      description: policy.description || "",
      scope: policy.scope,
      departmentId: policy.departmentId || "",
      employeeId: policy.employeeId || "",
      active: policy.active,
      latenessRule: {
        gracePeriodMinutes: policy.latenessRule?.gracePeriodMinutes || 0,
        deductionPerMinute: policy.latenessRule?.deductionPerMinute || 0,
        cumulativeThresholdMinutes: policy.latenessRule?.cumulativeThresholdMinutes || 0,
        maxDeductionPerDay: policy.latenessRule?.maxDeductionPerDay || 0,
      },
      overtimeRule: {
        thresholdMinutes: policy.overtimeRule?.thresholdMinutes || 480,
        multiplier: policy.overtimeRule?.multiplier || 1.5,
        dailyCapMinutes: policy.overtimeRule?.dailyCapMinutes || 0,
        weeklyCapMinutes: policy.overtimeRule?.weeklyCapMinutes || 0,
        weekendMultiplier: policy.overtimeRule?.weekendMultiplier || 0,
      },
      shortTimeRule: {
        minimumWorkMinutes: policy.shortTimeRule?.minimumWorkMinutes || 480,
        penaltyPerMinute: policy.shortTimeRule?.penaltyPerMinute || 0,
        gracePeriodMinutes: policy.shortTimeRule?.gracePeriodMinutes || 0,
      },
      weekendRule: {
        approvalRequired: policy.weekendRule?.approvalRequired || false,
        specialRate: policy.weekendRule?.specialRate || 0,
        multiplier: policy.weekendRule?.multiplier || 1.5,
      },
      punchPolicy: policy.punchPolicy || "FIRST_LAST",
      roundingRule: policy.roundingRule || "NONE",
      roundingIntervalMinutes: policy.roundingIntervalMinutes || 15,
      penaltyCapPerDay: policy.penaltyCapPerDay || 0,
      effectiveFrom: policy.effectiveFrom ? policy.effectiveFrom.split("T")[0] : "",
      effectiveTo: policy.effectiveTo ? policy.effectiveTo.split("T")[0] : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canDelete) {
      setError("You do not have permission to delete policies");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this policy?")) return;

    setLoading(true);
    setError(null);
    try {
      await deletePolicy(id);
      setSuccess("Policy deleted successfully!");
      fetchPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete policy");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      scope: "GLOBAL",
      departmentId: "",
      employeeId: "",
      active: true,
      latenessRule: {
        gracePeriodMinutes: 0,
        deductionPerMinute: 0,
        cumulativeThresholdMinutes: 0,
        maxDeductionPerDay: 0,
      },
      overtimeRule: {
        thresholdMinutes: 480,
        multiplier: 1.5,
        dailyCapMinutes: 0,
        weeklyCapMinutes: 0,
        weekendMultiplier: 0,
      },
      shortTimeRule: {
        minimumWorkMinutes: 480,
        penaltyPerMinute: 0,
        gracePeriodMinutes: 0,
      },
      weekendRule: {
        approvalRequired: false,
        specialRate: 0,
        multiplier: 1.5,
      },
      punchPolicy: "FIRST_LAST",
      roundingRule: "NONE",
      roundingIntervalMinutes: 15,
      penaltyCapPerDay: 0,
      effectiveFrom: "",
      effectiveTo: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/subsystems/time-management">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Time Management</span>
            </button>
          </Link>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-light mb-2">Time Management Policies</h1>
              <p className="text-gray-400">Configure time policies and rules for your organization</p>
            </div>
            {/* Role Selector for Testing/Demo */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <label className="block text-xs text-gray-400 mb-1">Current Role (Testing)</label>
              <select
                value={userRole || ''}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white text-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  paddingRight: '1.75rem'
                }}
              >
                <option value="department employee" className="bg-slate-800 text-white">Employee</option>
                <option value="department head" className="bg-slate-800 text-white">Manager</option>
                <option value="HR Manager" className="bg-slate-800 text-white">HR Manager</option>
                <option value="System Admin" className="bg-slate-800 text-white">System Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Access Denied Message */}
        {!permissions.canView && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex flex-col items-center gap-3">
            <Lock className="w-8 h-8 text-red-400" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-400 mb-2">Access Denied</h3>
              <p className="text-red-300">
                You do not have permission to view policies. Please contact your administrator.
              </p>
            </div>
          </div>
        )}

        {/* Read-Only Access Message */}
        {permissions.isReadOnly && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">
              You have read-only access. You can view policies but cannot create, edit, or delete them.
            </span>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Add Policy Button */}
        {!showForm && permissions.canCreate && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Policy
            </button>
          </div>
        )}

        {/* Policy Form */}
        {showForm && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">
                {editingId ? "Edit Policy" : "Create New Policy"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm text-gray-400">Policy Name *</label>
                  <input
                    type="text"
                    required
                    disabled={permissions.isReadOnly}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-400">Scope *</label>
                  <select
                    required
                    disabled={permissions.isReadOnly || !permissions.canAssignScope}
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scope: e.target.value as "GLOBAL" | "DEPARTMENT" | "EMPLOYEE",
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="GLOBAL" className="bg-slate-800 text-white">Global</option>
                    <option value="DEPARTMENT" className="bg-slate-800 text-white">Department</option>
                    <option value="EMPLOYEE" className="bg-slate-800 text-white">Employee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-400">Description</label>
                <textarea
                  disabled={permissions.isReadOnly}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Scope-specific fields */}
              {formData.scope === "DEPARTMENT" && (
                <div>
                  <label className="block mb-2 text-sm text-gray-400">Department ID *</label>
                  <input
                    type="text"
                    required
                    disabled={permissions.isReadOnly}
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {formData.scope === "EMPLOYEE" && (
                <div>
                  <label className="block mb-2 text-sm text-gray-400">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={permissions.isReadOnly}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {/* Lateness Rule */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Lateness Rule</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Grace Period (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.latenessRule.gracePeriodMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latenessRule: {
                            ...formData.latenessRule,
                            gracePeriodMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Deduction Per Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={permissions.isReadOnly}
                      value={formData.latenessRule.deductionPerMinute}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latenessRule: {
                            ...formData.latenessRule,
                            deductionPerMinute: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Cumulative Threshold (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.latenessRule.cumulativeThresholdMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latenessRule: {
                            ...formData.latenessRule,
                            cumulativeThresholdMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Max Deduction Per Day
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.latenessRule.maxDeductionPerDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latenessRule: {
                            ...formData.latenessRule,
                            maxDeductionPerDay: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime Rule */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Overtime Rule</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Threshold (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.overtimeRule.thresholdMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            thresholdMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Multiplier</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      disabled={permissions.isReadOnly}
                      value={formData.overtimeRule.multiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            multiplier: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Daily Cap (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.overtimeRule.dailyCapMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            dailyCapMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Weekly Cap (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.overtimeRule.weeklyCapMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            weeklyCapMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Weekend Multiplier</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      disabled={permissions.isReadOnly}
                      value={formData.overtimeRule.weekendMultiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overtimeRule: {
                            ...formData.overtimeRule,
                            weekendMultiplier: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Short Time Rule */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Short Time Rule</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Minimum Work Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.shortTimeRule.minimumWorkMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortTimeRule: {
                            ...formData.shortTimeRule,
                            minimumWorkMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Penalty Per Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={permissions.isReadOnly}
                      value={formData.shortTimeRule.penaltyPerMinute}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortTimeRule: {
                            ...formData.shortTimeRule,
                            penaltyPerMinute: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Grace Period (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.shortTimeRule.gracePeriodMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortTimeRule: {
                            ...formData.shortTimeRule,
                            gracePeriodMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Weekend Work Rule */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Weekend Work Rule</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      disabled={permissions.isReadOnly}
                      checked={formData.weekendRule.approvalRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weekendRule: {
                            ...formData.weekendRule,
                            approvalRequired: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label className="text-sm">Approval Required</label>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Weekend Multiplier
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      disabled={permissions.isReadOnly}
                      value={formData.weekendRule.multiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weekendRule: {
                            ...formData.weekendRule,
                            multiplier: parseFloat(e.target.value) || 1.5,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Special Rate (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={permissions.isReadOnly}
                      value={formData.weekendRule.specialRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weekendRule: {
                            ...formData.weekendRule,
                            specialRate: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Punch Policy */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Punch Policy</h3>
                <div>
                  <label className="block mb-2 text-sm text-gray-400">
                    Punch Handling Policy
                  </label>
                  <select
                    value={formData.punchPolicy}
                    disabled={permissions.isReadOnly}
                    onChange={(e) => setFormData({ ...formData, punchPolicy: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="FIRST_LAST" className="bg-slate-800 text-white">First In / Last Out</option>
                    <option value="MULTIPLE" className="bg-slate-800 text-white">Multiple Punches Allowed</option>
                    <option value="ONLY_FIRST" className="bg-slate-800 text-white">Only First Punch</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    FIRST_LAST: Only first clock-in and last clock-out count. MULTIPLE: All punches are recorded. ONLY_FIRST: Only the first punch is recorded.
                  </p>
                </div>
              </div>

              {/* Other Settings */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg mb-4">Other Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Rounding Rule</label>
                    <select
                      value={formData.roundingRule}
                      disabled={permissions.isReadOnly}
                      onChange={(e) => setFormData({ ...formData, roundingRule: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="NONE" className="bg-slate-800 text-white">None</option>
                      <option value="ROUND_UP" className="bg-slate-800 text-white">Round Up</option>
                      <option value="ROUND_DOWN" className="bg-slate-800 text-white">Round Down</option>
                      <option value="ROUND_NEAREST" className="bg-slate-800 text-white">Round Nearest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">
                      Rounding Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={permissions.isReadOnly}
                      value={formData.roundingIntervalMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          roundingIntervalMinutes: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Penalty Cap Per Day</label>
                    <input
                      type="number"
                      min="0"
                      disabled={permissions.isReadOnly}
                      value={formData.penaltyCapPerDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          penaltyCapPerDay: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      disabled={permissions.isReadOnly || !permissions.canActivate}
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label className="text-sm">Active</label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || permissions.isReadOnly || (editingId && !permissions.canEdit) || (!editingId && !permissions.canCreate)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Policies List */}
        {permissions.canView && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-light mb-6">Existing Policies</h2>
            {loading && !policies.length ? (
              <div className="text-center py-12 text-gray-400">Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {permissions.canCreate 
                  ? "No policies found. Create one to get started."
                  : "No policies found."}
              </div>
            ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy._id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-medium">{policy.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            policy.active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {policy.active ? "Active" : "Inactive"}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                          {policy.scope}
                        </span>
                      </div>
                      {policy.description && (
                        <p className="text-gray-400 mb-2">{policy.description}</p>
                      )}
                      <div className="text-sm text-gray-400">
                        {policy.latenessRule && (
                          <span>Lateness: {policy.latenessRule.gracePeriodMinutes}min grace, </span>
                        )}
                        {policy.overtimeRule && (
                          <span>
                            Overtime: {policy.overtimeRule.thresholdMinutes}min threshold,{" "}
                            {policy.overtimeRule.multiplier}x multiplier
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {permissions.canEdit && (
                        <button
                          onClick={() => handleEdit(policy)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDelete(policy._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      {permissions.isReadOnly && (
                        <div className="p-2 text-gray-500" title="Read-only access">
                          <Eye className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
