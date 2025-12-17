import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldCheck, ShieldX, Sparkles, Users } from 'lucide-react';
import Card from '@/components/time-management/Card';
import Button from '@/components/time-management/Button';
import FormInput from '@/components/time-management/FormInput';
import {
  approveException,
  getAttendance,
  getExceptions,
  getPendingExceptions,
  punch,
  rejectException,
  submitException,
} from '@/lib/api/timeManagement';
import { TimeExceptionType } from '../../../../shared/time-management/enums';

type Punch = {
  type: 'IN' | 'OUT';
  time: string;
};

type AttendanceRecord = {
  _id: string;
  employeeId: string;
  status?: string;
  recordDate?: string;
  punches: Punch[];
  totalWorkMinutes: number;
  hasMissedPunch: boolean;
  exceptionIds?: string[];
};

type TimeException = {
  _id: string;
  attendanceRecordId: string;
  reason?: string;
  status: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
};

type PendingExceptionRow = TimeException & { employeeId?: string; recordDate?: string };

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const formatTime = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toHours = (minutes?: number) => {
  if (!minutes || Number.isNaN(minutes)) return '0h';
  const hrs = minutes / 60;
  return `${hrs.toFixed(1)}h`;
};

export default function TimeManagement() {
  const defaultEmployeeId = useMemo(
    () => process.env.NEXT_PUBLIC_EMPLOYEE_ID || '',
    [],
  );
  const userRole = useMemo<'Employee' | 'Manager' | 'HR_ADMIN'>(
    () => {
      const role = process.env.NEXT_PUBLIC_USER_ROLE;
      if (role === 'Manager' || role === 'HR_ADMIN') return role;
      return 'Employee';
    },
    [],
  );

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [exceptions, setExceptions] = useState<TimeException[]>([]);
  const [pending, setPending] = useState<PendingExceptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);
  const [managerActionLoading, setManagerActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exceptionForm, setExceptionForm] = useState({ reasonCode: '', comment: '' });

  const hasException = attendance?.hasMissedPunch || (attendance?.exceptionIds?.length ?? 0) > 0 || exceptions.length > 0;
  const lastPunch = attendance?.punches?.[attendance.punches.length - 1];
  const nextPunchLabel = lastPunch?.type === 'IN' ? 'OUT' : 'IN';

  const loadAttendance = async () => {
    if (!employeeId) {
      setError('Employee ID is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await getAttendance(employeeId, selectedDate);
      setAttendance((data as AttendanceRecord) || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadExceptions = async () => {
    if (!employeeId) return;
    try {
      const data = await getExceptions(employeeId);
      const list = Array.isArray(data) ? data : (data as any)?.exceptions ? (data as any).exceptions : [];
      setExceptions((list as TimeException[]) || []);
    } catch (err) {
      // silently ignore; surfaced by attendance card already
    }
  };

  const loadPending = async () => {
    if (userRole !== 'Manager') return;
    try {
      const data = await getPendingExceptions();
      setPending((data as PendingExceptionRow[]) || []);
    } catch (err) {
      setPending([]);
    }
  };

  useEffect(() => {
    loadAttendance();
    loadExceptions();
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, selectedDate, userRole]);

  const handlePunch = async () => {
    if (!employeeId) {
      setError('Employee ID is required to punch');
      return;
    }
    setPunchLoading(true);
    setError(null);
    try {
      await punch(employeeId);
      await Promise.all([loadAttendance(), loadExceptions()]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Punch failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendance?._id) {
      setError('No attendance record found for the selected date.');
      return;
    }
    if (!exceptionForm.reasonCode) {
      setError('Reason is required.');
      return;
    }
    setExceptionSubmitting(true);
    setError(null);
    try {
      await submitException({
        attendanceRecordId: attendance._id,
        reason: exceptionForm.reasonCode,
        comment: exceptionForm.comment,
      });
      setExceptionForm({ reasonCode: '', comment: '' });
      await Promise.all([loadExceptions(), loadAttendance()]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit exception');
    } finally {
      setExceptionSubmitting(false);
    }
  };

  const handleManagerAction = async (id: string, action: 'approve' | 'reject') => {
    const comment = window.prompt('Add a comment (required)') || '';
    if (!comment.trim()) {
      return;
    }
    setManagerActionLoading(id);
    try {
      if (action === 'approve') {
        await approveException(id, comment);
      } else {
        await rejectException(id, comment);
      }
      await loadPending();
      await loadExceptions();
      await loadAttendance();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action failed');
    } finally {
      setManagerActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl blur-md" />
            <div className="relative bg-gradient-to-br from-teal-600 to-emerald-600 p-3 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Subsystem</p>
            <h1 className="text-3xl font-light text-white">Time Management</h1>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{userRole}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="col-span-2">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
              <div className="w-full sm:w-1/3">
                <FormInput
                  label="Employee ID"
                  name="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                  required
                />
              </div>
              <div className="w-full sm:w-1/3">
                <FormInput
                  label="Date"
                  name="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button onClick={loadAttendance} disabled={loading || !employeeId} icon={<Sparkles className="w-4 h-4" />}>
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">Current Status</p>
              <p className="text-xl text-white">
                {loading ? 'Loading...' : lastPunch?.type === 'IN' ? 'Punched In' : 'Punched Out'}
              </p>
              <p className="text-sm text-gray-500">
                {lastPunch ? `Last: ${lastPunch.type} at ${formatTime(lastPunch.time)}` : 'No punches yet'}
              </p>
            </div>
            <Button onClick={handlePunch} disabled={punchLoading || loading || !employeeId} className="w-full sm:w-auto justify-center">
              {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Punch ${nextPunchLabel}`}
            </Button>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Attendance</p>
                <h3 className="text-xl text-white">Today&apos;s Details</h3>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading attendance...
              </div>
            ) : attendance ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-400">Record Date</p>
                  <p className="text-lg text-white">{formatDate(attendance.recordDate) || selectedDate}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-400">Total Worked</p>
                  <p className="text-lg text-white">{toHours(attendance.totalWorkMinutes)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-400">Punches</p>
                  <div className="space-y-1 text-white">
                    {attendance.punches?.length ? (
                      attendance.punches.map((p, idx) => (
                        <div key={`${p.time}-${idx}`} className="flex justify-between text-sm">
                          <span className="text-gray-400">{p.type}</span>
                          <span>{formatTime(p.time)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No punches yet</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-400">Exceptions</p>
                  <div className="flex items-center gap-2">
                    {hasException ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-200 text-sm">Requires attention</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-200 text-sm">Clear</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No attendance found for this date.</p>
            )}
          </Card>

          {hasException && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-amber-200">Exception</p>
                  <h3 className="text-white">Submit Correction</h3>
                </div>
              </div>
              <form onSubmit={handleExceptionSubmit}>
                <FormInput
                  label="Reason"
                  name="reasonCode"
                  value={exceptionForm.reasonCode}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, reasonCode: e.target.value })}
                  placeholder="Select reason"
                  required
                  options={[
                    { value: TimeExceptionType.MISSED_PUNCH, label: 'Missed punch' },
                    { value: TimeExceptionType.LATE, label: 'Late arrival' },
                    { value: TimeExceptionType.EARLY_LEAVE, label: 'Early leave' },
                    { value: TimeExceptionType.SHORT_TIME, label: 'Invalid/short time' },
                  ]}
                />
                <FormInput
                  label="Comment"
                  name="comment"
                  textarea
                  rows={3}
                  value={exceptionForm.comment}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, comment: e.target.value })}
                  placeholder="Add context for the approver"
                />
                <Button type="submit" disabled={exceptionSubmitting}>
                  {exceptionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Exception'}
                </Button>
              </form>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Exceptions</p>
                <h3 className="text-white">Timeline & Status</h3>
              </div>
            </div>
            {exceptions.length === 0 ? (
              <p className="text-gray-400 text-sm">No exceptions submitted.</p>
            ) : (
              <div className="space-y-3">
                {exceptions.map((ex) => (
                  <div key={ex._id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{ex.reason || 'Exception'}</span>
                      <span className="text-amber-200">{ex.status}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{ex.comment || 'No comments'}</p>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      {ex.createdAt && <span>Submitted: {formatDate(ex.createdAt)}</span>}
                      {ex.updatedAt && <span>Updated: {formatDate(ex.updatedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {userRole === 'Manager' && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <ShieldX className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Manager</p>
                  <h3 className="text-white">Pending Exceptions</h3>
                </div>
              </div>
              {pending.length === 0 ? (
                <p className="text-gray-400 text-sm">No pending exceptions.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-200">
                    <thead className="text-xs uppercase text-gray-400">
                      <tr>
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Reason</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pending.map((row) => (
                        <tr key={row._id}>
                          <td className="py-2 pr-4">{row.employeeId || 'N/A'}</td>
                          <td className="py-2 pr-4">{formatDate(row.recordDate)}</td>
                          <td className="py-2 pr-4">{row.reason || '—'}</td>
                          <td className="py-2 pr-4 text-amber-200">{row.status}</td>
                          <td className="py-2 flex gap-2 flex-wrap">
                            <Button
                              variant="secondary"
                              onClick={() => handleManagerAction(row._id, 'approve')}
                              disabled={managerActionLoading === row._id}
                            >
                              {managerActionLoading === row._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleManagerAction(row._id, 'reject')}
                              disabled={managerActionLoading === row._id}
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
