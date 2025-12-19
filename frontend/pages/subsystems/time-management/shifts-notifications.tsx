import React, { useState, useEffect } from 'react';
import { 
  getShiftExpiryNotifications, 
  triggerExpiryDetection, 
  resolveShiftExpiryNotification 
} from '../../../services/timeManagementApi';

interface ShiftExpiryNotification {
  _id?: string;
  assignmentId: string | { _id: string; shiftTemplateId: any; employeeId?: string; departmentId?: string; positionId?: string };
  daysUntilExpiry: number;
  status: string;
  notificationDate: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt?: string;
}

export default function ShiftsNotifications() {
  const [notifications, setNotifications] = useState<ShiftExpiryNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ShiftExpiryNotification | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [statusFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getShiftExpiryNotifications(statusFilter || undefined);
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDetection = async () => {
    try {
      setError(null);
      setSuccess(null);
      await triggerExpiryDetection(7); // Detect shifts expiring in 7 days
      setSuccess('Expiry detection triggered successfully');
      loadNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to trigger detection');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotification?._id) return;

    try {
      setError(null);
      setSuccess(null);
      await resolveShiftExpiryNotification(selectedNotification._id, {
        resolutionNotes: resolutionNotes || 'Notification resolved',
      });
      setSuccess('Notification resolved successfully');
      setShowResolveModal(false);
      setSelectedNotification(null);
      setResolutionNotes('');
      loadNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resolve notification');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      RESOLVED: 'bg-green-500/20 text-green-300 border-green-400/30',
      ACKNOWLEDGED: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    };
    return colors[status] || colors.PENDING;
  };

  const getAssignmentInfo = (assignment: any) => {
    if (typeof assignment === 'object' && assignment !== null) {
      if (assignment.employeeId) return `Employee: ${assignment.employeeId}`;
      if (assignment.departmentId) return `Department: ${assignment.departmentId}`;
      if (assignment.positionId) return `Position: ${assignment.positionId}`;
    }
    return 'Unknown Assignment';
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
          <h2 className="text-2xl font-semibold mb-2 text-white">Shift Expiry Notifications</h2>
          <p className="text-gray-400 text-sm">Monitor and manage shift assignments that are about to expire</p>
        </div>
        <button
          onClick={handleTriggerDetection}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
        >
          🔍 Detect Expiring Shifts
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

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Shift Expiring Soon</h3>
                    <p className="text-sm text-gray-400">
                      {getAssignmentInfo(notification.assignmentId)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Days Until Expiry</p>
                    <p className="text-white font-semibold">
                      {notification.daysUntilExpiry} {notification.daysUntilExpiry === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Notification Date</p>
                    <p className="text-white text-sm">
                      {new Date(notification.notificationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(notification.status)}`}>
                      {notification.status}
                    </span>
                  </div>
                  {notification.resolvedAt && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Resolved At</p>
                      <p className="text-white text-sm">
                        {new Date(notification.resolvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {notification.resolutionNotes && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Resolution Notes</p>
                    <p className="text-white text-sm">{notification.resolutionNotes}</p>
                  </div>
                )}
              </div>
              {notification.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setSelectedNotification(notification);
                    setResolutionNotes('');
                    setShowResolveModal(true);
                  }}
                  className="px-4 py-2 bg-teal-500/20 border border-teal-400/30 rounded-xl text-teal-300 hover:bg-teal-500/30 transition-all text-sm"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400 mb-4">No expiry notifications found</p>
          <button
            onClick={handleTriggerDetection}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl"
          >
            Detect Expiring Shifts
          </button>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Resolve Notification</h3>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedNotification(null);
                  setResolutionNotes('');
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Assignment</p>
                <p className="text-white">{getAssignmentInfo(selectedNotification.assignmentId)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Expires in {selectedNotification.daysUntilExpiry} {selectedNotification.daysUntilExpiry === 1 ? 'day' : 'days'}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={4}
                  placeholder="Enter resolution notes (e.g., Shift renewed, Assignment extended, etc.)..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedNotification(null);
                    setResolutionNotes('');
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
