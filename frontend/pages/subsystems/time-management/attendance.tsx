import React, { useState, useEffect } from 'react';
import { recordPunch, getAttendance, correctAttendance, detectMissedPunch, getEmployeeExceptions, getAssignments, getShiftTemplates } from '../../../services/timeManagementApi';
import { getCurrentUser } from '../../../utils/auth';
import api from '../../../api/axios';

interface Punch {
  type: 'IN' | 'OUT';
  time: string;
  device?: string;
  location?: string;
}

interface AttendanceRecord {
  _id?: string;
  employeeId: string;
  recordDate: string;
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  status?: 'Present' | 'Absent' | 'Late' | 'Early Leave';
  exceptionIds?: string[];
}

interface TimeException {
  _id?: string;
  employeeId: string;
  type: string;
  attendanceRecordId?: string;
  assignedTo?: string;
  status: 'OPEN' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'RESOLVED';
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Attendance() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionPunches, setCorrectionPunches] = useState<Array<{ type: 'IN' | 'OUT'; timestamp: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myExceptions, setMyExceptions] = useState<TimeException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  
  // Shift assignments
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Get employee ID from multiple sources
  const getEmployeeId = () => {
    // Try from getCurrentUser first (from JWT token)
    if (currentUser?.id) {
      return currentUser.id;
    }
    // Fallback to localStorage userId (set during login)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || null;
    }
    return null;
  };

  const employeeId = getEmployeeId();

  // Load employee profile to show name
  useEffect(() => {
    const loadProfile = async () => {
      if (employeeId) {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get('/employee-profile/profile/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEmployeeProfile(res.data);
        } catch (err) {
          console.warn('Failed to load employee profile:', err);
        }
      }
    };
    loadProfile();
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      loadAttendance();
      loadMyExceptions();
      loadShiftAssignments();
    } else {
      setError('Employee ID not found. Please log in again.');
    }
  }, [employeeId, selectedDate]);

  const loadAttendance = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const response = await getAttendance(employeeId, selectedDate);
      setAttendance(response.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadMyExceptions = async () => {
    if (!employeeId) return;
    try {
      setLoadingExceptions(true);
      const response = await getEmployeeExceptions(employeeId);
      setMyExceptions(response.data || []);
    } catch (err: any) {
      // Silently fail - exceptions might not be accessible to all roles
      console.warn('Failed to load exceptions:', err.message);
    } finally {
      setLoadingExceptions(false);
    }
  };

  const loadShiftAssignments = async () => {
    if (!employeeId) return;
    try {
      setLoadingShifts(true);
      
      // Get employee profile to check department and position
      const departmentId = employeeProfile?.primaryDepartmentId?._id || employeeProfile?.primaryDepartmentId;
      const positionId = employeeProfile?.primaryPositionId?._id || employeeProfile?.primaryPositionId;
      
      // Fetch assignments from all sources
      const promises: Promise<any>[] = [];
      
      // Direct employee assignment
      promises.push(
        getAssignments({ employeeId }).catch(() => ({ data: [] }))
      );
      
      // Department assignments
      if (departmentId) {
        promises.push(
          getAssignments({ departmentId }).catch(() => ({ data: [] }))
        );
      }
      
      // Position assignments
      if (positionId) {
        promises.push(
          getAssignments({ positionId }).catch(() => ({ data: [] }))
        );
      }
      
      // Also load templates
      promises.push(
        getShiftTemplates().catch(() => ({ data: [] }))
      );
      
      const results = await Promise.all(promises);
      
      // Combine assignments and remove duplicates
      const assignmentMap = new Map();
      results.slice(0, -1).forEach(result => {
        const assignments = result.data || [];
        assignments.forEach((assignment: any) => {
          if (assignment._id) {
            assignmentMap.set(assignment._id.toString(), assignment);
          }
        });
      });
      
      setShiftAssignments(Array.from(assignmentMap.values()));
      
      // Set templates from last result
      const templatesResult = results[results.length - 1];
      setShiftTemplates(templatesResult.data || []);
    } catch (err: any) {
      console.warn('Failed to load shift assignments:', err.message);
    } finally {
      setLoadingShifts(false);
    }
  };
  
  // Reload shift assignments when profile is loaded
  useEffect(() => {
    if (employeeProfile && employeeId) {
      loadShiftAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeProfile]);
  
  const getTemplateName = (templateId: any) => {
    if (typeof templateId === 'object' && templateId?.name) {
      return templateId.name;
    }
    const template = shiftTemplates.find(t => t._id === templateId);
    return template?.name || 'Unknown Template';
  };
  
  const getAssignmentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-500/20 text-green-300 border-green-400/30',
      Inactive: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      Expired: 'bg-red-500/20 text-red-300 border-red-400/30',
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    };
    return colors[status] || colors.Inactive;
  };

  const handlePunch = async (type: 'IN' | 'OUT') => {
    if (!employeeId) {
      setError('Employee ID is required');
      return;
    }

    try {
      setPunching(true);
      setError(null);
      setSuccess(null);
      await recordPunch({
        employeeId,
        timestamp: new Date().toISOString(),
        type,
        device: 'Web Portal',
        location: 'Office',
      });
      setSuccess(`Successfully punched ${type === 'IN' ? 'in' : 'out'}`);
      loadAttendance();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to punch ${type === 'IN' ? 'in' : 'out'}`);
    } finally {
      setPunching(false);
    }
  };

  const handleDetectMissed = async () => {
    if (!employeeId) return;
    try {
      setError(null);
      setSuccess(null);
      await detectMissedPunch({
        employeeId,
        date: selectedDate,
      });
      setSuccess('Missed punch detection completed');
      loadAttendance();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to detect missed punches');
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || correctionPunches.length === 0) return;

    try {
      setError(null);
      setSuccess(null);
      await correctAttendance({
        employeeId,
        date: selectedDate,
        punches: correctionPunches,
      });
      setSuccess('Correction request submitted successfully');
      setShowCorrectionModal(false);
      setCorrectionPunches([]);
      loadAttendance();
      loadMyExceptions(); // Reload exceptions to show the new request
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit correction');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      Present: 'bg-green-500/20 text-green-300 border-green-400/30',
      Absent: 'bg-red-500/20 text-red-300 border-red-400/30',
      Late: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'Early Leave': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    };
    return colors[status || ''] || 'bg-gray-500/20 text-gray-300 border-gray-400/30';
  };

  const hasInPunch = attendance?.punches?.some(p => p.type === 'IN');
  const hasOutPunch = attendance?.punches?.some(p => p.type === 'OUT');

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-white">Attendance Records</h2>
        <p className="text-gray-400 text-sm">Record clock in/out and view attendance logs</p>
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

      {/* Employee Info and Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Employee</label>
          {employeeProfile ? (
            <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white">
              <p className="font-semibold">
                {employeeProfile.firstName} {employeeProfile.lastName}
              </p>
              {employeeProfile.employeeNumber && (
                <p className="text-xs text-gray-400">ID: {employeeProfile.employeeNumber}</p>
              )}
            </div>
          ) : employeeId ? (
            <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400">
              Loading employee info...
            </div>
          ) : (
            <div className="w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
              Employee ID not found. Please log in again.
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
          />
        </div>
      </div>

      {/* Punch In/Out Buttons */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Clock In/Out</h3>
        <div className="flex gap-4">
          <button
            onClick={() => handlePunch('IN')}
            disabled={punching || !employeeId}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {punching ? 'Processing...' : '🕐 Clock In'}
          </button>
          <button
            onClick={() => handlePunch('OUT')}
            disabled={punching || !employeeId}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl hover:from-red-400 hover:to-rose-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {punching ? 'Processing...' : '🕐 Clock Out'}
          </button>
        </div>
      </div>

      {/* My Shift Assignments */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">📅 My Shift Assignments</h3>
          <button
            onClick={loadShiftAssignments}
            disabled={loadingShifts}
            className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 hover:bg-blue-500/20 text-xs disabled:opacity-50"
          >
            {loadingShifts ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
        
        {loadingShifts ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
            </div>
          </div>
        ) : shiftAssignments.length > 0 ? (
          <div className="space-y-3">
            {shiftAssignments.map((assignment) => {
              const isActive = assignment.status === 'Active' || assignment.status === 'ACTIVE';
              const effectiveFrom = new Date(assignment.effectiveFrom);
              const effectiveTo = assignment.effectiveTo ? new Date(assignment.effectiveTo) : null;
              const today = new Date();
              const isCurrent = effectiveFrom <= today && (!effectiveTo || effectiveTo >= today);
              
              return (
                <div
                  key={assignment._id}
                  className={`p-4 rounded-xl border ${
                    isCurrent && isActive
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold">
                          {getTemplateName(assignment.shiftTemplateId)}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getAssignmentStatusBadge(assignment.status)}`}>
                          {assignment.status || 'Unknown'}
                        </span>
                        {isCurrent && isActive && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Effective From</p>
                          <p className="text-white">{effectiveFrom.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Effective To</p>
                          <p className="text-white">
                            {effectiveTo ? effectiveTo.toLocaleDateString() : 'Indefinite'}
                          </p>
                        </div>
                      </div>
                      {assignment.metadata?.reason && (
                        <p className="text-xs text-gray-400 mt-2">
                          Reason: {assignment.metadata.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No shift assignments found</p>
            <p className="text-xs text-gray-500">
              Contact HR if you expect to have shift assignments
            </p>
          </div>
        )}
      </div>

      {/* Attendance Summary */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
          </div>
        </div>
      ) : attendance ? (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Date</p>
                <p className="text-white font-semibold">
                  {new Date(attendance.recordDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Hours</p>
                <p className="text-white font-semibold">
                  {formatTime(attendance.totalWorkMinutes)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(attendance.status)}`}>
                  {attendance.status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Missed Punch</p>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  attendance.hasMissedPunch
                    ? 'bg-red-500/20 text-red-300 border-red-400/30'
                    : 'bg-green-500/20 text-green-300 border-green-400/30'
                }`}>
                  {attendance.hasMissedPunch ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Punches List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Punch Records</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDetectMissed}
                  className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 hover:bg-blue-500/20 text-sm"
                >
                  Detect Missed
                </button>
                <button
                  onClick={() => {
                    setCorrectionPunches(attendance.punches.map(p => ({
                      type: p.type,
                      timestamp: p.time,
                    })));
                    setShowCorrectionModal(true);
                  }}
                  className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 hover:bg-yellow-500/20 text-sm"
                >
                  Request Correction
                </button>
              </div>
            </div>

            {attendance.punches && attendance.punches.length > 0 ? (
              <div className="space-y-2">
                {attendance.punches.map((punch, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        punch.type === 'IN'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {punch.type === 'IN' ? '⬇️' : '⬆️'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {punch.type === 'IN' ? 'Clock In' : 'Clock Out'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDateTime(punch.time)}
                        </p>
                      </div>
                    </div>
                    {punch.device && (
                      <div className="text-sm text-gray-400">
                        {punch.device}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No punches recorded for this date</p>
              </div>
            )}
          </div>

          {/* Alerts */}
          {attendance.hasMissedPunch && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-yellow-300 font-semibold">Missed Punch Detected</p>
                  <p className="text-yellow-200/70 text-sm">
                    {!hasInPunch && 'Missing clock in punch'}
                    {!hasInPunch && !hasOutPunch && ' and '}
                    {!hasOutPunch && 'Missing clock out punch'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* My Correction Requests & Status */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📋 My Correction Requests</h3>
            {loadingExceptions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse">
                  <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
                </div>
              </div>
            ) : myExceptions.filter(ex => ex.type === 'MISSED_PUNCH' || ex.type === 'MANUAL_ADJUSTMENT').length > 0 ? (
              <div className="space-y-3">
                {myExceptions
                  .filter(ex => ex.type === 'MISSED_PUNCH' || ex.type === 'MANUAL_ADJUSTMENT')
                  .map((exception) => (
                    <div
                      key={exception._id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            exception.status === 'APPROVED' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                            exception.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                            exception.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                            exception.status === 'ESCALATED' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
                            'bg-blue-500/20 text-blue-300 border-blue-400/30'
                          }`}>
                            {exception.status}
                          </span>
                          <span className="text-sm text-white font-medium">
                            {exception.type === 'MISSED_PUNCH' ? 'Missed Punch Correction' : 'Manual Adjustment'}
                          </span>
                        </div>
                        {exception.reason && (
                          <p className="text-sm text-gray-400 mb-1">{exception.reason}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Submitted: {exception.createdAt ? new Date(exception.createdAt).toLocaleString() : 'N/A'}
                          {exception.updatedAt && exception.updatedAt !== exception.createdAt && (
                            <> • Updated: {new Date(exception.updatedAt).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No correction requests submitted yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400">No attendance record found for the selected date</p>
        </div>
      )}

      {/* Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Request Attendance Correction</h3>
              <button
                onClick={() => {
                  setShowCorrectionModal(false);
                  setCorrectionPunches([]);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-4">
                  Update punch times for {new Date(selectedDate).toLocaleDateString()}
                </p>
                <div className="space-y-3">
                  {correctionPunches.map((punch, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <select
                        value={punch.type}
                        onChange={(e) => {
                          const updated = [...correctionPunches];
                          updated[index].type = e.target.value as 'IN' | 'OUT';
                          setCorrectionPunches(updated);
                        }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      >
                        <option value="IN">Clock In</option>
                        <option value="OUT">Clock Out</option>
                      </select>
                      <input
                        type="datetime-local"
                        value={punch.timestamp ? new Date(punch.timestamp).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const updated = [...correctionPunches];
                          updated[index].timestamp = new Date(e.target.value).toISOString();
                          setCorrectionPunches(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionPunches(correctionPunches.filter((_, i) => i !== index));
                        }}
                        className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionPunches([...correctionPunches, { type: 'IN', timestamp: new Date().toISOString() }]);
                  }}
                  className="mt-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
                >
                  + Add Punch
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
                >
                  Submit Correction Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCorrectionModal(false);
                    setCorrectionPunches([]);
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
