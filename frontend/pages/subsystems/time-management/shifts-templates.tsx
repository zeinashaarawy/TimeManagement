import React, { useState, useEffect } from 'react';
import { getShiftTemplates, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate } from '../../../services/timeManagementApi';
import { getCurrentUserRole } from '../../../utils/auth';

interface ShiftTemplate {
  _id?: string;
  name: string;
  type: 'normal' | 'split' | 'overnight' | 'rotational' | 'flexible' | 'compressed';
  startTime?: string;
  endTime?: string;
  restDays?: string[];
  gracePeriod?: number;
  isOvernight?: boolean;
  rotationalPattern?: string | null;
  expirationDate?: string | null;
  status?: string;
  description?: string;
  flexibleStartWindow?: string;
  flexibleEndWindow?: string;
  requiredHours?: number;
  workDaysPerWeek?: number;
  hoursPerDay?: number;
  createdAt?: string;
  updatedAt?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShiftsTemplates() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<ShiftTemplate>>({
    name: '',
    type: 'normal',
    startTime: '09:00',
    endTime: '17:00',
    gracePeriod: 15,
    isOvernight: false,
    status: 'Active',
    restDays: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user can create/edit/delete templates
  // Always check current role from localStorage/JWT, not from state
  // Use the same method as the API interceptor to ensure consistency
  const canManageTemplates = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Use the same logic as the API interceptor to ensure consistency
    const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
    if (!userRole) return false;
    
    const role = userRole.toLowerCase().trim();
    return role === 'hr manager' || 
           role === 'hr admin' || 
           role === 'hr_admin' ||
           role === 'system admin' ||
           role === 'system_admin';
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await getShiftTemplates();
      setTemplates(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load shift templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Check permissions before submitting
    const canManage = canManageTemplates();
    const currentRole = getCurrentUserRole();
    
    // Debug logging
    console.log('[ShiftsTemplates] Permission check:', {
      currentRole,
      canManage,
      editingTemplate: editingTemplate?._id,
    });

    if (!canManage) {
      const errorMsg = `Access denied: You do not have permission to ${editingTemplate ? 'edit' : 'create'} shift templates. Your current role is "${currentRole || 'unknown'}". Please contact HR Manager or System Admin.`;
      setError(errorMsg);
      console.warn('[ShiftsTemplates] Permission denied:', errorMsg);
      return;
    }

    try {
      // Validate based on shift type
      if (['normal', 'split', 'overnight', 'rotational'].includes(formData.type || '')) {
        if (!formData.startTime || !formData.endTime) {
          setError('Start time and end time are required for this shift type');
          return;
        }
      }

      if (formData.type === 'flexible') {
        if (!formData.flexibleStartWindow || !formData.flexibleEndWindow || !formData.requiredHours) {
          setError('Flexible start window, end window, and required hours are required for flexible shifts');
          return;
        }
      }

      if (formData.type === 'compressed') {
        if (!formData.workDaysPerWeek || !formData.hoursPerDay) {
          setError('Work days per week and hours per day are required for compressed shifts');
          return;
        }
      }

      if (editingTemplate?._id) {
        await updateShiftTemplate(editingTemplate._id, formData);
        setSuccess('Shift template updated successfully');
      } else {
        await createShiftTemplate(formData);
        setSuccess('Shift template created successfully');
      }

      setShowModal(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'normal',
        startTime: '09:00',
        endTime: '17:00',
        gracePeriod: 15,
        isOvernight: false,
        status: 'Active',
        restDays: [],
      });
      loadTemplates();
    } catch (err: any) {
      // Handle 403 Forbidden errors specifically
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to perform this action. Please contact HR Manager or System Admin.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save shift template');
      }
    }
  };

