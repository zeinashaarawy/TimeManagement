import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  Users,
  ArrowRightLeft,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import {
  syncPayroll,
  getPayrollSyncStatus,
  retryPayrollSync,
  validatePrePayroll,
  runPrePayrollClosure,
  generatePayrollPayload,
} from "../../../services/timeManagementApi";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";

type TabType = "sync" | "status" | "validate" | "closure" | "payload";

interface SyncLog {
  _id: string;
  periodStart: string;
  periodEnd: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
  payloadSummary?: {
    totalRecords: number;
    totalEmployees: number;
    totalOvertimeMinutes: number;
    totalPenalties: number;
    totalAmount: number;
  };
  errors?: Array<{
    employeeId: string;
    recordId: string;
    error: string;
    timestamp: string;
  }>;
  syncedAt?: string;
  externalSyncId?: string;
  retryCount?: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PayrollSync({ asTab = false }: { asTab?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<TabType>("sync");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Role-based access control
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
  }, []);

  // Permission check: HR Manager, System Admin, and Payroll roles can access Payroll Integration
  const canAccessPayrollIntegration = (): boolean => {
    if (!userRole) return false;
    // HR Manager: Full access (main role)
    if (userRole === 'HR Manager') return true;
    // System Admin: Full access
    if (userRole === 'System Admin') return true;
    // Payroll Specialist/Manager: Read-only access
    if (userRole === 'Payroll Specialist' || userRole === 'Payroll Manager') return true;
    // HR Admin, Employee, and Manager: No access
    return false;
  };

  const isReadOnly = (): boolean => {
    if (!userRole) return false;
    // Payroll roles have read-only access
    return userRole === 'Payroll Specialist' || userRole === 'Payroll Manager';
  };

  // Sync form state
  const [syncForm, setSyncForm] = useState({
    periodStart: new Date(new Date().setDate(new Date().getDate() - 14))
      .toISOString()
      .split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    employeeIds: "",
    initiatedBy: "",
  });

  // Status check state
  const [syncId, setSyncId] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncLog | null>(null);

  // Validation state
  const [validationForm, setValidationForm] = useState({
    periodStart: new Date(new Date().setDate(new Date().getDate() - 14))
      .toISOString()
      .split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
  });
  const [validationResult, setValidationResult] = useState<any>(null);

  // Closure state
  const [closureForm, setClosureForm] = useState({
    periodStart: new Date(new Date().setDate(new Date().getDate() - 14))
      .toISOString()
      .split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    escalationDeadlineHours: 24,
  });
  const [closureResult, setClosureResult] = useState<any>(null);

  // Payload state
  const [payloadForm, setPayloadForm] = useState({
    periodStart: new Date(new Date().setDate(new Date().getDate() - 14))
      .toISOString()
      .split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    employeeIds: "",
  });
  const [payloadData, setPayloadData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Handle Payroll Sync
  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAccessPayrollIntegration()) {
      setError("You do not have permission to sync payroll. Only HR Managers and System Admins can perform this action.");
      return;
    }
    
    setLoading(true);
    clearMessages();

