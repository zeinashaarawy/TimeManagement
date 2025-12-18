import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Users, X } from "lucide-react";
import { shiftAssignmentApi, shiftTemplateApi } from "../../../lib/api";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

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

interface ShiftTemplate {
  _id: string;
  name: string;
  type: string;
}

export default function ShiftsAssignments({ asTab = false }: { asTab?: boolean } = {}) {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(null);

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
    loadTemplates();
    loadAssignments();
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

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shiftAssignmentApi.query({});
      setAssignments(response.data || []);
    } catch (err: any) {
      console.error("Error loading assignments:", err);
      setError(err.response?.data?.message || err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (assignment: ShiftAssignment) => {
    setSelectedAssignment(assignment);
    setShowStatusModal(true);
  };

  const getTemplateName = (templateIdOrObj: string | { _id: string; name: string; [key: string]: any }) => {
    if (typeof templateIdOrObj === 'object' && templateIdOrObj !== null) {
      return templateIdOrObj.name || 'Unknown';
    }
    const template = templates.find(t => t._id === templateIdOrObj);
    return template?.name || 'Unknown';
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
              <h1 className="text-4xl lg:text-5xl font-light mb-2">Shift Assignments</h1>
              <p className="text-gray-400">Manage shift assignments for employees, departments, and positions</p>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Assign Shift
              </button>
            )}
          </div>
        </div>
      )}

      {asTab && canEdit && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Assign Shift
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
          <p className="mt-4 text-gray-400">Loading assignments...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && assignments.length === 0 && (
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
      )}

      {/* Assignments List */}
      {!loading && assignments.length > 0 && (
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
                    {canEdit && (
                      <button
                        onClick={() => handleUpdateStatus(assignment)}
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
      )}

      {/* Assignment Modal - Simplified for now */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-white">Assign Shift</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400">Assignment form will be implemented here. For now, use the API directly.</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAssignment && (
        <StatusUpdateModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedAssignment(null);
          }}
          onSuccess={loadAssignments}
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

