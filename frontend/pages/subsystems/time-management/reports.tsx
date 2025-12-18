import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  Building,
  Filter,
  CheckCircle,
  XCircle,
  Activity,
  Lock,
  Eye,
} from "lucide-react";
import {
  getAttendanceReport,
  getOvertimeReport,
  getPenaltyReport,
  exportAttendanceReport,
  exportOvertimeReport,
  exportPenaltyReport,
} from "../../../services/timeManagementApi";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

type ReportType = "attendance" | "overtime" | "penalties";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  // Role-based access control
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
  }, []);

  // Permission checks
  const canAccessReports = (): boolean => {
    if (!userRole) return false;
    // HR Manager, HR Admin: Full access
    if (userRole === 'HR Manager' || userRole === 'HR Admin') return true;
    // System Admin: Full access
    if (userRole === 'System Admin') return true;
    // Payroll Specialist/Manager: Read-only access
    if (userRole === 'Payroll Specialist' || userRole === 'Payroll Manager') return true;
    // Manager and Employee: No access
    return false;
  };

  const canExport = (): boolean => {
    if (!userRole) return false;
    // HR Manager, HR Admin, System Admin can export
    return userRole === 'HR Manager' 
      || userRole === 'HR Admin'
      || userRole === 'System Admin';
  };

  const isReadOnly = (): boolean => {
    if (!userRole) return false;
    // Payroll Specialist/Manager have read-only access
    return userRole === 'Payroll Specialist' || userRole === 'Payroll Manager';
  };

  // Filter state
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    employeeId: "",
    departmentId: "",
    status: "",
    type: "",
    includeExceptions: false,
  });

  const generateReport = async () => {
    if (!canAccessReports()) {
      setError("You do not have permission to generate reports");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setReportData(null);

    try {
      const reportFilters: any = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      if (filters.employeeId) reportFilters.employeeId = filters.employeeId;
      if (filters.departmentId) reportFilters.departmentId = filters.departmentId;
      if (filters.status) reportFilters.status = filters.status;
      if (filters.type) reportFilters.type = filters.type;
      if (reportType === "attendance" && filters.includeExceptions) {
        reportFilters.includeExceptions = true;
      }

      let response;
      if (reportType === "attendance") {
        response = await getAttendanceReport(reportFilters);
      } else if (reportType === "overtime") {
        response = await getOvertimeReport(reportFilters);
      } else {
        response = await getPenaltyReport(reportFilters);
      }

      setReportData(response.data);
      setSuccess(`${reportType} report generated successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to generate ${reportType} report`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExport()) {
      setError("You do not have permission to export reports. Only HR Managers can export.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const reportFilters: any = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      if (filters.employeeId) reportFilters.employeeId = filters.employeeId;
      if (filters.departmentId) reportFilters.departmentId = filters.departmentId;
      if (filters.status) reportFilters.status = filters.status;
      if (filters.type) reportFilters.type = filters.type;

      let exportUrl;
      if (reportType === "attendance") {
        exportUrl = exportAttendanceReport(reportFilters);
      } else if (reportType === "overtime") {
        exportUrl = exportOvertimeReport(reportFilters);
      } else {
        exportUrl = exportPenaltyReport(reportFilters);
      }

      // Open export URL in new window to trigger download
      window.open(exportUrl, "_blank");
      setSuccess("Export initiated. CSV file will download shortly.");
    } catch (err: any) {
      setError("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/subsystems/time-management">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Time Management</span>
            </button>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-light mb-2">Time Management Reports</h1>
          <p className="text-gray-400">Generate and export time management reports</p>
        </div>

        {/* Access Denied Message */}
        {!canAccessReports() && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex flex-col items-center gap-3">
            <Lock className="w-8 h-8 text-red-400" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-400 mb-2">Access Denied</h3>
              <p className="text-red-300">
                You do not have permission to access reports. Only HR Managers and System Admins can view reports.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {userRole === 'department employee' && "Employees cannot access aggregated reports for privacy reasons."}
                {userRole === 'department head' && "Managers have access to team dashboards but not detailed reports."}
              </p>
            </div>
          </div>
        )}

        {/* Read-Only Access Message */}
        {isReadOnly() && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">
              You have read-only access. You can view reports but cannot export them.
            </span>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Report Type Selection */}
        {canAccessReports() && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-400" />
              Select Report Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setReportType("attendance");
                setReportData(null);
              }}
              className={`px-6 py-4 rounded-lg border transition-all ${
                reportType === "attendance"
                  ? "bg-purple-500/20 border-purple-500 text-purple-400"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="text-lg font-medium mb-1">Attendance Report</div>
              <div className="text-sm text-gray-400">View attendance records and exceptions</div>
            </button>
            <button
              onClick={() => {
                setReportType("overtime");
                setReportData(null);
              }}
              className={`px-6 py-4 rounded-lg border transition-all ${
                reportType === "overtime"
                  ? "bg-purple-500/20 border-purple-500 text-purple-400"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="text-lg font-medium mb-1">Overtime Report</div>
              <div className="text-sm text-gray-400">View overtime hours and calculations</div>
            </button>
            <button
              onClick={() => {
                setReportType("penalties");
                setReportData(null);
              }}
              className={`px-6 py-4 rounded-lg border transition-all ${
                reportType === "penalties"
                  ? "bg-purple-500/20 border-purple-500 text-purple-400"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="text-lg font-medium mb-1">Penalties Report</div>
              <div className="text-sm text-gray-400">View penalties and deductions</div>
            </button>
          </div>
          </div>
        )}

        {/* Filters */}
        {canAccessReports() && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-400" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Employee ID (Optional)
              </label>
              <input
                type="text"
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                placeholder="Filter by Employee ID"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-400 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Department ID (Optional)
              </label>
              <input
                type="text"
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                placeholder="Filter by Department ID"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            {(reportType === "overtime" || reportType === "penalties") && (
              <div>
                <label className="block mb-2 text-sm text-gray-400">Status (Optional)</label>
                <input
                  type="text"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  placeholder="Filter by status"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
            {reportType === "penalties" && (
              <div>
                <label className="block mb-2 text-sm text-gray-400">Type (Optional)</label>
                <input
                  type="text"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  placeholder="Filter by penalty type"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
            {reportType === "attendance" && (
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  checked={filters.includeExceptions}
                  onChange={(e) =>
                    setFilters({ ...filters, includeExceptions: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm">Include Exceptions</label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Report
                </>
              )}
            </button>
            {canExport() ? (
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            ) : (
              <button
                disabled
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2"
                title="Only HR Managers can export reports"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>
          </div>
        )}

        {/* Report Results */}
        {canAccessReports() && reportData && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl mb-4">Report Results</h2>
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {reportType === "attendance" && (
                        <>
                          <th className="text-left py-3 px-4">Employee ID</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Work Time</th>
                          <th className="text-left py-3 px-4">Punches</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </>
                      )}
                      {reportType === "overtime" && (
                        <>
                          <th className="text-left py-3 px-4">Employee ID</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Overtime Minutes</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </>
                      )}
                      {reportType === "penalties" && (
                        <>
                          <th className="text-left py-3 px-4">Employee ID</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Amount</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        {reportType === "attendance" && (
                          <>
                            <td className="py-3 px-4">{item.employeeId || "N/A"}</td>
                            <td className="py-3 px-4">
                              {item.recordDate
                                ? formatDate(item.recordDate)
                                : "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {item.totalWorkMinutes
                                ? formatTime(item.totalWorkMinutes)
                                : "0h 0m"}
                            </td>
                            <td className="py-3 px-4">
                              {item.punches ? item.punches.length : 0}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  item.hasMissedPunch
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {item.hasMissedPunch ? "Missing" : "Complete"}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === "overtime" && (
                          <>
                            <td className="py-3 px-4">{item.employeeId || "N/A"}</td>
                            <td className="py-3 px-4">
                              {item.date ? formatDate(item.date) : "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {item.overtimeMinutes
                                ? formatTime(item.overtimeMinutes)
                                : "0h 0m"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                                {item.status || "N/A"}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === "penalties" && (
                          <>
                            <td className="py-3 px-4">{item.employeeId || "N/A"}</td>
                            <td className="py-3 px-4">
                              {item.date ? formatDate(item.date) : "N/A"}
                            </td>
                            <td className="py-3 px-4">{item.type || "N/A"}</td>
                            <td className="py-3 px-4">
                              {item.amount ? `$${item.amount.toFixed(2)}` : "$0.00"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400">
                                {item.status || "N/A"}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No data found for the selected filters.
              </div>
            )}
            {reportData.total && (
              <div className="mt-4 text-sm text-gray-400">
                Total records: {reportData.total} | Page: {reportData.page || 1} of{" "}
                {reportData.totalPages || 1}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