    try {
      const employeeIdsArray = syncForm.employeeIds
        ? syncForm.employeeIds.split(",").map((id) => id.trim()).filter(Boolean)
        : undefined;

      const response = await syncPayroll({
        periodStart: syncForm.periodStart,
        periodEnd: syncForm.periodEnd,
        employeeIds: employeeIdsArray,
        initiatedBy: syncForm.initiatedBy || undefined,
      });

      setSuccess(
        `Payroll sync initiated successfully! Sync ID: ${response.data._id || response.data.id}`
      );
      setSyncId(response.data._id || response.data.id);
      setSyncStatus(response.data);
      setActiveTab("status");
    } catch (err: any) {
      console.error("Error syncing payroll:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to sync payroll";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Status Check
  const handleCheckStatus = async () => {
    if (!syncId.trim()) {
      setError("Please enter a sync ID");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const response = await getPayrollSyncStatus(syncId.trim());
      setSyncStatus(response.data);
      setSuccess("Sync status retrieved successfully");
    } catch (err: any) {
      console.error("Error checking sync status:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to get sync status";
      setError(`Error: ${errorMessage}`);
      setSyncStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Retry Sync
  const handleRetrySync = async () => {
    if (!syncId.trim()) {
      setError("Please enter a sync ID");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const response = await retryPayrollSync(syncId.trim());
      setSuccess("Sync retry initiated successfully");
      setSyncStatus(response.data);
    } catch (err: any) {
      console.error("Error retrying sync:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to retry sync";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Validation
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAccessPayrollIntegration()) {
      setError("You do not have permission to validate payroll data. Only HR Managers and System Admins can perform this action.");
      return;
    }
    
    setLoading(true);
    clearMessages();

    try {
      const response = await validatePrePayroll({
        periodStart: validationForm.periodStart,
        periodEnd: validationForm.periodEnd,
      });
      setValidationResult(response.data);
      setSuccess("Pre-payroll validation completed");
    } catch (err: any) {
      console.error("Error validating pre-payroll:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to validate pre-payroll";
      setError(`Error: ${errorMessage}`);
      setValidationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Closure
  const handleClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAccessPayrollIntegration()) {
      setError("You do not have permission to run pre-payroll closure. Only HR Managers and System Admins can perform this action.");
      return;
    }
    
    setLoading(true);
    clearMessages();

    try {
      const response = await runPrePayrollClosure({
        periodStart: closureForm.periodStart,
        periodEnd: closureForm.periodEnd,
        escalationDeadlineHours: closureForm.escalationDeadlineHours,
      });
      setClosureResult(response.data);
      setSuccess("Pre-payroll closure completed");
    } catch (err: any) {
      console.error("Error running closure:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to run pre-payroll closure";
      setError(`Error: ${errorMessage}`);
      setClosureResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Payload Generation
  const handleGeneratePayload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAccessPayrollIntegration()) {
      setError("You do not have permission to generate payroll payload. Only HR Managers and System Admins can perform this action.");
      return;
    }
    
    setLoading(true);
    clearMessages();

    try {
      const response = await generatePayrollPayload({
        periodStart: payloadForm.periodStart,
        periodEnd: payloadForm.periodEnd,
        employeeIds: payloadForm.employeeIds || undefined,
      });
      setPayloadData(response.data);
      setSuccess("Payroll payload generated successfully");
    } catch (err: any) {
      console.error("Error generating payload:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to generate payroll payload";
      setError(`Error: ${errorMessage}`);
      setPayloadData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Copy to Clipboard
  const handleCopyPayload = async () => {
    if (!payloadData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payloadData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle Download Payload
  const handleDownloadPayload = () => {
    if (!payloadData) return;
    const jsonString = JSON.stringify(payloadData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-payload-${payloadForm.periodStart}-${payloadForm.periodEnd}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "IN_PROGRESS":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "FAILED":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "PARTIAL":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5" />;
      case "FAILED":
        return <XCircle className="w-5 h-5" />;
      case "PARTIAL":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const content = (
    <div className={asTab ? "" : "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12"}>
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
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-light">Payroll Integration</h1>
                <p className="text-gray-400 mt-1">
                  Sync time data with payroll system
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Message */}
        {!canAccessPayrollIntegration() && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex flex-col items-center gap-3">
            <Lock className="w-8 h-8 text-red-400" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-400 mb-2">Access Denied</h3>
              <p className="text-red-300">
                You do not have permission to access Payroll Integration. Only HR Managers and System Admins can access this page.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {userRole === 'department employee' && "Employees must not affect payroll. You can only view your personal attendance and payslip."}
                {userRole === 'department head' && "Managers approve attendance only. Payroll integration is restricted to HR Managers."}
              </p>
            </div>
          </div>
        )}

        {/* Notification Banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400">{success}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs - Only show if user has access */}
        {canAccessPayrollIntegration() && (
          <>
            <div className="flex gap-2 mb-6 border-b border-white/10">
              {[
                { id: "sync", label: "Sync Payroll", icon: ArrowRightLeft },
                { id: "status", label: "Sync Status", icon: Clock },
                { id: "validate", label: "Validate", icon: CheckCircle },
                { id: "closure", label: "Pre-Payroll Closure", icon: FileText },
                { id: "payload", label: "Generate Payload", icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      clearMessages();
                    }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-green-400 text-green-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8">
          {/* Sync Payroll Tab */}
          {activeTab === "sync" && (
            <div>
              <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                <ArrowRightLeft className="w-6 h-6" />
                Sync Payroll Data
              </h2>
              <form onSubmit={handleSync} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={syncForm.periodStart}
                      onChange={(e) =>
                        setSyncForm({ ...syncForm, periodStart: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={syncForm.periodEnd}
                      onChange={(e) =>
                        setSyncForm({ ...syncForm, periodEnd: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Employee IDs (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={syncForm.employeeIds}
                    onChange={(e) =>
                      setSyncForm({ ...syncForm, employeeIds: e.target.value })
                    }
                    placeholder="e.g., 507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty to sync all employees
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Initiated By (User ID, optional)
                  </label>
                  <input
                    type="text"
                    value={syncForm.initiatedBy}
                    onChange={(e) =>
                      setSyncForm({ ...syncForm, initiatedBy: e.target.value })
                    }
                    placeholder="User ID who initiated the sync"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      <span>Sync Payroll</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Sync Status Tab */}
          {activeTab === "status" && (
            <div>
              <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6" />
                Check Sync Status
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={syncId}
                    onChange={(e) => setSyncId(e.target.value)}
                    placeholder="Enter Sync ID"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                  />
                  <button
                    onClick={handleCheckStatus}
                    disabled={loading || !syncId.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Check Status
                  </button>
                </div>

                {syncStatus && (
                  <div className="mt-6 space-y-4">
                    <div
                      className={`p-6 border rounded-xl ${getStatusColor(
                        syncStatus.status
                      )}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(syncStatus.status)}
                          <span className="text-lg font-medium">
                            Status: {syncStatus.status}
                          </span>
                        </div>
                        {syncStatus.status === "FAILED" && (
                          <button
                            onClick={handleRetrySync}
                            disabled={loading}
                            className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Period Start</p>
                          <p className="font-medium">
                            {new Date(syncStatus.periodStart).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Period End</p>
                          <p className="font-medium">
                            {new Date(syncStatus.periodEnd).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Retry Count</p>
                          <p className="font-medium">
                            {syncStatus.retryCount || 0}
                          </p>
                        </div>
                        {syncStatus.syncedAt && (
                          <div>
                            <p className="text-gray-400">Synced At</p>
                            <p className="font-medium">
                              {new Date(syncStatus.syncedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {syncStatus.lastError && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400 text-sm">
                            Error: {syncStatus.lastError}
                          </p>
                        </div>
                      )}
                    </div>

                    {syncStatus.payloadSummary && (
                      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Payload Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Total Records</p>
                            <p className="text-xl font-medium">
                              {syncStatus.payloadSummary.totalRecords || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Total Employees</p>
                            <p className="text-xl font-medium">
                              {syncStatus.payloadSummary.totalEmployees || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Overtime (min)</p>
                            <p className="text-xl font-medium">
                              {syncStatus.payloadSummary.totalOvertimeMinutes || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Penalties</p>
                            <p className="text-xl font-medium">
                              {syncStatus.payloadSummary.totalPenalties || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Total Amount</p>
                            <p className="text-xl font-medium">
                              ${syncStatus.payloadSummary.totalAmount?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {syncStatus.errors && syncStatus.errors.length > 0 && (
                      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <h3 className="text-lg font-medium mb-4 text-red-400">
                          Errors ({syncStatus.errors.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {syncStatus.errors.map((error, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-sm"
                            >
                              <p className="text-red-300">
                                <span className="font-medium">Employee:</span>{" "}
                                {error.employeeId}
                              </p>
                              <p className="text-red-300">
                                <span className="font-medium">Record:</span>{" "}
                                {error.recordId}
                              </p>
                              <p className="text-red-400 mt-1">{error.error}</p>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(error.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validate Tab */}
          {activeTab === "validate" && (
            <div>
              <h2 className="text-2xl font-light mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                Validate Pre-Payroll Data
              </h2>
              
              {/* Description */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300">
                  <strong className="text-blue-400">Purpose:</strong> This step validates attendance data before payroll closure. 
                  The system ensures there are no pending approvals or unresolved exceptions. If issues exist, payroll is blocked 
                  until managers and HR finalize all attendance corrections and penalties. This guarantees payroll accuracy and compliance.
                </p>
              </div>

              <form onSubmit={handleValidate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={validationForm.periodStart}
                      onChange={(e) =>
                        setValidationForm({
                          ...validationForm,
                          periodStart: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={validationForm.periodEnd}
                      onChange={(e) =>
                        setValidationForm({
                          ...validationForm,
                          periodEnd: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Validate</span>
                    </>
                  )}
                </button>
              </form>

              {validationResult && (
                <div className="mt-6 space-y-4">
                  {/* Validation Status */}
                  {validationResult.isValid !== undefined && (
                    <div className={`p-6 border rounded-xl ${
                      validationResult.isValid
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-yellow-500/10 border-yellow-500/20"
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        {validationResult.isValid ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-yellow-400" />
                        )}
                        <h3 className="text-lg font-medium">
                          Validation Status:{" "}
                          <span className={validationResult.isValid ? "text-green-400" : "text-yellow-400"}>
                            {validationResult.isValid ? "Valid ✓" : "Issues Found ⚠"}
                          </span>
                        </h3>
                      </div>

                      {validationResult.issues && validationResult.issues.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-300 mb-2">Issues Found:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {validationResult.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-yellow-300">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.pendingApprovals !== undefined && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-400">Pending Approvals</p>
                            <p className="text-xl font-medium text-yellow-400">
                              {validationResult.pendingApprovals || 0}
                            </p>
                          </div>
                          {validationResult.inconsistentRecords !== undefined && (
                            <div>
                              <p className="text-gray-400">Inconsistent Records</p>
                              <p className="text-xl font-medium text-yellow-400">
                                {validationResult.inconsistentRecords || 0}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Hints - Show when validation fails */}
                      {!validationResult.isValid && (
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-yellow-400 mb-2">
                                Action Required
                              </h4>
                              <p className="text-sm text-yellow-300 mb-3">
                                Please resolve pending approvals and attendance exceptions before proceeding to payroll closure.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Link href="/subsystems/time-management/attendance">
                                  <button className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all text-xs flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Go to Attendance Approvals
                                  </button>
                                </Link>
                                <button 
                                  onClick={() => setActiveTab("closure")}
                                  className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all text-xs flex items-center gap-2"
                                  title="View pending penalties in Pre-Payroll Closure tab"
                                >
                                  <FileText className="w-3 h-3" />
                                  View Pending Penalties
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success Message - Show when validation passes */}
                      {validationResult.isValid && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-green-400 mb-2">
                                All Checks Passed ✓
                              </h4>
                              <p className="text-sm text-green-300 mb-3">
                                All attendance data is finalized and approved. You can proceed to Pre-Payroll Closure.
                              </p>
                              <button 
                                onClick={() => setActiveTab("closure")}
                                className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-all text-xs flex items-center gap-2"
                              >
                                <FileText className="w-3 h-3" />
                                Proceed to Pre-Payroll Closure
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional validation data */}
                  {validationResult && Object.keys(validationResult).length > 0 && (
                    <details className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                        View Raw Validation Data
                      </summary>
                      <pre className="mt-4 bg-black/20 p-4 rounded-lg overflow-x-auto text-xs max-h-64 overflow-y-auto">
                        {JSON.stringify(validationResult, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Closure Tab */}
          {activeTab === "closure" && (
            <div>
              <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Pre-Payroll Closure
              </h2>
              <form onSubmit={handleClosure} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={closureForm.periodStart}
                      onChange={(e) =>
                        setClosureForm({
                          ...closureForm,
                          periodStart: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={closureForm.periodEnd}
                      onChange={(e) =>
                        setClosureForm({
                          ...closureForm,
                          periodEnd: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Escalation Deadline (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={closureForm.escalationDeadlineHours}
                    onChange={(e) =>
                      setClosureForm({
                        ...closureForm,
                        escalationDeadlineHours: parseInt(e.target.value) || 24,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Default: 24 hours
                  </p>
                </div>
                {/* Warning if validation hasn't passed */}
                {validationResult && !validationResult.isValid && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-300 mb-2">
                        <strong>Warning:</strong> Validation has not passed. Please resolve all pending issues before running closure.
                      </p>
                      <button 
                        onClick={() => setActiveTab("validate")}
                        className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                      >
                        Go back to Validate tab
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (validationResult && !validationResult.isValid)}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={validationResult && !validationResult.isValid ? "Please resolve validation issues first" : ""}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Running Closure...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Run Pre-Payroll Closure</span>
                    </>
                  )}
                </button>
              </form>

              {closureResult && (
                <div className="mt-6 space-y-4">
                  {/* Validation Status */}
                  {closureResult.validationResult && (
                    <div className={`p-6 border rounded-xl ${
                      closureResult.validationResult.isValid
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-yellow-500/10 border-yellow-500/20"
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        {closureResult.validationResult.isValid ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-yellow-400" />
                        )}
                        <h3 className="text-lg font-medium">
                          Validation Status:{" "}
                          <span className={closureResult.validationResult.isValid ? "text-green-400" : "text-yellow-400"}>
                            {closureResult.validationResult.isValid ? "Valid" : "Issues Found"}
                          </span>
                        </h3>
                      </div>

                      {closureResult.validationResult.issues && closureResult.validationResult.issues.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-300 mb-2">Issues:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                            {closureResult.validationResult.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-yellow-300">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Pending Approvals</p>
                          <p className="text-xl font-medium text-yellow-400">
                            {closureResult.validationResult.pendingApprovals || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Inconsistent Records</p>
                          <p className="text-xl font-medium text-yellow-400">
                            {closureResult.validationResult.inconsistentRecords || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Report Summary */}
                  {closureResult.report && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Report Summary
                      </h3>
                      
                      <div className="mb-4 text-sm text-gray-400">
                        <p>
                          Period: {new Date(closureResult.report.periodStart).toLocaleDateString()} - {new Date(closureResult.report.periodEnd).toLocaleDateString()}
                        </p>
                        <p>
                          Generated: {new Date(closureResult.report.generatedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pending Overtime */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <p className="text-gray-400 text-sm mb-2">Pending Overtime</p>
                          <p className="text-2xl font-medium">
                            {closureResult.report.pendingOvertime?.count || 0}
                          </p>
                          {closureResult.report.pendingOvertime?.records && closureResult.report.pendingOvertime.records.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {closureResult.report.pendingOvertime.records.map((record: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-400 p-2 bg-black/20 rounded">
                                  <p>ID: {record.id}</p>
                                  <p>Employee: {record.employee || "Unknown"}</p>
                                  <p>Type: {record.type}</p>
                                  <p>Amount: ${record.amount}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pending Penalties */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <p className="text-gray-400 text-sm mb-2">Pending Penalties</p>
                          <p className="text-2xl font-medium text-yellow-400">
                            {closureResult.report.pendingPenalties?.count || 0}
                          </p>
                          {closureResult.report.pendingPenalties?.records && closureResult.report.pendingPenalties.records.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                              {closureResult.report.pendingPenalties.records.map((record: any, idx: number) => (
                                <div key={idx} className="text-xs text-yellow-300 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                  <p className="font-medium">ID: {record.id}</p>
                                  <p>Employee: {record.employee || "Unknown"}</p>
                                  <p>Type: {record.type}</p>
                                  <p>Amount: ${record.amount}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pending Exceptions */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <p className="text-gray-400 text-sm mb-2">Pending Exceptions</p>
                          <p className="text-2xl font-medium">
                            {closureResult.report.pendingExceptions?.count || 0}
                          </p>
                          {closureResult.report.pendingExceptions?.records && closureResult.report.pendingExceptions.records.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {closureResult.report.pendingExceptions.records.map((record: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-400 p-2 bg-black/20 rounded">
                                  <p>ID: {record.id}</p>
                                  <p>Employee: {record.employee || "Unknown"}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Escalations */}
                  {closureResult.escalations && closureResult.escalations.length > 0 && (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        Escalations ({closureResult.escalations.length})
                      </h3>
                      <div className="space-y-3">
                        {closureResult.escalations.map((escalation: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-red-300">
                                Type: {escalation.type}
                              </span>
                              {escalation.escalated && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                  Escalated
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300">
                              Record ID: <span className="font-mono text-xs">{escalation.recordId}</span>
                            </p>
                            {escalation.reason && (
                              <p className="text-sm text-red-300 mt-1">{escalation.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payload Tab */}
          {activeTab === "payload" && (
            <div>
              <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                <Download className="w-6 h-6" />
                Generate Payroll Payload
              </h2>
              <form onSubmit={handleGeneratePayload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={payloadForm.periodStart}
                      onChange={(e) =>
                        setPayloadForm({
                          ...payloadForm,
                          periodStart: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Period End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={payloadForm.periodEnd}
                      onChange={(e) =>
                        setPayloadForm({
                          ...payloadForm,
                          periodEnd: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Employee IDs (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={payloadForm.employeeIds}
                    onChange={(e) =>
                      setPayloadForm({
                        ...payloadForm,
                        employeeIds: e.target.value,
                      })
                    }
                    placeholder="e.g., 507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty to generate payload for all employees
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Generate Payload</span>
                    </>
                  )}
                </button>
              </form>

              {payloadData && (
                <div className="mt-6 space-y-4">
                  {/* Period Information */}
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-medium">Payroll Period</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Start Date</p>
                        <p className="font-medium">
                          {new Date(payloadData.periodStart).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">End Date</p>
                        <p className="font-medium">
                          {new Date(payloadData.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {payloadData.summary && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Summary
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopyPayload}
                            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-xs"
                            title="Copy JSON to clipboard"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleDownloadPayload}
                            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-xs"
                            title="Download as JSON file"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download JSON</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Total Employees</p>
                          <p className="text-xl font-medium">
                            {payloadData.summary.totalEmployees || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Records</p>
                          <p className="text-xl font-medium">
                            {payloadData.summary.totalRecords || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Overtime (min)</p>
                          <p className="text-xl font-medium">
                            {payloadData.summary.totalOvertimeMinutes || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Penalties</p>
                          <p className="text-xl font-medium">
                            {payloadData.summary.totalPenalties || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Amount</p>
                          <p className="text-xl font-medium">
                            ${payloadData.summary.totalAmount?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employee Records */}
                  {payloadData.records && payloadData.records.length > 0 ? (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Employee Records ({payloadData.records.length})
                      </h3>
                      <div className="space-y-4">
                        {payloadData.records.map((employeeRecord: any, idx: number) => (
                          <details
                            key={idx}
                            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                          >
                            <summary className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-medium">
                                  {employeeRecord.employeeId?.slice(-2).toUpperCase() || "ID"}
                                </div>
                                <div>
                                  <p className="font-medium">Employee ID</p>
                                  <p className="text-xs text-gray-400 font-mono">
                                    {employeeRecord.employeeId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                  <p className="text-gray-400">Records</p>
                                  <p className="font-medium">
                                    {employeeRecord.attendanceRecords?.length || 0}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-400">Total Amount</p>
                                  <p className="font-medium text-green-400">
                                    ${(employeeRecord.totals?.totalOvertimeAmount || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </summary>
                            <div className="p-4 border-t border-white/10 space-y-4">
                              {/* Employee Totals */}
                              {employeeRecord.totals && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-black/20 rounded-lg">
                                  <div>
                                    <p className="text-xs text-gray-400">Worked Minutes</p>
                                    <p className="font-medium">
                                      {employeeRecord.totals.totalWorkedMinutes || 0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400">Overtime Minutes</p>
                                    <p className="font-medium text-yellow-400">
                                      {employeeRecord.totals.totalOvertimeMinutes || 0}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400">Overtime Amount</p>
                                    <p className="font-medium text-green-400">
                                      ${(employeeRecord.totals.totalOvertimeAmount || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400">Penalties</p>
                                    <p className="font-medium text-red-400">
                                      ${(employeeRecord.totals.totalPenalties || 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Attendance Records */}
                              {employeeRecord.attendanceRecords && employeeRecord.attendanceRecords.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Attendance Records
                                  </h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {employeeRecord.attendanceRecords.map((record: any, recordIdx: number) => (
                                      <div
                                        key={recordIdx}
                                        className="p-3 bg-black/20 border border-white/10 rounded-lg"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <p className="text-sm font-medium">
                                              {new Date(record.date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-400 font-mono">
                                              Record: {record.recordId?.slice(-8)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-gray-400">Worked</p>
                                            <p className="text-sm font-medium">
                                              {record.workedMinutes || 0} min
                                            </p>
                                          </div>
                                        </div>

                                        {/* Overtime */}
                                        {record.overtime && record.overtime.length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-white/10">
                                            <p className="text-xs text-gray-400 mb-1">Overtime:</p>
                                            <div className="space-y-1">
                                              {record.overtime.map((ot: any, otIdx: number) => (
                                                <div
                                                  key={otIdx}
                                                  className="text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1"
                                                >
                                                  {ot.minutes} min × {ot.multiplier}x
                                                  {ot.isWeekend && " (Weekend)"} = $
                                                  {ot.amount?.toFixed(2) || "0.00"}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Penalties */}
                                        {record.penalties && record.penalties.length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-white/10">
                                            <p className="text-xs text-gray-400 mb-1">Penalties:</p>
                                            <div className="space-y-1">
                                              {record.penalties.map((penalty: any, pIdx: number) => (
                                                <div
                                                  key={pIdx}
                                                  className="text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1"
                                                >
                                                  {penalty.type}: {penalty.minutes} min = $
                                                  {penalty.amount?.toFixed(2) || "0.00"}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                      <p className="text-gray-400">No records found for this period</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return content;
}

