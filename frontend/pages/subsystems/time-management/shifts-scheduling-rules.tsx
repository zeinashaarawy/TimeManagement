import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Settings, Ban, CheckCircle, X } from "lucide-react";
import { schedulingRulesApi, shiftTemplateApi } from "../../../lib/api";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

interface SchedulingRule {
  _id: string;
  name: string;
  type: 'FLEXIBLE' | 'ROTATIONAL' | 'COMPRESSED';
  flexInWindow?: string;
  flexOutWindow?: string;
  rotationalPattern?: string;
  workDaysPerWeek?: number;
  hoursPerDay?: number;
  active: boolean;
  description?: string;
  departmentIds?: string[] | { _id: string; name: string; code?: string }[];
  shiftTemplateIds?: string[] | { _id: string; name: string; type?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

interface ShiftTemplate {
  _id: string;
  name: string;
  type: string;
}

export default function ShiftsSchedulingRules({ asTab = false }: { asTab?: boolean } = {}) {
  const [rules, setRules] = useState<SchedulingRule[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SchedulingRule | null>(null);

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
    loadTemplates();
    loadRules();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await shiftTemplateApi.getAll();
      const data = response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading templates:", err);
    }
  };

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schedulingRulesApi.getAll();
      setRules(response.data || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access forbidden. You need HR Manager or System Admin role to view scheduling rules.');
      } else {
        setError(err.response?.data?.message || 'Failed to load scheduling rules');
      }
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduling rule?')) return;
    try {
      setLoading(true);
      await schedulingRulesApi.delete(id);
      await loadRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete scheduling rule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      await schedulingRulesApi.toggleActive(id);
      await loadRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle rule status');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: SchedulingRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const canEdit = userRole === 'HR Manager';

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FLEXIBLE': return 'Flexible Hours';
      case 'ROTATIONAL': return 'Rotational Pattern';
      case 'COMPRESSED': return 'Compressed Workweek';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FLEXIBLE': return 'from-blue-500 to-cyan-500';
      case 'ROTATIONAL': return 'from-purple-500 to-pink-500';
      case 'COMPRESSED': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      {!asTab && (
        <div className="mb-8">
          <Link href="/subsystems/time-management">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Time Management</span>
            </button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-light mb-2">Scheduling Rules</h1>
              <p className="text-gray-400">Configure flexible hours, rotational patterns, and compressed workweeks</p>
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingRule(null);
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Rule
              </button>
            )}
          </div>
        </div>
      )}

      {asTab && canEdit && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setEditingRule(null);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Rule
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-gray-400">Loading scheduling rules...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && rules.length === 0 && (
        <div className="text-center py-20">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
              <Settings className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
          </div>
          <h3 className="text-xl text-gray-300 mb-2">No Scheduling Rules</h3>
          <p className="text-gray-500">Create your first scheduling rule to configure flexible hours, rotational patterns, or compressed workweeks</p>
        </div>
      )}

      {/* Rules List */}
      {!loading && rules.length > 0 && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`relative group`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor(rule.type)} rounded-xl blur-sm opacity-50`} />
                      <div className={`relative bg-gradient-to-br ${getTypeColor(rule.type)} p-2 rounded-xl`}>
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg text-white font-medium">{rule.name}</h3>
                      <p className="text-sm text-gray-400">{getTypeLabel(rule.type)}</p>
                    </div>
                    {!rule.active && (
                      <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                        Disabled
                      </span>
                    )}
                  </div>

                  {rule.description && (
                    <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {rule.type === 'FLEXIBLE' && (
                      <>
                        {rule.flexInWindow && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Flex-In Window</p>
                            <p className="text-sm text-gray-300">{rule.flexInWindow}</p>
                          </div>
                        )}
                        {rule.flexOutWindow && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Flex-Out Window</p>
                            <p className="text-sm text-gray-300">{rule.flexOutWindow}</p>
                          </div>
                        )}
                      </>
                    )}

                    {rule.type === 'ROTATIONAL' && rule.rotationalPattern && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pattern</p>
                        <p className="text-sm text-gray-300">{rule.rotationalPattern}</p>
                      </div>
                    )}

                    {rule.type === 'COMPRESSED' && (
                      <>
                        {rule.workDaysPerWeek && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Work Days per Week</p>
                            <p className="text-sm text-gray-300">{rule.workDaysPerWeek} days</p>
                          </div>
                        )}
                        {rule.hoursPerDay && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Hours per Day</p>
                            <p className="text-sm text-gray-300">{rule.hoursPerDay} hours</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(rule._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.active
                          ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                      title={rule.active ? 'Disable Rule' : 'Enable Rule'}
                    >
                      {rule.active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduling Rule Modal - Simplified for now */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-white">
                {editingRule ? 'Edit Scheduling Rule' : 'Create Scheduling Rule'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRule(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400">Scheduling rule form will be implemented here. For now, use the API directly.</p>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingRule(null);
              }}
              className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return asTab ? content : (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12">
      {content}
    </div>
  );
}