  const handleEdit = (template: ShiftTemplate) => {
    // Check permissions before opening edit modal
    if (!canManageTemplates()) {
      setError('You do not have permission to edit shift templates. Please contact HR Manager or System Admin.');
      return;
    }
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      startTime: template.startTime || '09:00',
      endTime: template.endTime || '17:00',
      restDays: template.restDays || [],
      gracePeriod: template.gracePeriod || 15,
      isOvernight: template.isOvernight || false,
      rotationalPattern: template.rotationalPattern || null,
      expirationDate: template.expirationDate || null,
      status: template.status || 'Active',
      description: template.description || '',
      flexibleStartWindow: template.flexibleStartWindow,
      flexibleEndWindow: template.flexibleEndWindow,
      requiredHours: template.requiredHours,
      workDaysPerWeek: template.workDaysPerWeek,
      hoursPerDay: template.hoursPerDay,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    // Check permissions before deleting
    if (!canManageTemplates()) {
      setError('You do not have permission to delete shift templates. Please contact HR Manager or System Admin.');
      return;
    }
    if (!confirm('Are you sure you want to delete this shift template?')) return;

    try {
      await deleteShiftTemplate(id);
      setSuccess('Shift template deleted successfully');
      loadTemplates();
    } catch (err: any) {
      // Handle 403 Forbidden errors specifically
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to delete shift templates. Please contact HR Manager or System Admin.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to delete shift template');
      }
    }
  };

  const handleRestDayToggle = (day: string) => {
    const currentRestDays = formData.restDays || [];
    if (currentRestDays.includes(day)) {
      setFormData({ ...formData, restDays: currentRestDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, restDays: [...currentRestDays, day] });
    }
  };

  const getShiftTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal Shift',
      split: 'Split Shift',
      overnight: 'Overnight Shift',
      rotational: 'Rotational Shift',
      flexible: 'Flexible Hours',
      compressed: 'Compressed Workweek',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-500/20 text-green-300 border-green-400/30',
      Inactive: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      Expired: 'bg-red-500/20 text-red-300 border-red-400/30',
      Cancelled: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    };
    return colors[status] || colors.Inactive;
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
          <h2 className="text-2xl font-semibold mb-2 text-white">Shift Templates</h2>
          <p className="text-gray-400 text-sm">Create and manage shift templates for different work arrangements</p>
        </div>
        {canManageTemplates() && (
          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({
                name: '',
                type: 'normal',
                startTime: '09:00',
                endTime: '17:00',
                gracePeriod: 15,
                isOvernight: false,
                status: 'Active',
                restDays: [],
              });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
          >
            + Create Shift Template
          </button>
        )}
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {getShiftTypeLabel(template.type)}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(template.status || 'Inactive')}`}>
                {template.status || 'Inactive'}
              </span>
            </div>

            {template.type !== 'flexible' && template.type !== 'compressed' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Time</p>
                <p className="text-white">
                  {template.startTime} - {template.endTime}
                </p>
                {template.isOvernight && (
                  <span className="text-xs text-cyan-300 mt-1 block">🌙 Overnight Shift</span>
                )}
              </div>
            )}

            {template.type === 'flexible' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Flexible Window</p>
                <p className="text-white text-sm">
                  {template.flexibleStartWindow} - {template.flexibleEndWindow}
                </p>
                <p className="text-white text-sm mt-1">
                  Required: {template.requiredHours} hours
                </p>
              </div>
            )}

            {template.type === 'compressed' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Compressed Schedule</p>
                <p className="text-white text-sm">
                  {template.workDaysPerWeek} days/week × {template.hoursPerDay} hours/day
                </p>
              </div>
            )}

            {template.restDays && template.restDays.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Rest Days</p>
                <p className="text-white text-sm">{template.restDays.join(', ')}</p>
              </div>
            )}

            {template.description && (
              <p className="text-sm text-gray-400 mb-4">{template.description}</p>
            )}

            {canManageTemplates() && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => template._id && handleDelete(template._id)}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
            {!canManageTemplates() && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-300 text-xs">
                  ⚠️ You don't have permission to edit or delete shift templates. Contact HR Manager or System Admin.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No shift templates found</p>
          {canManageTemplates() && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl"
            >
              Create Your First Template
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">
                {editingTemplate ? 'Edit Shift Template' : 'Create Shift Template'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>{success}</span>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shift Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                  placeholder="e.g., Morning Shift, Night Shift"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Shift Type *</label>
                <select
                  required
                  value={formData.type || 'normal'}
                  onChange={(e) => {
                    const newType = e.target.value as ShiftTemplate['type'];
                    setFormData({
                      ...formData,
                      type: newType,
                      // Reset type-specific fields when changing type
                      startTime: ['normal', 'split', 'overnight', 'rotational'].includes(newType) ? formData.startTime : undefined,
                      endTime: ['normal', 'split', 'overnight', 'rotational'].includes(newType) ? formData.endTime : undefined,
                      flexibleStartWindow: newType === 'flexible' ? formData.flexibleStartWindow : undefined,
                      flexibleEndWindow: newType === 'flexible' ? formData.flexibleEndWindow : undefined,
                      requiredHours: newType === 'flexible' ? formData.requiredHours : undefined,
                      workDaysPerWeek: newType === 'compressed' ? formData.workDaysPerWeek : undefined,
                      hoursPerDay: newType === 'compressed' ? formData.hoursPerDay : undefined,
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                >
                  <option value="normal">Normal Shift</option>
                  <option value="split">Split Shift</option>
                  <option value="overnight">Overnight Shift</option>
                  <option value="rotational">Rotational Shift</option>
                  <option value="flexible">Flexible Hours</option>
                  <option value="compressed">Compressed Workweek</option>
                </select>
              </div>

              {/* Standard Time Fields (for normal, split, overnight, rotational) */}
              {['normal', 'split', 'overnight', 'rotational'].includes(formData.type || '') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">End Time *</label>
                      <input
                        type="time"
                        required
                        value={formData.endTime || ''}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                      />
                    </div>
                  </div>

                  {formData.type === 'overnight' && (
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isOvernight || false}
                          onChange={(e) => setFormData({ ...formData, isOvernight: e.target.checked })}
                          className="w-4 h-4 rounded bg-white/5 border-white/10"
                        />
                        <span className="text-sm text-gray-400">Overnight Shift (crosses midnight)</span>
                      </label>
                    </div>
                  )}

                  {formData.type === 'rotational' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rotational Pattern</label>
                      <input
                        type="text"
                        value={formData.rotationalPattern || ''}
                        onChange={(e) => setFormData({ ...formData, rotationalPattern: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                        placeholder="e.g., 4-on/3-off, 6-on/2-off"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Flexible Hours Fields */}
              {formData.type === 'flexible' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Flexible Start Window *</label>
                      <input
                        type="time"
                        required
                        value={formData.flexibleStartWindow || ''}
                        onChange={(e) => setFormData({ ...formData, flexibleStartWindow: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Flexible End Window *</label>
                      <input
                        type="time"
                        required
                        value={formData.flexibleEndWindow || ''}
                        onChange={(e) => setFormData({ ...formData, flexibleEndWindow: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Required Hours *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="24"
                      value={formData.requiredHours || ''}
                      onChange={(e) => setFormData({ ...formData, requiredHours: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                      placeholder="8"
                    />
                  </div>
                </>
              )}

              {/* Compressed Workweek Fields */}
              {formData.type === 'compressed' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Work Days Per Week *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="7"
                        value={formData.workDaysPerWeek || ''}
                        onChange={(e) => setFormData({ ...formData, workDaysPerWeek: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Hours Per Day *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="24"
                        value={formData.hoursPerDay || ''}
                        onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Grace Period (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.gracePeriod || 15}
                  onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rest Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleRestDayToggle(day)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        formData.restDays?.includes(day)
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 text-white"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
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
