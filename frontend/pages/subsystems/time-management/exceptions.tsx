import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { getCurrentUser, getCurrentUserRole, type UserRole } from "../../../utils/auth";
import { 
  getAllExceptions,
  approveException,
  rejectException 
} from "../../../services/timeManagementApi";

interface TimeException {
  _id: string;
  employeeId: string;
  attendanceRecordId: string;
  type: string;
  status: string;
  reason: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function Exceptions({ asTab = false }: { asTab?: boolean } = {}) {
  const [user, setUser] = useState<{ id: string; role: UserRole; username: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'PENDING' | 'APPROVED' | 'REJECTED'>('OPEN');
  const [selectedException, setSelectedException] = useState<TimeException | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const role = getCurrentUserRole();
    setUser(currentUser);
    setUserRole(role);
    
    if (currentUser && (role === 'HR Manager' || role === 'System Admin' || role === 'HR Admin')) {
      loadExceptions();
    }
  }, [filter]);

  const loadExceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllExceptions({
        status: filter !== 'ALL' ? filter : undefined,
      });
      const data = response.data;
      const exceptionsList = Array.isArray(data) ? data : (data?.exceptions || []);
      setExceptions(exceptionsList);
    } catch (err: any) {
      console.error("Error loading exceptions:", err);
      setError(err.response?.data?.message || err.message || "Failed to load exceptions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (exception: TimeException) => {
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    if (!actionComment.trim()) {
      setError("Please provide a comment for approval");
      return;
    }

    setProcessing(exception._id);
    setError(null);
    setSuccess(null);

    try {
      await approveException(exception._id, {
        approvedBy: user.id,
        notes: actionComment,
      });

      setSuccess("Exception approved successfully!");
      setSelectedException(null);
      setActionComment('');
      await loadExceptions();
    } catch (err: any) {
      console.error("Error approving exception:", err);
      setError(err.response?.data?.message || err.message || "Failed to approve exception");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (exception: TimeException) => {
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    if (!actionComment.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setProcessing(exception._id);
    setError(null);
    setSuccess(null);

    try {
      await rejectException(exception._id, {
        rejectedBy: user.id,
        reason: actionComment,
      });

      setSuccess("Exception rejected successfully!");
      setSelectedException(null);
      setActionComment('');
      await loadExceptions();
    } catch (err: any) {
      console.error("Error rejecting exception:", err);
      setError(err.response?.data?.message || err.message || "Failed to reject exception");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'OPEN':
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canAccess = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin' || userRole === 'HR Admin';
  };

  const content = (
    <div className={asTab ? "" : "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12"}>
      <div className={asTab ? "" : "max-w-7xl mx-auto"}>
        {/* Header */}
        {!asTab && (
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-light mb-2">Exception Management</h1>
            <p className="text-gray-400">Review and manage time exceptions</p>
          </div>
        )}

        {!canAccess() ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">You do not have permission to access exception management.</p>
            <p className="text-gray-500 text-sm mt-2">Only HR Managers, System Admins, and HR Admins can access this page.</p>
          </div>
        ) : (
          <>
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                {success}
              </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-6 flex gap-2 border-b border-white/10">
              {(['ALL', 'OPEN', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-6 py-3 border-b-2 transition-colors ${
                    filter === status
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Loading exceptions...</p>
              </div>
            ) : exceptions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No exceptions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exceptions.map((exception) => (
                  <div
                    key={exception._id}
                    className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${getStatusColor(exception.status)}`}>
                            {exception.status}
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/30">
                            {getTypeLabel(exception.type)}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">Employee ID: {exception.employeeId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              Submitted: {new Date(exception.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-200 mb-4">{exception.reason}</p>
                      </div>
                      {(exception.status === 'OPEN' || exception.status === 'PENDING') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedException(exception)}
                            className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Form */}
                    {selectedException?._id === exception._id && (
                      <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
                        <label className="block text-sm text-gray-400 mb-2">
                          {selectedException.status === 'OPEN' || selectedException.status === 'PENDING'
                            ? 'Comment (required for approval/rejection)'
                            : 'Comment'}
                        </label>
                        <textarea
                          value={actionComment}
                          onChange={(e) => setActionComment(e.target.value)}
                          placeholder="Enter your comment or reason..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 mb-4"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(exception)}
                            disabled={processing === exception._id || !actionComment.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === exception._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(exception)}
                            disabled={processing === exception._id || !actionComment.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === exception._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Reject
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedException(null);
                              setActionComment('');
                            }}
                            className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return content;
}


