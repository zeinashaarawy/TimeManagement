import React, { useState, useEffect } from 'react';
import { getAllExceptions, approveException, rejectException, escalateException, createException } from '../../../services/timeManagementApi';
import { getCurrentUser } from '../../../utils/auth';

interface TimeException {
  _id?: string;
  employeeId: string | { _id: string; name?: string };
  type: string;
  attendanceRecordId?: string;
  assignedTo?: string | { _id: string; name?: string };
  status: 'OPEN' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'RESOLVED';
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Exceptions() {
  const [currentUser] = useState(getCurrentUser());
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    employeeId: '',
    assignedTo: '',
  });
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedException, setSelectedException] = useState<TimeException | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadExceptions();
  }, [filters]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const response = await getAllExceptions({
        status: filters.status || undefined,
        employeeId: filters.employeeId || undefined,
        assignedTo: filters.assignedTo || undefined,
      });
      setExceptions(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException?._id || !currentUser?.id) return;

    try {
      setError(null);
      setSuccess(null);
      const actionData = {
        approvedBy: currentUser.id,
        notes: actionNotes || undefined,
      };

      if (actionType === 'approve') {
        await approveException(selectedException._id, actionData);
        setSuccess('Exception approved successfully');
      } else if (actionType === 'reject') {
        await rejectException(selectedException._id, {
          rejectedBy: currentUser.id,
          reason: actionNotes || undefined,
        });
        setSuccess('Exception rejected successfully');
      } else if (actionType === 'escalate') {
        await escalateException(selectedException._id, {
          escalatedTo: currentUser.id,
          reason: actionNotes || 'Escalated for review',
        });
        setSuccess('Exception escalated successfully');
      }

      setShowActionModal(false);
      setSelectedException(null);
      setActionNotes('');
      loadExceptions();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to process exception');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      APPROVED: 'bg-green-500/20 text-green-300 border-green-400/30',
      REJECTED: 'bg-red-500/20 text-red-300 border-red-400/30',
      ESCALATED: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      RESOLVED: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    };
    return colors[status] || colors.OPEN;
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEmployeeName = (employeeId: any) => {
    if (typeof employeeId === 'object' && employeeId?.name) {
      return employeeId.name;
    }
    return typeof employeeId === 'string' ? employeeId : 'Unknown';
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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-white">Time Exceptions</h2>
        <p className="text-gray-400 text-sm">Review and manage attendance exceptions, corrections, and overtime requests</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
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
            <label className="block text-sm text-gray-400 mb-2">Assigned To</label>
            <input
              type="text"
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              placeholder="Filter by assignee..."
            />
          </div>
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {exceptions.map((exception) => (
          <div
            key={exception._id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {getTypeLabel(exception.type)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Employee: {getEmployeeName(exception.employeeId)}
                    </p>
                  </div>
                </div>
                {exception.reason && (
                  <p className="text-sm text-gray-300 mb-3">{exception.reason}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <span className={`px-2 py-1 rounded-full border text-xs ${getStatusBadge(exception.status)}`}>
                      {exception.status}
                    </span>
                  </div>
                  {exception.createdAt && (
                    <div>
                      <span className="text-gray-400">Created: </span>
                      <span className="text-white">
                        {new Date(exception.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {exception.status === 'OPEN' || exception.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedException(exception);
                      setActionType('approve');
                      setActionNotes('');
                      setShowActionModal(true);
                    }}
                    className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 hover:bg-green-500/20 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedException(exception);
                      setActionType('reject');
                      setActionNotes('');
                      setShowActionModal(true);
                    }}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 hover:bg-red-500/20 text-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedException(exception);
                      setActionType('escalate');
                      setActionNotes('');
                      setShowActionModal(true);
                    }}
                    className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 hover:bg-orange-500/20 text-sm"
                  >
                    Escalate
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {exceptions.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400">No exceptions found</p>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">
                {actionType === 'approve' ? 'Approve Exception' : actionType === 'reject' ? 'Reject Exception' : 'Escalate Exception'}
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedException(null);
                  setActionNotes('');
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleAction} className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Exception Type</p>
                <p className="text-white">{getTypeLabel(selectedException.type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Employee</p>
                <p className="text-white">{getEmployeeName(selectedException.employeeId)}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {actionType === 'escalate' ? 'Escalation Reason' : 'Notes'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  rows={4}
                  placeholder={actionType === 'escalate' ? 'Enter escalation reason...' : 'Enter notes (optional)...'}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 rounded-xl transition-all ${
                    actionType === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400'
                      : actionType === 'reject'
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Escalate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedException(null);
                    setActionNotes('');
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
