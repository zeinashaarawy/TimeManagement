import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Settings, Clock, Calendar, X } from "lucide-react";
import { shiftTemplateApi } from "../../../lib/api";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

interface ShiftTemplate {
  _id: string;
  name: string;
  type: string;
  startTime?: string;
  endTime?: string;
  restDays: string[];
  gracePeriod: number;
  isOvernight: boolean;
  rotationalPattern?: string | null;
  expirationDate?: Date | null;
  status: string;
  description?: string;
  flexibleStartWindow?: string;
  flexibleEndWindow?: string;
  requiredHours?: number;
  workDaysPerWeek?: number;
  hoursPerDay?: number;
}

export default function ShiftsTemplates({ asTab = false }: { asTab?: boolean } = {}) {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shiftTemplateApi.getAll();
      const data = response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading shift templates:", err);
      setError(err.response?.data?.message || err.message || "Failed to load shift templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift template?')) return;
    try {
      await shiftTemplateApi.delete(id);
      await loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete shift template');
    }
  };

  const handleEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const canEdit = userRole === 'HR Manager' || userRole === 'System Admin' || userRole === 'HR Admin';

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
              <h1 className="text-4xl lg:text-5xl font-light mb-2">Shift Templates</h1>
              <p className="text-gray-400">Manage shift templates for your organization</p>
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Shift Template
              </button>
            )}
          </div>
        </div>
      )}

      {asTab && canEdit && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Shift Template
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
          <p className="mt-4 text-gray-400">Loading shift templates...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-20">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
              <Settings className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
          </div>
          <h3 className="text-xl text-gray-300 mb-2">No Shift Templates</h3>
          <p className="text-gray-500">Create your first shift template to get started</p>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && templates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template._id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all" />
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl text-white mb-1">{template.name}</h3>
                    <span className="inline-block px-3 py-1 rounded-full text-xs bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      {template.type}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  {template.startTime && template.endTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{template.startTime} - {template.endTime}</span>
                    </div>
                  )}
                  {template.flexibleStartWindow && template.flexibleEndWindow && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Flexible: {template.flexibleStartWindow} - {template.flexibleEndWindow}</span>
                    </div>
                  )}
                  {template.workDaysPerWeek && template.hoursPerDay && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{template.workDaysPerWeek} days/week, {template.hoursPerDay} hrs/day</span>
                    </div>
                  )}
                  {template.restDays && template.restDays.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Rest: {template.restDays.join(', ')}</span>
                    </div>
                  )}
                  {template.gracePeriod > 0 && (
                    <div className="text-xs text-gray-500">
                      Grace Period: {template.gracePeriod} minutes
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className={`text-xs px-2 py-1 rounded ${
                    template.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                    template.status === 'Inactive' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {template.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <ShiftTemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={loadTemplates}
        />
      )}
    </div>
  );

  return asTab ? content : (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12">
      {content}
    </div>
  );
}

// Shift Template Modal Component
function ShiftTemplateModal({
  template,
  onClose,
  onSuccess,
}: {
  template: ShiftTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'normal',
    startTime: '',
    endTime: '',
    restDays: [] as string[],
    gracePeriod: 0,
    isOvernight: false,
    rotationalPattern: '',
    expirationDate: '',
    status: 'Active',
    description: '',
    flexibleStartWindow: '',
    flexibleEndWindow: '',
    requiredHours: 8,
    workDaysPerWeek: 5,
    hoursPerDay: 8,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        type: template.type || 'normal',
        startTime: template.startTime || '',
        endTime: template.endTime || '',
        restDays: template.restDays || [],
        gracePeriod: template.gracePeriod || 0,
        isOvernight: template.isOvernight || false,
        rotationalPattern: template.rotationalPattern || '',
        expirationDate: template.expirationDate ? new Date(template.expirationDate).toISOString().split('T')[0] : '',
        status: template.status || 'Active',
        description: template.description || '',
        flexibleStartWindow: template.flexibleStartWindow || '',
        flexibleEndWindow: template.flexibleEndWindow || '',
        requiredHours: template.requiredHours || 8,
        workDaysPerWeek: template.workDaysPerWeek || 5,
        hoursPerDay: template.hoursPerDay || 8,
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name,
        type: formData.type,
        restDays: formData.restDays,
        gracePeriod: formData.gracePeriod,
        status: formData.status,
      };

      if (formData.description) payload.description = formData.description;
      if (formData.expirationDate) payload.expirationDate = new Date(formData.expirationDate).toISOString();

      if (['normal', 'split', 'overnight', 'rotational'].includes(formData.type)) {
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
        if (formData.type === 'rotational' && formData.rotationalPattern) {
          payload.rotationalPattern = formData.rotationalPattern;
        }
      }

      if (formData.type === 'flexible') {
        payload.flexibleStartWindow = formData.flexibleStartWindow;
        payload.flexibleEndWindow = formData.flexibleEndWindow;
        payload.requiredHours = formData.requiredHours;
      }

      if (formData.type === 'compressed') {
        payload.workDaysPerWeek = formData.workDaysPerWeek;
        payload.hoursPerDay = formData.hoursPerDay;
      }

      if (template) {
        await shiftTemplateApi.update(template._id, payload);
      } else {
        await shiftTemplateApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving shift template:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save shift template');
    } finally {
      setLoading(false);
    }
  };

  const toggleRestDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      restDays: prev.restDays.includes(day)
        ? prev.restDays.filter(d => d !== day)
        : [...prev.restDays, day],
    }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-white">
            {template ? 'Edit Shift Template' : 'Create Shift Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="normal">Normal</option>
              <option value="split">Split</option>
              <option value="overnight">Overnight</option>
              <option value="rotational">Rotational</option>
              <option value="flexible">Flexible</option>
              <option value="compressed">Compressed</option>
            </select>
          </div>

          {['normal', 'split', 'overnight', 'rotational'].includes(formData.type) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
              {formData.type === 'rotational' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rotational Pattern *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 4-on/3-off"
                    value={formData.rotationalPattern}
                    onChange={(e) => setFormData({ ...formData, rotationalPattern: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              )}
            </>
          )}

          {formData.type === 'flexible' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Flexible Start Window *</label>
                  <input
                    type="time"
                    required
                    value={formData.flexibleStartWindow}
                    onChange={(e) => setFormData({ ...formData, flexibleStartWindow: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Flexible End Window *</label>
                  <input
                    type="time"
                    required
                    value={formData.flexibleEndWindow}
                    onChange={(e) => setFormData({ ...formData, flexibleEndWindow: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Required Hours *</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={formData.requiredHours}
                  onChange={(e) => setFormData({ ...formData, requiredHours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </>
          )}

          {formData.type === 'compressed' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Work Days Per Week *</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={formData.workDaysPerWeek}
                    onChange={(e) => setFormData({ ...formData, workDaysPerWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Hours Per Day *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={formData.hoursPerDay}
                    onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Rest Days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleRestDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    formData.restDays.includes(day)
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Grace Period (minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.gracePeriod}
                onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Expiration Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

