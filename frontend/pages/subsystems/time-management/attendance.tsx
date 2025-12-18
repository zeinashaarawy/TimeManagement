import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, LogIn, LogOut } from "lucide-react";
import { getCurrentUser, getCurrentUserRole, type UserRole } from "../../../utils/auth";
import { 
  recordPunch, 
  getAttendance, 
  getEmployeeExceptions,
  createException 
} from "../../../services/timeManagementApi";

interface Punch {
  type: 'IN' | 'OUT';
  time: string;
}

interface AttendanceRecord {
  _id?: string;
  employeeId: string;
  recordDate?: string;
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  exceptionIds?: string[];
}

interface TimeException {
  _id: string;
  employeeId: string;
  attendanceRecordId: string;
  type: string;
  status: string;
  reason: string;
  createdAt: string;
}

export default function Attendance({ asTab = false }: { asTab?: boolean } = {}) {
  const [user, setUser] = useState<{ id: string; role: UserRole; username: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    type: 'MISSED_PUNCH',
    reason: '',
    comment: '',
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    const role = getCurrentUserRole();
    setUser(currentUser);
    setUserRole(role);
    
    if (currentUser) {
      loadAttendance(currentUser.id);
      loadExceptions(currentUser.id);
    }
  }, [selectedDate]);

  const loadAttendance = async (employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAttendance(employeeId, selectedDate);
      // Handle null, undefined, or empty responses
      if (response && response.data !== null && response.data !== undefined) {
        setAttendance(response.data);
      } else {
        // No attendance record found for this date - this is normal
        setAttendance(null);
      }
    } catch (err: any) {
      console.error("Error loading attendance:", err);
      // If it's a 404, it just means no attendance record exists yet
      if (err.response?.status === 404) {
        setAttendance(null);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load attendance");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExceptions = async (employeeId: string) => {
    try {
      const response = await getEmployeeExceptions(employeeId);
      const data = response?.data;
      // Handle null, undefined, or empty responses
      if (data === null || data === undefined) {
        setExceptions([]);
      } else {
        const exceptionsList = Array.isArray(data) ? data : (data?.exceptions || []);
        setExceptions(exceptionsList);
      }
    } catch (err: any) {
      console.error("Error loading exceptions:", err);
      // If it's a 404, just set empty array
      if (err.response?.status === 404) {
        setExceptions([]);
      }
    }
  };

  const handlePunch = async (type: 'IN' | 'OUT') => {
    if (!user) {
      setError("User not found. Please log in.");
      return;
    }

    setPunching(true);
    setError(null);
    setSuccess(null);

    try {
      await recordPunch({
        employeeId: user.id,
        timestamp: new Date(),
        type: type,
        device: navigator.userAgent,
        location: 'Office',
      });

      setSuccess(`Successfully punched ${type === 'IN' ? 'in' : 'out'}!`);
      await loadAttendance(user.id);
      await loadExceptions(user.id);
    } catch (err: any) {
      console.error("Error recording punch:", err);
      const errorMsg = err.response?.data?.message || err.message || `Failed to punch ${type === 'IN' ? 'in' : 'out'}`;
      setError(errorMsg);
    } finally {
      setPunching(false);
    }
  };

  const handleSubmitException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !attendance?._id) {
      setError("Cannot submit exception: Missing user or attendance record");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createException({
        employeeId: user.id,
        recordId: attendance._id,
        reason: exceptionForm.reason || exceptionForm.comment,
        assignedToId: user.id, // Will be updated by manager
        type: exceptionForm.type,
      });

      setSuccess("Exception submitted successfully!");
      setShowExceptionForm(false);
      setExceptionForm({ type: 'MISSED_PUNCH', reason: '', comment: '' });
      await loadExceptions(user.id);
      await loadAttendance(user.id);
    } catch (err: any) {
      console.error("Error submitting exception:", err);
      setError(err.response?.data?.message || err.message || "Failed to submit exception");
    } finally {
      setLoading(false);
    }
  };

  const getNextPunchType = (): 'IN' | 'OUT' | null => {
    if (!attendance || !attendance.punches || attendance.punches.length === 0) {
      return 'IN';
    }
    const sortedPunches = [...attendance.punches].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    const lastPunch = sortedPunches[sortedPunches.length - 1];
    return lastPunch.type === 'IN' ? 'OUT' : 'IN';
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const nextPunchType = getNextPunchType();
  const todayExceptions = exceptions.filter(ex => {
    if (!attendance?._id) return false;
    return ex.attendanceRecordId === attendance._id && ex.status === 'OPEN';
  });

  const content = (
    <div className={asTab ? "" : "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12"}>
      <div className={asTab ? "" : "max-w-6xl mx-auto"}>
        {/* Header */}
        {!asTab && (
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-light mb-2">Attendance Dashboard</h1>
            <p className="text-gray-400">View your attendance, punch in/out, and manage exceptions</p>
          </div>
        )}

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

        {/* Date Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {loading && !attendance ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-gray-400 mt-4">Loading attendance...</p>
          </div>
        ) : (
          <>
            {/* Attendance Status Card */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light mb-2">Today's Attendance</h2>
                  <p className="text-gray-400">
                    {selectedDate === new Date().toISOString().split('T')[0] 
                      ? "Current status" 
                      : `Status for ${new Date(selectedDate).toLocaleDateString()}`}
                  </p>
                </div>
                {attendance?.hasMissedPunch && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Exception Required</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Worked Hours */}
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Total Worked</p>
                  <p className="text-3xl font-light">
                    {attendance ? formatHours(attendance.totalWorkMinutes) : "0h 0m"}
                  </p>
                </div>

                {/* Punch In Time */}
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Punch In</p>
                  <p className="text-2xl font-light">
                    {attendance?.punches?.find(p => p.type === 'IN') 
                      ? formatTime(attendance.punches.find(p => p.type === 'IN')!.time)
                      : "Not punched in"}
                  </p>
                </div>

                {/* Punch Out Time */}
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Punch Out</p>
                  <p className="text-2xl font-light">
                    {attendance?.punches?.find(p => p.type === 'OUT') 
                      ? formatTime(attendance.punches.find(p => p.type === 'OUT')!.time)
                      : "Not punched out"}
                  </p>
                </div>
              </div>

              {/* Punch History */}
              {attendance?.punches && attendance.punches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-light mb-3">Punch History</h3>
                  <div className="space-y-2">
                    {[...attendance.punches]
                      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                      .map((punch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {punch.type === 'IN' ? (
                              <LogIn className="w-5 h-5 text-green-400" />
                            ) : (
                              <LogOut className="w-5 h-5 text-red-400" />
                            )}
                            <span className="font-medium">
                              {punch.type === 'IN' ? 'Punched In' : 'Punched Out'}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            {formatTime(punch.time)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Punch Button */}
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <div className="flex justify-center">
                  <button
                    onClick={() => nextPunchType && handlePunch(nextPunchType)}
                    disabled={punching || !nextPunchType}
                    className={`px-8 py-4 rounded-xl font-medium text-lg transition-all ${
                      nextPunchType === 'IN'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                    } ${punching || !nextPunchType ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {punching ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : nextPunchType === 'IN' ? (
                      <span className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Punch In
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogOut className="w-5 h-5" />
                        Punch Out
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Exceptions Section */}
            {(attendance?.hasMissedPunch || todayExceptions.length > 0) && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-light">Exceptions</h2>
                  {attendance?.hasMissedPunch && !showExceptionForm && (
                    <button
                      onClick={() => setShowExceptionForm(true)}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      Submit Exception
                    </button>
                  )}
                </div>

                {/* Exception Form */}
                {showExceptionForm && (
                  <form onSubmit={handleSubmitException} className="mb-6 p-4 bg-black/20 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Exception Type</label>
                        <select
                          value={exceptionForm.type}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="MISSED_PUNCH">Missed Punch</option>
                          <option value="LATE">Late Arrival</option>
                          <option value="EARLY_LEAVE">Early Leave</option>
                          <option value="SHORT_TIME">Short Time</option>
                          <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Reason</label>
                        <textarea
                          value={exceptionForm.reason}
                          onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                          placeholder="Explain the reason for this exception..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {loading ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExceptionForm(false);
                            setExceptionForm({ type: 'MISSED_PUNCH', reason: '', comment: '' });
                          }}
                          className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Existing Exceptions */}
                {todayExceptions.length > 0 && (
                  <div className="space-y-3">
                    {todayExceptions.map((exception) => (
                      <div
                        key={exception._id}
                        className="p-4 bg-black/20 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
                                {exception.type.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 rounded text-sm ${
                                exception.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                exception.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {exception.status}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-1">{exception.reason}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(exception.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return content;
}

