import React, { useState, useEffect } from 'react';
import { getAttendanceReport, getOvertimeReport, getPenaltyReport, exportAttendanceReport, exportOvertimeReport, exportPenaltyReport } from '../../../services/timeManagementApi';

interface ReportData {
  data?: any[];
  aggregates?: {
    totalOvertimeMinutes?: number;
    totalAmount?: number;
    totalMinutes?: number;
    count?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: any;
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState<'attendance' | 'overtime' | 'penalty'>('attendance');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: '',
    departmentId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    type: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [activeReport, filters]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;

      if (activeReport === 'attendance') {
        response = await getAttendanceReport({
          employeeId: filters.employeeId || undefined,
          departmentId: filters.departmentId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
      } else if (activeReport === 'overtime') {
        response = await getOvertimeReport({
          employeeId: filters.employeeId || undefined,
          departmentId: filters.departmentId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          status: filters.status || undefined,
        });
      } else {
        response = await getPenaltyReport({
          employeeId: filters.employeeId || undefined,
          departmentId: filters.departmentId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          type: filters.type || undefined,
          status: filters.status || undefined,
        });
      }

      // Backend returns: { data: [], aggregates: {}, pagination: {} }
      setReportData(response.data || response || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (activeReport === 'attendance') {
      const url = exportAttendanceReport({
        employeeId: filters.employeeId || undefined,
        departmentId: filters.departmentId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      window.open(url, '_blank');
    } else if (activeReport === 'overtime') {
      const url = exportOvertimeReport({
        employeeId: filters.employeeId || undefined,
        departmentId: filters.departmentId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
      });
      window.open(url, '_blank');
    } else if (activeReport === 'penalty') {
      const url = exportPenaltyReport({
        employeeId: filters.employeeId || undefined,
        departmentId: filters.departmentId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
      });
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-white">Time Management Reports</h2>
          <p className="text-gray-400 text-sm">Generate and export attendance, overtime, and penalty reports</p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
        >
          📥 Export Report
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveReport('attendance')}
            className={`flex-1 px-4 py-2 rounded-xl transition-all ${
              activeReport === 'attendance'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Attendance Report
          </button>
          <button
            onClick={() => setActiveReport('overtime')}
            className={`flex-1 px-4 py-2 rounded-xl transition-all ${
              activeReport === 'overtime'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Overtime Report
          </button>
          <button
            onClick={() => setActiveReport('penalty')}
            className={`flex-1 px-4 py-2 rounded-xl transition-all ${
              activeReport === 'penalty'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Penalty Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm text-gray-400 mb-2">Department ID</label>
            <input
              type="text"
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              placeholder="Filter by department..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
        </div>
        {activeReport === 'overtime' && (
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
        {activeReport === 'penalty' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">All Types</option>
                <option value="LATE">Late</option>
                <option value="EARLY_LEAVE">Early Leave</option>
                <option value="SHORT_TIME">Short Time</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {/* Report Data */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
          </div>
        </div>
      ) : reportData ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {/* Display Aggregates/Summary */}
          {(reportData.aggregates || reportData.summary) && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {activeReport === 'overtime' && reportData.aggregates && (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Overtime Minutes</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.totalOvertimeMinutes || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.totalAmount || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Records</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.count || 0}
                    </p>
                  </div>
                </>
              )}
              {activeReport === 'penalty' && reportData.aggregates && (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Penalty Amount</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.totalAmount || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Penalty Minutes</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.totalMinutes || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Records</p>
                    <p className="text-2xl font-semibold text-white">
                      {reportData.aggregates.count || 0}
                    </p>
                  </div>
                </>
              )}
              {activeReport === 'attendance' && reportData.summary && (
                <>
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-2xl font-semibold text-white">{String(value)}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Pagination Info */}
          {reportData.pagination && (
            <div className="mb-4 text-sm text-gray-400">
              Showing {((reportData.pagination.page - 1) * reportData.pagination.limit) + 1} to{' '}
              {Math.min(reportData.pagination.page * reportData.pagination.limit, reportData.pagination.total)} of{' '}
              {reportData.pagination.total} records
              {reportData.pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Page {reportData.pagination.page} of {reportData.pagination.totalPages})
                </span>
              )}
            </div>
          )}

          {reportData.data && reportData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {activeReport === 'overtime' && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Employee ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Overtime Minutes</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Multiplier</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Weekend</th>
                      </>
                    )}
                    {activeReport === 'penalty' && (
                      <>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Employee ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Minutes</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                      </>
                    )}
                    {activeReport === 'attendance' && reportData.data[0] && (
                      <>
                        {Object.keys(reportData.data[0]).map((key) => (
                          <th key={key} className="px-6 py-3 text-left text-sm font-semibold text-white">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reportData.data.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-white/5">
                      {activeReport === 'overtime' && (
                        <>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            {row.employeeId?.toString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            {row.recordDate ? new Date(row.recordDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.overtimeMinutes || 0}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.multiplier || 0}x</td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.calculatedAmount || 0}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' :
                              row.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {row.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            {row.isWeekend ? '✓' : '✗'}
                          </td>
                        </>
                      )}
                      {activeReport === 'penalty' && (
                        <>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            {row.employeeId?.toString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            {row.recordDate ? new Date(row.recordDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.type || 'N/A'}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.amount || 0}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">{row.minutes || 0}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' :
                              row.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {row.status || 'N/A'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeReport === 'attendance' && (
                        <>
                          {Object.values(row).map((value: any, cellIndex: number) => (
                            <td key={cellIndex} className="px-6 py-4 text-white/70 text-sm">
                              {typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value || 'N/A')}
                            </td>
                          ))}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No data found for the selected filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400">Select filters and generate a report</p>
        </div>
      )}
    </div>
  );
}
