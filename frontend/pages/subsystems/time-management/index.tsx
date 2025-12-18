import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Plus, Edit, Trash2, Users, Settings, ChevronRight, X, Bell, AlertTriangle, CheckCircle, XCircle, Ban, ArrowUp, Calendar } from 'lucide-react';
import { shiftTemplateApi, shiftAssignmentApi, shiftExpiryApi, schedulingRulesApi } from '../../../lib/api';

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

interface ShiftAssignment {
  _id: string;
  shiftTemplateId: string | { _id: string; name: string; [key: string]: any };
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  assignedBy: string;
  source: string;
  status: string;
  metadata?: {
    notes?: string;
    reason?: string;
  };
}

interface ShiftExpiryNotification {
  _id: string;
  shiftTemplateId?: string | { _id: string; name: string; [key: string]: any };
  scheduleAssignmentId?: string;
  expiryDate: string;
  notificationSent: boolean;
  notificationSentAt?: string;
  notifiedTo: string[];
  status: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function TimeManagement() {
  const [activeTab, setActiveTab] = useState<'templates' | 'assignments' | 'notifications' | 'scheduling-rules'>('templates');
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [expiryNotifications, setExpiryNotifications] = useState<ShiftExpiryNotification[]>([]);
  const [schedulingRules, setSchedulingRules] = useState<SchedulingRule[]>([]);
  const [userRole, setUserRole] = useState<string>('SYSTEM_ADMIN');
  const [mounted, setMounted] = useState(false);

  // Load user role from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'SYSTEM_ADMIN';
      setUserRole(role);
    }
  }, []);

  // Get current user ID from localStorage (set by authentication)
  const getCurrentUserId = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || 'dev-user-123'; // Fallback for development
    }
    return 'dev-user-123';
  };

  const [loading, setLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showSchedulingRuleModal, setShowSchedulingRuleModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<ShiftExpiryNotification | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [editingSchedulingRule, setEditingSchedulingRule] = useState<SchedulingRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null); // Clear errors when switching tabs
    loadShiftTemplates();
    loadAssignments();
    if (activeTab === 'notifications') {
      loadExpiryNotifications();
    }
    if (activeTab === 'scheduling-rules') {
      loadSchedulingRules();
    }
  }, [activeTab]);

  const loadShiftTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading shift templates...');
      const response = await shiftTemplateApi.getAll();
      console.log('✅ Shift templates response:', response);
      console.log('📊 Shift templates response.data:', response.data);
      console.log('📊 Response type:', typeof response.data);
      console.log('📊 Is array?', Array.isArray(response.data));
      console.log('📊 Length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      // Handle different response formats
      let templates = response.data;
      if (Array.isArray(response.data)) {
        templates = response.data;
      } else if (Array.isArray(response)) {
        templates = response;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        templates = response.data.data;
      }
      
      console.log('📊 Final templates to set:', templates);
      console.log('📊 Final templates count:', templates?.length || 0);
      setShiftTemplates(templates || []);
    } catch (err: any) {
      console.error('❌ Error loading shift templates:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        stack: err.stack,
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load shift templates';
      setError(errorMessage);
      setShiftTemplates([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading shift assignments...');
      const response = await shiftAssignmentApi.query({});
      console.log('✅ Shift assignments response:', response);
      console.log('📊 Shift assignments data:', response.data);
      setAssignments(response.data || []);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load assignments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift template?')) return;
    try {
      await shiftTemplateApi.delete(id);
      await loadShiftTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete shift template');
    }
  };

  const handleEditTemplate = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const loadSchedulingRules = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await schedulingRulesApi.getAll();
      setSchedulingRules(response.data || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access forbidden. You need HR_ADMIN, HR Manager, or SYSTEM_ADMIN role to view scheduling rules.');
      } else {
        setError(err.response?.data?.message || 'Failed to load scheduling rules');
      }
      setSchedulingRules([]); // Clear rules on error
    } finally {
      setLoading(false);
    }
  };

  const loadExpiryNotifications = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await shiftExpiryApi.getNotifications();
      setExpiryNotifications(response.data || []);
      // Clear error on success
      setError(null);
    } catch (err: any) {
      // For 500 errors or any server errors, handle silently
      // Don't show error message to user - they'll see "No Expiry Notifications" instead
      if (err.response?.status === 500 || err.response?.status >= 500) {
        // Silently handle 500 errors - don't log to console.error to avoid Next.js error overlay
        setExpiryNotifications([]);
        setError(null); // Don't show error message
        return; // Exit early to avoid any further error handling
      }
      
      // For other errors (400, 404, etc.), log and show the error message
      console.error('Error loading expiry notifications:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (errorMessage) {
        setError(errorMessage);
      } else {
        // Unknown error - just show empty state
        setExpiryNotifications([]);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignmentStatus = (assignment: ShiftAssignment) => {
    setSelectedAssignment(assignment);
    setShowStatusModal(true);
  };

  const handleCloseModal = () => {
    setShowTemplateModal(false);
    setShowAssignmentModal(false);
    setShowStatusModal(false);
    setEditingTemplate(null);
    setSelectedAssignment(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl blur-sm group-hover:blur-md transition-all opacity-0 group-hover:opacity-100" />
                <div className="relative bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all">
                  <ArrowUp className="w-5 h-5 text-white" />
                </div>
              </Link>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl blur-md" />
                <div className="relative bg-gradient-to-br from-teal-600 to-emerald-600 p-3 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-light text-white">Time Management</h1>
                <p className="text-gray-400 mt-1">Shift Setup and Scheduling</p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'templates' && (userRole === 'SYSTEM_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR Manager') && (
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateModal(true);
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Shift Template
                  </div>
                </button>
              )}
              {activeTab === 'assignments' && (userRole === 'SYSTEM_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR Manager') && (
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Assign Shift
                  </div>
                </button>
              )}
              {activeTab === 'scheduling-rules' && userRole === 'HR Manager' && (
                <button
                  onClick={() => {
                    setEditingSchedulingRule(null);
                    setShowSchedulingRuleModal(true);
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Rule
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 relative ${
              activeTab === 'templates'
                ? 'text-teal-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Shift Templates
            {activeTab === 'templates' && (
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 relative ${
              activeTab === 'assignments'
                ? 'text-teal-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Shift Assignments
            {activeTab === 'assignments' && (
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
            )}
          </button>
          {(userRole === 'HR_ADMIN' || userRole === 'HR Manager' || userRole === 'SYSTEM_ADMIN') && (
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 relative flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'text-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              Expiry Notifications
              {expiryNotifications.filter(n => n.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                  {expiryNotifications.filter(n => n.status === 'pending').length}
                </span>
              )}
              {activeTab === 'notifications' && (
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
              )}
            </button>
          )}
          {(userRole === 'HR_ADMIN' || userRole === 'HR Manager' || userRole === 'SYSTEM_ADMIN') && (
            <button
              onClick={() => setActiveTab('scheduling-rules')}
              className={`px-6 py-3 relative flex items-center gap-2 ${
                activeTab === 'scheduling-rules'
                  ? 'text-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Scheduling Rules
              {activeTab === 'scheduling-rules' && (
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'templates' && (
          <ShiftTemplatesList
            templates={shiftTemplates}
            loading={loading}
            onEdit={(userRole === 'SYSTEM_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR Manager') ? handleEditTemplate : undefined}
            onDelete={(userRole === 'SYSTEM_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR Manager') ? handleDeleteTemplate : undefined}
            onRefresh={loadShiftTemplates}
            userRole={userRole}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsList
            assignments={assignments}
            templates={shiftTemplates}
            loading={loading}
            onRefresh={loadAssignments}
            onUpdateStatus={(userRole === 'HR_ADMIN' || userRole === 'HR Manager' || userRole === 'SYSTEM_ADMIN') ? handleUpdateAssignmentStatus : undefined}
            userRole={userRole}
          />
        )}

        {activeTab === 'notifications' && (
          <ExpiryNotificationsList
            notifications={expiryNotifications}
            templates={shiftTemplates}
            loading={loading}
            onRefresh={loadExpiryNotifications}
            onRenew={(notification) => {
              console.log('Renew button clicked:', notification);
              setSelectedNotification(notification);
              setShowRenewModal(true);
            }}
            onResolve={(notification) => {
              setSelectedNotification(notification);
              setShowResolveModal(true);
            }}
          />
        )}

        {activeTab === 'scheduling-rules' && (
          <SchedulingRulesList
            rules={schedulingRules}
            templates={shiftTemplates}
            loading={loading}
            userRole={userRole}
            onRefresh={loadSchedulingRules}
            onEdit={userRole === 'HR Manager' ? (rule) => {
              setEditingSchedulingRule(rule);
              setShowSchedulingRuleModal(true);
            } : undefined}
            onDelete={userRole === 'HR Manager' ? async (id: string) => {
              if (!confirm('Are you sure you want to delete this scheduling rule?')) return;
              try {
                setLoading(true);
                await schedulingRulesApi.delete(id);
                await loadSchedulingRules();
              } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete scheduling rule');
              } finally {
                setLoading(false);
              }
            } : undefined}
            onToggleActive={userRole === 'HR Manager' ? async (id: string) => {
              try {
                setLoading(true);
                await schedulingRulesApi.toggleActive(id);
                await loadSchedulingRules();
              } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to toggle rule status');
              } finally {
                setLoading(false);
              }
            } : undefined}
          />
        )}
      </div>

      {/* Shift Template Modal */}
      {showTemplateModal && (
        <ShiftTemplateModal
          template={editingTemplate}
          onClose={handleCloseModal}
          onSuccess={loadShiftTemplates}
        />
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <ShiftAssignmentModal
          templates={shiftTemplates}
          onClose={handleCloseModal}
          onSuccess={loadAssignments}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAssignment && (
        <StatusUpdateModal
          assignment={selectedAssignment}
          onClose={handleCloseModal}
          onSuccess={loadAssignments}
        />
      )}

      {/* Renew/Extend Modal */}
      {showRenewModal && selectedNotification && (
        <RenewAssignmentModal
          notification={selectedNotification}
          onClose={() => {
            setShowRenewModal(false);
            setSelectedNotification(null);
          }}
          onSuccess={() => {
            loadAssignments();
            loadExpiryNotifications();
          }}
        />
      )}

      {/* Resolve Notification Modal */}
      {showResolveModal && selectedNotification && (
        <ResolveNotificationModal
          notification={selectedNotification}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedNotification(null);
          }}
          onSuccess={loadExpiryNotifications}
        />
      )}

      {/* Scheduling Rule Modal */}
      {showSchedulingRuleModal && (
        <SchedulingRuleModal
          rule={editingSchedulingRule}
          templates={shiftTemplates}
          onClose={() => {
            setShowSchedulingRuleModal(false);
            setEditingSchedulingRule(null);
          }}
          onSuccess={loadSchedulingRules}
        />
      )}
    </div>
  );
}

// Shift Templates List Component
function ShiftTemplatesList({
  templates,
  loading,
  onEdit,
  onDelete,
  onRefresh,
  userRole,
}: {
  templates: ShiftTemplate[];
  loading: boolean;
  onEdit?: (template: ShiftTemplate) => void;
  onDelete?: (id: string) => void;
  onRefresh: () => void;
  userRole: string;
}) {
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-gray-400">Loading shift templates...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
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
    );
  }

  return (
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
              {(userRole === 'SYSTEM_ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR Manager') && (
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(template)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(template._id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  )}
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
  );
}

// Assignments List Component
function AssignmentsList({
  assignments,
  templates,
  loading,
  onRefresh,
  onUpdateStatus,
  userRole,
}: {
  assignments: ShiftAssignment[];
  templates: ShiftTemplate[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus?: (assignment: ShiftAssignment) => void;
  userRole?: string;
}) {
  const getTemplateName = (templateIdOrObj: string | { _id: string; name: string; [key: string]: any }) => {
    // Handle both cases: when backend returns populated object or just ID
    if (typeof templateIdOrObj === 'object' && templateIdOrObj !== null) {
      return templateIdOrObj.name || 'Unknown';
    }
    const template = templates.find(t => t._id === templateIdOrObj);
    return template?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-gray-400">Loading assignments...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto" />
          </div>
        </div>
        <h3 className="text-xl text-gray-300 mb-2">No Assignments</h3>
        <p className="text-gray-500">Assign shifts to employees, departments, or positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment._id} className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg text-white mb-2">{getTemplateName(assignment.shiftTemplateId)}</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span className="text-gray-500">Assignment Type: </span>
                    {assignment.employeeId && <span>Employee</span>}
                    {assignment.departmentId && <span>Department</span>}
                    {assignment.positionId && <span>Position</span>}
                  </div>
                  <div>
                    <span className="text-gray-500">Effective From: </span>
                    <span>{new Date(assignment.effectiveFrom).toLocaleDateString()}</span>
                  </div>
                  {assignment.effectiveTo && (
                    <div>
                      <span className="text-gray-500">Effective To: </span>
                      <span>{new Date(assignment.effectiveTo).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Source: </span>
                    <span className="capitalize">{assignment.source}</span>
                  </div>
                </div>
                {assignment.metadata?.reason && (
                  <div className="mt-3 text-sm text-gray-400">
                    <span className="text-gray-500">Reason: </span>
                    {assignment.metadata.reason}
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  assignment.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  assignment.status === 'Inactive' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                  assignment.status === 'Approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {assignment.status}
                </span>
                {onUpdateStatus && (userRole === 'HR_ADMIN' || userRole === 'HR Manager' || userRole === 'SYSTEM_ADMIN') && (
                  <button
                    onClick={() => onUpdateStatus(assignment)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Update Status"
                  >
                    <Edit className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
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
    useCustomPattern: false,
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
      const pattern = template.rotationalPattern || '';
      const standardPatterns = ['4-on/3-off', '5-on/2-off', '6-on/1-off', '7-on/7-off', '2-on/2-off', '3-on/3-off'];
      setFormData({
        name: template.name || '',
        type: template.type || 'normal',
        startTime: template.startTime || '',
        endTime: template.endTime || '',
        restDays: template.restDays || [],
        gracePeriod: template.gracePeriod || 0,
        isOvernight: template.isOvernight || false,
        rotationalPattern: pattern,
        useCustomPattern: !!(pattern && !standardPatterns.includes(pattern)),
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

      // Add type-specific fields
      if (['normal', 'split', 'overnight', 'rotational'].includes(formData.type)) {
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
        // isOvernight is determined by the shift type selection (overnight type)
        if (formData.type === 'rotational') {
          if (!formData.rotationalPattern || formData.rotationalPattern.trim() === '') {
            setError('Rotational pattern is required for rotational shifts');
            setLoading(false);
            return;
          }
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
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to save shift template';
      setError(errorMessage);
      
      // Log full error for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
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
                  <select
                    required
                    value={formData.rotationalPattern || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'custom') {
                        setFormData({ 
                          ...formData, 
                          useCustomPattern: true,
                          rotationalPattern: ''
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          useCustomPattern: false,
                          rotationalPattern: value
                        });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 mb-3"
                  >
                    <option value="">Select a pattern...</option>
                    <option value="4-on/3-off">4 days on / 3 days off</option>
                    <option value="5-on/2-off">5 days on / 2 days off</option>
                    <option value="6-on/1-off">6 days on / 1 day off</option>
                    <option value="7-on/7-off">7 days on / 7 days off</option>
                    <option value="2-on/2-off">2 days on / 2 days off</option>
                    <option value="3-on/3-off">3 days on / 3 days off</option>
                    <option value="custom">Custom Pattern (enter below)</option>
                  </select>
                  {formData.useCustomPattern && (
                    <input
                      type="text"
                      required
                      placeholder="e.g., 4-on/3-off, 5-on/2-off, or custom pattern"
                      value={formData.rotationalPattern}
                      onChange={(e) => setFormData({ ...formData, rotationalPattern: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Common patterns: 4-on/3-off (4 working days, 3 rest days), 5-on/2-off (standard workweek)
                  </p>
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
            <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
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

// Shift Assignment Modal Component
function ShiftAssignmentModal({
  templates,
  onClose,
  onSuccess,
}: {
  templates: ShiftTemplate[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [assignmentType, setAssignmentType] = useState<'single' | 'bulk'>('single');
  const [formData, setFormData] = useState({
    shiftTemplateId: '',
    employeeId: '',
    departmentId: '',
    positionId: '',
    employeeIds: [] as string[],
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (assignmentType === 'single') {
        // Trim and validate input fields
        const employeeId = formData.employeeId?.trim() || '';
        const departmentId = formData.departmentId?.trim() || '';
        const positionId = formData.positionId?.trim() || '';

        // Validate: Exactly ONE target must be provided
        const targetCount = [employeeId, departmentId, positionId].filter(Boolean).length;
        if (targetCount === 0) {
          setError('Please provide either an Employee ID, Department ID, or Position ID');
          setLoading(false);
          return;
        }
        if (targetCount > 1) {
          setError('Please provide only ONE target: either Employee ID, Department ID, or Position ID (not multiple)');
          setLoading(false);
          return;
        }

        // Validate dates - prevent past dates
        const effectiveFromDate = new Date(formData.effectiveFrom);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (effectiveFromDate < today) {
          setError('Effective From date cannot be in the past');
          setLoading(false);
          return;
        }

        // assignedBy is automatically set by backend from authenticated user (req.user)
        // We don't send it to prevent manipulation - backend handles it securely
        const payload: any = {
          shiftTemplateId: formData.shiftTemplateId.trim(),
          effectiveFrom: effectiveFromDate.toISOString(),
        };

        if (formData.effectiveTo?.trim()) {
          const effectiveToDate = new Date(formData.effectiveTo);
          if (effectiveToDate < effectiveFromDate) {
            setError('Effective To date must be on or after Effective From date');
            setLoading(false);
            return;
          }
          if (effectiveToDate < today) {
            setError('Effective To date cannot be in the past');
            setLoading(false);
            return;
          }
          payload.effectiveTo = effectiveToDate.toISOString();
        }

        // Only include the ONE selected target
        if (employeeId) payload.employeeId = employeeId;
        if (departmentId) payload.departmentId = departmentId;
        if (positionId) payload.positionId = positionId;

        if (formData.reason?.trim()) {
          payload.metadata = { reason: formData.reason.trim() };
        }

        await shiftAssignmentApi.assign(payload);
      } else {
        // Trim and validate input fields
        const employeeIds = formData.employeeIds.map(id => id.trim()).filter(Boolean);
        const departmentId = formData.departmentId?.trim() || '';
        const positionId = formData.positionId?.trim() || '';

        // Validate: Exactly ONE target must be provided
        const targetCount = [
          employeeIds.length > 0 ? 'employeeIds' : null,
          departmentId ? 'departmentId' : null,
          positionId ? 'positionId' : null,
        ].filter(Boolean).length;

        if (targetCount === 0) {
          setError('Please provide either Employee IDs, Department ID, or Position ID');
          setLoading(false);
          return;
        }
        if (targetCount > 1) {
          setError('Please provide only ONE target: either Employee IDs, Department ID, or Position ID (not multiple)');
          setLoading(false);
          return;
        }

        // Validate dates - prevent past dates
        const effectiveFromDate = new Date(formData.effectiveFrom);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (effectiveFromDate < today) {
          setError('Effective From date cannot be in the past');
          setLoading(false);
          return;
        }

        // assignedBy is automatically set by backend from authenticated user (req.user)
        // We don't send it to prevent manipulation - backend handles it securely
        const payload: any = {
          shiftTemplateId: formData.shiftTemplateId.trim(),
          effectiveFrom: effectiveFromDate.toISOString(),
        };

        if (formData.effectiveTo?.trim()) {
          const effectiveToDate = new Date(formData.effectiveTo);
          if (effectiveToDate < effectiveFromDate) {
            setError('Effective To date must be on or after Effective From date');
            setLoading(false);
            return;
          }
          if (effectiveToDate < today) {
            setError('Effective To date cannot be in the past');
            setLoading(false);
            return;
          }
          payload.effectiveTo = effectiveToDate.toISOString();
        }

        // Only include the ONE selected target
        if (employeeIds.length > 0) payload.employeeIds = employeeIds;
        if (departmentId) payload.departmentId = departmentId;
        if (positionId) payload.positionId = positionId;
        if (formData.reason?.trim()) payload.reason = formData.reason.trim();

        await shiftAssignmentApi.bulkAssign(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign shift';
      setError(errorMessage);
      console.error('Shift assignment error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-white">Assign Shift</h2>
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

          {/* Assignment Type Selection - Prominent at the top */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">Assignment Type *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAssignmentType('single')}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium ${
                  assignmentType === 'single'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Single Assignment
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType('bulk')}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium ${
                  assignmentType === 'bulk'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Bulk Assignment
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {assignmentType === 'single' 
                ? 'Assign shift to one employee, department, or position'
                : 'Assign shift to multiple employees, all employees in a department, or all employees with a position'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Shift Template *</label>
            <select
              required
              value={formData.shiftTemplateId}
              onChange={(e) => setFormData({ ...formData, shiftTemplateId: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="">Select a shift template</option>
              {templates.length === 0 ? (
                <option value="" disabled>No shift templates available. Create one first.</option>
              ) : (
                templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.type})
                  </option>
                ))
              )}
            </select>
            {templates.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Go to "Shift Templates" tab to create templates first</p>
            )}
          </div>

          {assignmentType === 'single' ? (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Assign To *</label>
                <p className="text-xs text-gray-500 mb-3">
                  Choose <strong>ONE</strong> target: assign to either an Employee, OR a Department, OR a Position (not multiple)
                </p>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Employee ID"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value, departmentId: '', positionId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  <div className="text-center text-gray-500 text-sm font-medium">OR</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Department ID"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, employeeId: '', positionId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  <div className="text-center text-gray-500 text-sm font-medium">OR</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Position ID"
                      value={formData.positionId}
                      onChange={(e) => setFormData({ ...formData, positionId: e.target.value, employeeId: '', departmentId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Employee IDs separated by comma"
                      value={formData.employeeIds.join(', ')}
                      onChange={(e) => setFormData({ ...formData, employeeIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean), departmentId: '', positionId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate employee IDs by comma
                    </p>
                  </div>
                  <div className="text-center text-gray-500 text-sm font-medium">OR</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Department ID"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, employeeIds: [], positionId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  <div className="text-center text-gray-500 text-sm font-medium">OR</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Position ID"
                      value={formData.positionId}
                      onChange={(e) => setFormData({ ...formData, positionId: e.target.value, employeeIds: [], departmentId: '' })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Effective From *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                value={formData.effectiveFrom}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  setFormData({ 
                    ...formData, 
                    effectiveFrom: selectedDate,
                    // If effectiveTo is before the new effectiveFrom, clear it
                    effectiveTo: formData.effectiveTo && selectedDate > formData.effectiveTo ? '' : formData.effectiveTo
                  });
                }}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Effective To (optional)</label>
              <input
                type="date"
                min={formData.effectiveFrom || new Date().toISOString().split('T')[0]} // Must be >= Effective From
                value={formData.effectiveTo}
                onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.effectiveFrom 
                  ? `Must be on or after ${new Date(formData.effectiveFrom).toLocaleDateString()}`
                  : 'Cannot select past dates'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Assigned By <span className="text-gray-500 text-xs">(Read-only)</span>
            </label>
          <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400">
            {mounted ? (localStorage.getItem('userId') || 'dev-user-123') : 'dev-user-123'} (Current User - {mounted ? (localStorage.getItem('userRole') || 'SYSTEM_ADMIN') : 'SYSTEM_ADMIN'})
          </div>
            <p className="text-xs text-gray-500 mt-1">
              ✓ This field is automatically set by the backend from your logged-in user. You don't need to enter anything here.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={2}
              placeholder="Reason for this shift assignment"
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
              {loading ? 'Assigning...' : 'Assign Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Expiry Notifications List Component
function ExpiryNotificationsList({
  notifications,
  templates,
  loading,
  onRefresh,
  onRenew,
  onResolve,
}: {
  notifications: ShiftExpiryNotification[];
  templates: ShiftTemplate[];
  loading: boolean;
  onRefresh: () => void;
  onRenew: (notification: ShiftExpiryNotification) => void;
  onResolve: (notification: ShiftExpiryNotification) => void;
}) {
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return 'Unknown';
    const template = templates.find(t => t._id === templateId);
    return template?.name || 'Unknown';
  };

  const handleTriggerDetection = async () => {
    try {
      setDetecting(true);
      setDetectMessage(null);
      const response = await shiftExpiryApi.triggerDetection(30);
      const count = response.data.notificationsCreated || 0;
      const message = response.data.message || `Created ${count} notification(s)`;
      
      if (count === 0) {
        setDetectMessage(`ℹ️ ${message}`);
      } else {
        setDetectMessage(`✅ ${message}`);
      }
      
      // Refresh notifications immediately after detection
      await onRefresh();
      
      // Clear message after 5 seconds (longer for the detailed message)
      setTimeout(() => {
        setDetectMessage(null);
      }, 5000);
    } catch (err: any) {
      setDetectMessage('❌ Failed to trigger detection. Check console for details.');
      console.error('Error triggering detection:', err);
    } finally {
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-gray-400">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Bell className="w-12 h-12 text-gray-400 mx-auto" />
          </div>
        </div>
        <h3 className="text-xl text-gray-300 mb-2">No Expiry Notifications</h3>
        <p className="text-gray-500 mb-6">All shifts are up to date</p>
        
        {/* Trigger Detection Button */}
        <div className="space-y-3">
          <button
            onClick={handleTriggerDetection}
            disabled={detecting}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {detecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Detect Expiring Shifts</span>
              </>
            )}
          </button>
          {detectMessage && (
            <div className={`text-sm p-3 rounded-xl whitespace-pre-line ${
              detectMessage.includes('✅') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : detectMessage.includes('ℹ️')
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {detectMessage}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Scans for shifts/assignments expiring within the next 30 days
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Note: Only assignments with "Effective To" dates within 30 days and status "Active" will be detected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh and detect buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-gray-300">
          Expiry Notifications ({notifications.length})
        </h3>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors text-sm"
          >
            Refresh
          </button>
          <button
            onClick={handleTriggerDetection}
            disabled={detecting}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {detecting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Bell className="w-3 h-3" />
                <span>Detect Expiring</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {detectMessage && (
        <div className={`p-3 rounded-xl text-sm whitespace-pre-line ${
          detectMessage.includes('✅') 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : detectMessage.includes('ℹ️')
            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {detectMessage}
        </div>
      )}

      {notifications.map((notification) => (
        <div key={notification._id} className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    notification.status === 'pending' ? 'text-yellow-400' :
                    notification.status === 'resolved' ? 'text-green-400' :
                    'text-gray-400'
                  }`} />
                  <h3 className="text-lg text-white">
                    {notification.shiftTemplateId 
                      ? `Shift Template: ${typeof notification.shiftTemplateId === 'object' && notification.shiftTemplateId !== null
                          ? notification.shiftTemplateId.name 
                          : getTemplateName(notification.shiftTemplateId as string)}`
                      : 'Shift Assignment Expiring'}
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span className="text-gray-500">Expiry Date: </span>
                    <span>{new Date(notification.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className="capitalize">{notification.status}</span>
                  </div>
                  {notification.notificationSent && (
                    <div>
                      <span className="text-gray-500">Notification Sent: </span>
                      <span>{notification.notificationSentAt ? new Date(notification.notificationSentAt).toLocaleDateString() : 'Yes'}</span>
                    </div>
                  )}
                  {notification.resolvedAt && (
                    <div>
                      <span className="text-gray-500">Resolved: </span>
                      <span>{new Date(notification.resolvedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {notification.resolutionNotes && (
                  <div className="mt-3 text-sm text-gray-400">
                    <span className="text-gray-500">Resolution Notes: </span>
                    {notification.resolutionNotes}
                  </div>
                )}
              </div>
              <div className="ml-4 flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  notification.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  notification.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {notification.status}
                </span>
                {notification.status === 'pending' && notification.scheduleAssignmentId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Renew button clicked for notification:', notification._id);
                        onRenew(notification);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg text-white text-xs hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      Renew
                    </button>
                    <button
                      onClick={() => onResolve(notification)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Resolve
                    </button>
                  </div>
                )}
                {notification.status === 'pending' && !notification.scheduleAssignmentId && (
                  <button
                    onClick={() => onResolve(notification)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Status Update Modal Component
function StatusUpdateModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: ShiftAssignment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(assignment.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = { status };
      if (reason) payload.reason = reason;

      await shiftAssignmentApi.updateStatus(assignment._id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-white">Update Assignment Status</h2>
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
            <label className="block text-sm text-gray-400 mb-2">Current Status</label>
            <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
              {assignment.status}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">New Status *</label>
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Approved">Approved</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for status change..."
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
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Renew/Extend Assignment Modal Component
function RenewAssignmentModal({
  notification,
  onClose,
  onSuccess,
}: {
  notification: ShiftExpiryNotification;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [effectiveTo, setEffectiveTo] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get assignment ID from notification
  const assignmentId = typeof notification.scheduleAssignmentId === 'string' 
    ? notification.scheduleAssignmentId 
    : (notification.scheduleAssignmentId as { _id: string } | undefined)?._id;

  // Log for debugging
  useEffect(() => {
    console.log('RenewAssignmentModal opened:', {
      notificationId: notification._id,
      assignmentId,
      expiryDate: notification.expiryDate,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!assignmentId) {
        setError('Assignment ID not found in notification');
        setLoading(false);
        return;
      }

      // Validate date is in the future
      const selectedDate = new Date(effectiveTo);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        setError('New expiry date must be in the future');
        setLoading(false);
        return;
      }

      const payload: any = {
        effectiveTo: new Date(effectiveTo).toISOString(),
      };
      if (reason.trim()) {
        payload.reason = reason.trim();
      }

      const response = await shiftAssignmentApi.renew(assignmentId, payload);
      console.log('Renew assignment successful:', response.data);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Renew assignment error:', err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to renew assignment';
      setError(errorMessage);
      
      // Log detailed error for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-white">Renew/Extend Assignment</h2>
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

          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm">
            <p>Current expiry date: <strong>{new Date(notification.expiryDate).toLocaleDateString()}</strong></p>
            <p className="mt-1">Extend this assignment to a new expiry date.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">New Expiry Date *</label>
            <input
              type="date"
              required
              min={minDate}
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for renewal/extension"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 mt-6">
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
              {loading ? 'Renewing...' : 'Renew Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Resolve Notification Modal Component
function ResolveNotificationModal({
  notification,
  onClose,
  onSuccess,
}: {
  notification: ShiftExpiryNotification;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {};
      if (resolutionNotes.trim()) {
        payload.resolutionNotes = resolutionNotes.trim();
      }

      await shiftExpiryApi.resolve(notification._id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-white">Resolve Notification</h2>
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

          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm">
            <p>Mark this notification as resolved. This indicates that the expiring shift/assignment has been handled (renewed, replaced, or closed).</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Resolution Notes (Optional)</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              placeholder="How was this resolved? (e.g., 'Renewed for 6 more months', 'Replaced with new shift template', 'Assignment closed')"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 mt-6">
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
              {loading ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Scheduling Rules List Component
function SchedulingRulesList({
  rules,
  templates,
  loading,
  userRole,
  onRefresh,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  rules: SchedulingRule[];
  templates: ShiftTemplate[];
  loading: boolean;
  userRole: string;
  onRefresh: () => void;
  onEdit?: (rule: SchedulingRule) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-gray-400">Loading scheduling rules...</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
            <Settings className="w-12 h-12 text-gray-400 mx-auto" />
          </div>
        </div>
        <h3 className="text-xl text-gray-300 mb-2">No Scheduling Rules</h3>
        <p className="text-gray-500 mb-4">Create your first scheduling rule to configure flexible hours, rotational patterns, or compressed workweeks</p>
        {userRole === 'HR Manager' && (
          <p className="text-sm text-gray-400">Click the "Create Rule" button above to get started</p>
        )}
        {userRole === 'SYSTEM_ADMIN' && (
          <p className="text-sm text-gray-400">View-only access. HR Manager can create and manage scheduling rules.</p>
        )}
      </div>
    );
  }

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

  return (
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

                {rule.departmentIds && rule.departmentIds.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Linked Departments</p>
                    <p className="text-sm text-gray-300">
                      {Array.isArray(rule.departmentIds) && typeof rule.departmentIds[0] === 'object'
                        ? rule.departmentIds.map((d: any) => d.name).join(', ')
                        : `${rule.departmentIds.length} department(s)`}
                    </p>
                  </div>
                )}

                {rule.shiftTemplateIds && rule.shiftTemplateIds.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Linked Shift Templates</p>
                    <p className="text-sm text-gray-300">
                      {Array.isArray(rule.shiftTemplateIds) && typeof rule.shiftTemplateIds[0] === 'object'
                        ? rule.shiftTemplateIds.map((t: any) => t.name).join(', ')
                        : `${rule.shiftTemplateIds.length} template(s)`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {userRole === 'HR Manager' && (
              <div className="flex gap-2 ml-4">
                {onToggleActive && (
                  <button
                    onClick={() => onToggleActive(rule._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.active
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    }`}
                    title={rule.active ? 'Disable Rule' : 'Enable Rule'}
                  >
                    {rule.active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(rule)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(rule._id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Scheduling Rule Modal Component
function SchedulingRuleModal({
  rule,
  templates,
  onClose,
  onSuccess,
}: {
  rule: SchedulingRule | null;
  templates: ShiftTemplate[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    type: rule?.type || 'FLEXIBLE' as 'FLEXIBLE' | 'ROTATIONAL' | 'COMPRESSED',
    flexInWindow: rule?.flexInWindow || '',
    flexOutWindow: rule?.flexOutWindow || '',
    rotationalPattern: rule?.rotationalPattern || '',
    workDaysPerWeek: rule?.workDaysPerWeek || 4,
    hoursPerDay: rule?.hoursPerDay || 10,
    active: rule?.active ?? true,
    description: rule?.description || '',
    departmentIds: rule?.departmentIds ? (Array.isArray(rule.departmentIds) && typeof rule.departmentIds[0] === 'object'
      ? rule.departmentIds.map((d: any) => d._id)
      : rule.departmentIds) as string[] : [],
    shiftTemplateIds: rule?.shiftTemplateIds ? (Array.isArray(rule.shiftTemplateIds) && typeof rule.shiftTemplateIds[0] === 'object'
      ? rule.shiftTemplateIds.map((t: any) => t._id)
      : rule.shiftTemplateIds) as string[] : [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        type: formData.type,
        active: formData.active,
      };

      if (formData.description) payload.description = formData.description;

      if (formData.type === 'FLEXIBLE') {
        payload.flexInWindow = formData.flexInWindow;
        payload.flexOutWindow = formData.flexOutWindow;
      } else if (formData.type === 'ROTATIONAL') {
        payload.rotationalPattern = formData.rotationalPattern;
      } else if (formData.type === 'COMPRESSED') {
        payload.workDaysPerWeek = formData.workDaysPerWeek;
        payload.hoursPerDay = formData.hoursPerDay;
      }

      if (formData.departmentIds.length > 0) payload.departmentIds = formData.departmentIds;
      if (formData.shiftTemplateIds.length > 0) payload.shiftTemplateIds = formData.shiftTemplateIds;

      if (rule) {
        await schedulingRulesApi.update(rule._id, payload);
      } else {
        await schedulingRulesApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      let errorMessage = 'Failed to save scheduling rule';
      if (err.response?.status === 403) {
        errorMessage = 'Access forbidden. You need HR_ADMIN or SYSTEM_ADMIN role to create/edit scheduling rules.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-white">{rule ? 'Edit Scheduling Rule' : 'Create Scheduling Rule'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Rule Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Flexible Morning Hours"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Rule Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            >
              <option value="FLEXIBLE">Flexible Hours</option>
              <option value="ROTATIONAL">Rotational Pattern</option>
              <option value="COMPRESSED">Compressed Workweek</option>
            </select>
          </div>

          {formData.type === 'FLEXIBLE' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Flex-In Window *</label>
                <input
                  type="text"
                  required
                  value={formData.flexInWindow}
                  onChange={(e) => setFormData({ ...formData, flexInWindow: e.target.value })}
                  placeholder="e.g., 08:00-10:00"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                />
                <p className="text-xs text-gray-500 mt-1">Time range when employees can start work</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Flex-Out Window *</label>
                <input
                  type="text"
                  required
                  value={formData.flexOutWindow}
                  onChange={(e) => setFormData({ ...formData, flexOutWindow: e.target.value })}
                  placeholder="e.g., 17:00-19:00"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                />
                <p className="text-xs text-gray-500 mt-1">Time range when employees can end work</p>
              </div>
            </>
          )}

          {formData.type === 'ROTATIONAL' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Rotational Pattern *</label>
              <input
                type="text"
                required
                value={formData.rotationalPattern}
                onChange={(e) => setFormData({ ...formData, rotationalPattern: e.target.value })}
                placeholder="e.g., 2 days morning, 2 days night"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Describe the rotational work pattern</p>
            </div>
          )}

          {formData.type === 'COMPRESSED' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Work Days per Week *</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  required
                  value={formData.workDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, workDaysPerWeek: parseInt(e.target.value) || 4 })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Hours per Day *</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={formData.hoursPerDay}
                  onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this scheduling rule"
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Link to Departments (Optional)</label>
            <input
              type="text"
              value={Array.isArray(formData.departmentIds) ? formData.departmentIds.join(', ') : ''}
              onChange={(e) => {
                const ids = e.target.value.split(',').map(id => id.trim()).filter(Boolean);
                setFormData({ ...formData, departmentIds: ids });
              }}
              placeholder="Enter department IDs separated by commas (e.g., 693c94af21d0da7f4e3922c6, 693c94af21d0da7f4e3922c7)"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">Get department IDs from Organization Structure subsystem</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Link to Shift Templates (Optional)</label>
            <select
              multiple
              value={formData.shiftTemplateIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, shiftTemplateIds: selected });
              }}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
              size={5}
            >
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple templates</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded bg-white/5 border-white/10 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="active" className="text-sm text-gray-400">
              Rule is active
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
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
              {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
