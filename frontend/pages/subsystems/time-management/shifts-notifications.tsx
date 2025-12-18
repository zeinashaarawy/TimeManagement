import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, AlertTriangle, CheckCircle, X } from "lucide-react";
import { shiftExpiryApi, shiftTemplateApi } from "../../../lib/api";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

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

interface ShiftTemplate {
  _id: string;
  name: string;
}

export default function ShiftsNotifications({ asTab = false }: { asTab?: boolean } = {}) {
  const [notifications, setNotifications] = useState<ShiftExpiryNotification[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ShiftExpiryNotification | null>(null);

  useEffect(() => {
    loadTemplates();
    loadNotifications();
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

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shiftExpiryApi.getNotifications();
      setNotifications(response.data || []);
    } catch (err: any) {
      if (err.response?.status === 500) {
        setNotifications([]);
        setError(null);
        return;
      }
      console.error("Error loading notifications:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
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
      
      await loadNotifications();
      
      setTimeout(() => {
        setDetectMessage(null);
      }, 5000);
    } catch (err: any) {
      setDetectMessage('❌ Failed to trigger detection.');
      console.error('Error triggering detection:', err);
    } finally {
      setDetecting(false);
    }
  };

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return 'Unknown';
    if (typeof templateId === 'object' && templateId !== null) {
      return (templateId as any).name || 'Unknown';
    }
    const template = templates.find(t => t._id === templateId);
    return template?.name || 'Unknown';
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
          <div>
            <h1 className="text-4xl lg:text-5xl font-light mb-2">Shift Expiry Notifications</h1>
            <p className="text-gray-400">View and manage shift expiry notifications</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Detection Message */}
      {detectMessage && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${
          detectMessage.includes('✅') 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : detectMessage.includes('ℹ️')
            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {detectMessage}
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-gray-300">
          Expiry Notifications ({notifications.length})
        </h3>
        <div className="flex gap-3">
          <button
            onClick={loadNotifications}
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-gray-400">Loading notifications...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-20">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
              <Bell className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
          </div>
          <h3 className="text-xl text-gray-300 mb-2">No Expiry Notifications</h3>
          <p className="text-gray-500 mb-6">All shifts are up to date</p>
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
        </div>
      )}

      {/* Notifications List */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
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
                          ? `Shift Template: ${getTemplateName(
                              typeof notification.shiftTemplateId === 'object' 
                                ? notification.shiftTemplateId._id 
                                : notification.shiftTemplateId
                            )}`
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
                    {notification.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowResolveModal(true);
                        }}
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
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedNotification && (
        <ResolveNotificationModal
          notification={selectedNotification}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedNotification(null);
          }}
          onSuccess={loadNotifications}
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
            <p>Mark this notification as resolved. This indicates that the expiring shift/assignment has been handled.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Resolution Notes (Optional)</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              placeholder="How was this resolved? (e.g., 'Renewed for 6 more months', 'Replaced with new shift template')"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50"
            />
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

