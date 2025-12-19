import React, { useState, useEffect } from 'react';
import { getAttendanceReport, getOvertimeReport, getPenaltyReport, exportAttendanceReport, exportOvertimeReport } from '../../../services/timeManagementApi';

interface ReportData {
  data?: any[];
  total?: number;
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
        });
      }

      setReportData(response.data || {});
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
          {reportData.summary && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-2xl font-semibold text-white">{String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {reportData.data && reportData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {Object.keys(reportData.data[0]).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-sm font-semibold text-white">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reportData.data.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-white/5">
                      {Object.values(row).map((value: any, cellIndex: number) => (
                        <td key={cellIndex} className="px-6 py-4 text-white/70 text-sm">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
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
