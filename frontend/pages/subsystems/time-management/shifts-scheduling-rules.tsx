import React, { useState, useEffect } from 'react';
import { 
  schedulingRulesApi 
} from '../../../services/timeManagementApi';

interface SchedulingRule {
  _id?: string;
  name: string;
  type: 'FLEXIBLE' | 'ROTATIONAL' | 'COMPRESSED';
  flexInWindow?: string;
  flexOutWindow?: string;
  rotationalPattern?: string;
  workDaysPerWeek?: number;
  hoursPerDay?: number;
  active?: boolean;
  description?: string;
  departmentIds?: string[];
  shiftTemplateIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function ShiftsSchedulingRules() {
  const [rules, setRules] = useState<SchedulingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SchedulingRule | null>(null);
  const [formData, setFormData] = useState<Partial<SchedulingRule>>({
    name: '',
    type: 'FLEXIBLE',
    active: true,
    flexInWindow: '',
    flexOutWindow: '',
    rotationalPattern: '',
    workDaysPerWeek: 4,
    hoursPerDay: 10,
    description: '',
    departmentIds: [],
    shiftTemplateIds: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await schedulingRulesApi.getAll();
      setRules(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load scheduling rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        setError('Rule name is required');
        return;
      }

      if (!formData.type) {
        setError('Rule type is required');
        return;
      }

      // Validate based on type
      if (formData.type === 'FLEXIBLE') {
        if (!formData.flexInWindow || !formData.flexInWindow.trim()) {
          setError('Flex in window is required for flexible rules');
          return;
        }
        if (!formData.flexOutWindow || !formData.flexOutWindow.trim()) {
          setError('Flex out window is required for flexible rules');
          return;
        }
      }

      if (formData.type === 'COMPRESSED') {
        if (!formData.workDaysPerWeek || formData.workDaysPerWeek < 1 || formData.workDaysPerWeek > 7) {
          setError('Work days per week must be between 1 and 7');
          return;
        }
        if (!formData.hoursPerDay || formData.hoursPerDay < 1 || formData.hoursPerDay > 24) {
          setError('Hours per day must be between 1 and 24');
          return;
        }
      }

      if (formData.type === 'ROTATIONAL') {
        if (!formData.rotationalPattern || !formData.rotationalPattern.trim()) {
          setError('Rotational pattern is required for rotational rules');
          return;
        }
      }

      // Prepare clean data object - only include relevant fields for the rule type
      const cleanData: any = {
        name: formData.name.trim(),
        type: formData.type,
        active: formData.active !== undefined ? formData.active : true,
      };

      // Add type-specific fields
      if (formData.type === 'FLEXIBLE') {
        cleanData.flexInWindow = formData.flexInWindow?.trim();
        cleanData.flexOutWindow = formData.flexOutWindow?.trim();
      } else if (formData.type === 'ROTATIONAL') {
        cleanData.rotationalPattern = formData.rotationalPattern?.trim();
      } else if (formData.type === 'COMPRESSED') {
        cleanData.workDaysPerWeek = formData.workDaysPerWeek;
        cleanData.hoursPerDay = formData.hoursPerDay;
      }

      // Add optional fields only if they have values
      if (formData.description && formData.description.trim()) {
        cleanData.description = formData.description.trim();
      }

      if (formData.departmentIds && formData.departmentIds.length > 0) {
        cleanData.departmentIds = formData.departmentIds;
      }

      if (formData.shiftTemplateIds && formData.shiftTemplateIds.length > 0) {
        cleanData.shiftTemplateIds = formData.shiftTemplateIds;
      }

      console.log('Submitting scheduling rule:', cleanData);

      if (editingRule?._id) {
        await schedulingRulesApi.update(editingRule._id, cleanData);
        setSuccess('Scheduling rule updated successfully');
      } else {
        await schedulingRulesApi.create(cleanData);
        setSuccess('Scheduling rule created successfully');
      }

      setShowModal(false);
      setEditingRule(null);
      setFormData({
        name: '',
        type: 'FLEXIBLE',
        active: true,
        flexInWindow: '',
        flexOutWindow: '',
        rotationalPattern: '',
        workDaysPerWeek: 4,
        hoursPerDay: 10,
        description: '',
        departmentIds: [],
        shiftTemplateIds: [],
      });
      loadRules();
    } catch (err: any) {
      console.error('Error saving scheduling rule:', err);
      
      let errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message || 
                        'Failed to save scheduling rule';
      
      // Handle 403 Forbidden errors with helpful message
      if (err.response?.status === 403) {
        const userRole = localStorage.getItem('userRole') || localStorage.getItem('role') || 'not set';
        errorMessage = `Access Denied (403): ${errorMessage}\n\n` +
          `Your current role: ${userRole}\n` +
          `Required roles: HR Manager, SYSTEM_ADMIN, or HR_ADMIN\n\n` +
          `Please ensure you're logged in with the correct role, or contact your administrator.`;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (rule: SchedulingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      flexInWindow: rule.flexInWindow || '',
      flexOutWindow: rule.flexOutWindow || '',
      rotationalPattern: rule.rotationalPattern || '',
      workDaysPerWeek: rule.workDaysPerWeek || 4,
      hoursPerDay: rule.hoursPerDay || 10,
      active: rule.active !== undefined ? rule.active : true,
      description: rule.description || '',
      departmentIds: rule.departmentIds || [],
      shiftTemplateIds: rule.shiftTemplateIds || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduling rule?')) return;

    try {
      await schedulingRulesApi.delete(id);
      setSuccess('Scheduling rule deleted successfully');
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete scheduling rule');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await schedulingRulesApi.toggleActive(id);
      setSuccess('Rule status toggled successfully');
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to toggle rule status');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FLEXIBLE: 'Flexible In/Out',
      ROTATIONAL: 'Rotational Pattern',
      COMPRESSED: 'Compressed Workweek',
    };
    return labels[type] || type;
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
          <h2 className="text-2xl font-semibold mb-2 text-white">Scheduling Rules</h2>
          <p className="text-gray-400 text-sm">Configure flexible work arrangements and scheduling patterns</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormData({
              name: '',
              type: 'FLEXIBLE',
              active: true,
              flexInWindow: '',
              flexOutWindow: '',
              rotationalPattern: '',
              workDaysPerWeek: 4,
              hoursPerDay: 10,
              description: '',
              departmentIds: [],
              shiftTemplateIds: [],
            });
            setShowModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
        >
          + Create Rule
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

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div
            key={rule._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{rule.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {getTypeLabel(rule.type)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  rule.active
                    ? 'bg-green-500/20 text-green-300 border-green-400/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                }`}>
                  {rule.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {rule.type === 'FLEXIBLE' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Flexible Windows</p>
                <p className="text-white text-sm">
                  In: {rule.flexInWindow || 'N/A'}
                </p>
                <p className="text-white text-sm">
                  Out: {rule.flexOutWindow || 'N/A'}
                </p>
              </div>
            )}

            {rule.type === 'ROTATIONAL' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Pattern</p>
                <p className="text-white text-sm">{rule.rotationalPattern || 'N/A'}</p>
              </div>
            )}

            {rule.type === 'COMPRESSED' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Compressed Schedule</p>
                <p className="text-white text-sm">
                  {rule.workDaysPerWeek} days/week × {rule.hoursPerDay} hours/day
                </p>
              </div>
            )}

            {rule.description && (
              <p className="text-sm text-gray-400 mb-4">{rule.description}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(rule)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => rule._id && handleToggleActive(rule._id)}
                className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 text-blue-300 text-sm"
              >
                {rule.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => rule._id && handleDelete(rule._id)}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No scheduling rules found</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl"
          >
            Create Your First Rule
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">
                {editingRule ? 'Edit Scheduling Rule' : 'Create Scheduling Rule'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRule(null);
                  setError(null);
                  setSuccess(null);
                  setSubmitting(false);
                  // Reset form
                  setFormData({
                    name: '',
                    type: 'FLEXIBLE',
                    active: true,
                    flexInWindow: '',
                    flexOutWindow: '',
                    rotationalPattern: '',
                    workDaysPerWeek: 4,
                    hoursPerDay: 10,
                    description: '',
                    departmentIds: [],
                    shiftTemplateIds: [],
                  });
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error display in modal */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{error}</p>
                </div>
              )}
              
              {/* Success display in modal */}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  placeholder="e.g., Flexible Morning Shift, 4-Day Workweek"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rule Type *</label>
                <select
                  required
                  value={formData.type || 'FLEXIBLE'}
                  onChange={(e) => {
                    const newType = e.target.value as SchedulingRule['type'];
                    setFormData({
                      ...formData,
                      type: newType,
                      // Reset type-specific fields
                      flexInWindow: newType === 'FLEXIBLE' ? formData.flexInWindow : undefined,
                      flexOutWindow: newType === 'FLEXIBLE' ? formData.flexOutWindow : undefined,
                      rotationalPattern: newType === 'ROTATIONAL' ? formData.rotationalPattern : undefined,
                      workDaysPerWeek: newType === 'COMPRESSED' ? formData.workDaysPerWeek : undefined,
                      hoursPerDay: newType === 'COMPRESSED' ? formData.hoursPerDay : undefined,
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="FLEXIBLE">Flexible In/Out</option>
                  <option value="ROTATIONAL">Rotational Pattern</option>
                  <option value="COMPRESSED">Compressed Workweek</option>
                </select>
              </div>

              {formData.type === 'FLEXIBLE' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Flex In Window *</label>
                    <input
                      type="text"
                      required
                      value={formData.flexInWindow || ''}
                      onChange={(e) => setFormData({ ...formData, flexInWindow: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      placeholder="e.g., 08:00-10:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Flex Out Window *</label>
                    <input
                      type="text"
                      required
                      value={formData.flexOutWindow || ''}
                      onChange={(e) => setFormData({ ...formData, flexOutWindow: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      placeholder="e.g., 17:00-19:00"
                    />
                  </div>
                </>
              )}

              {formData.type === 'ROTATIONAL' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rotational Pattern *</label>
                  <input
                    type="text"
                    required
                    value={formData.rotationalPattern || ''}
                    onChange={(e) => setFormData({ ...formData, rotationalPattern: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    placeholder="e.g., 2 days morning, 2 days night"
                  />
                </div>
              )}

              {formData.type === 'COMPRESSED' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Work Days Per Week *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="7"
                        value={formData.workDaysPerWeek || 4}
                        onChange={(e) => setFormData({ ...formData, workDaysPerWeek: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Hours Per Day *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="24"
                        value={formData.hoursPerDay || 10}
                        onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

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

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting 
                    ? 'Saving...' 
                    : editingRule 
                      ? 'Update Rule' 
                      : 'Create Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRule(null);
                    setError(null);
                    setSuccess(null);
                    setSubmitting(false);
                    // Reset form
                    setFormData({
                      name: '',
                      type: 'FLEXIBLE',
                      active: true,
                      flexInWindow: '',
                      flexOutWindow: '',
                      rotationalPattern: '',
                      workDaysPerWeek: 4,
                      hoursPerDay: 10,
                      description: '',
                      departmentIds: [],
                      shiftTemplateIds: [],
                    });
                  }}
                  disabled={submitting}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
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
