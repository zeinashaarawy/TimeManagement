import Link from "next/link";
import { Settings, FileText, DollarSign, ArrowLeft } from "lucide-react";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";
import { useState, useEffect } from "react";

export default function TimeManagement() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
  }, []);

  // Permission checks based on role visibility table
  const canAccessReports = (): boolean => {
    if (!userRole) return false;
    // HR Manager: Full access, System Admin: Optional/Read-only
    return userRole === 'HR Manager' || userRole === 'System Admin';
  };

  const canAccessPolicies = (): boolean => {
    if (!userRole) return false;
    // HR Manager: Full access, System Admin: Optional
    return userRole === 'HR Manager' || userRole === 'System Admin';
  };

  const canAccessPayrollIntegration = (): boolean => {
    if (!userRole) return false;
    // HR Manager: Full access, System Admin: Optional
    return userRole === 'HR Manager' || userRole === 'System Admin';
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6 py-12">
      {/* Back Navigation */}
      <div className="w-full max-w-4xl mb-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </Link>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl lg:text-6xl font-light mb-4 text-center">
        Time Management Subsystem
      </h1>
      <p className="text-gray-400 mb-4 text-center max-w-2xl">
        Phase 3 & 5: Policy Configuration, Reports & Analytics, and Payroll Integration
      </p>
      
      {/* Debug: Show current role and access info (for testing) */}
      {userRole && (
        <div className="mb-8 text-center space-y-2">
          <div>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Current Role: <span className="text-blue-400 font-medium">{userRole}</span>
            </span>
          </div>
          <p className="text-xs text-blue-400/70 max-w-md mx-auto">
            Assigned Phases: <strong>Phase 3 (Policy Configuration)</strong> and <strong>Phase 5 (Reports & Payroll)</strong>
          </p>
        </div>
      )}
      
      {/* Role Selector for Testing (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 text-center">
          <label className="text-xs text-gray-400 mb-2 block">Test with different role:</label>
          <select
            value={userRole || ''}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              setUserRole(newRole);
              localStorage.setItem('userRole', newRole);
              window.location.reload();
            }}
            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="department employee">Employee</option>
            <option value="department head">Manager</option>
            <option value="HR Manager">HR Manager</option>
            <option value="System Admin">System Admin</option>
          </select>
        </div>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Policies - Only HR Manager and System Admin */}
        {canAccessPolicies() && (
          <Link href="/subsystems/time-management/policies">
            <div className="group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 blur-xl rounded-3xl opacity-0 group-hover:opacity-30 transition-all" />
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all hover:-translate-y-2">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-md opacity-50" />
                  <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-2xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl mb-2 text-white font-medium">Policy Configuration</h3>
                <p className="text-gray-400 text-sm">Configure time policies and rules</p>
              </div>
            </div>
          </Link>
        )}

        {/* Reports - Only visible to HR Manager and System Admin */}
        {canAccessReports() && (
          <Link href="/subsystems/time-management/reports">
            <div className="group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 blur-xl rounded-3xl opacity-0 group-hover:opacity-30 transition-all" />
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all hover:-translate-y-2">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-md opacity-50" />
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl mb-2 text-white font-medium">Reports & Analytics</h3>
                <p className="text-gray-400 text-sm">Generate and export time management reports</p>
              </div>
            </div>
          </Link>
        )}

        {/* Payroll Integration - Only HR Manager and System Admin */}
        {canAccessPayrollIntegration() && (
          <Link href="/subsystems/time-management/payroll-sync">
            <div className="group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 blur-xl rounded-3xl opacity-0 group-hover:opacity-30 transition-all" />
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all hover:-translate-y-2">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl blur-md opacity-50" />
                  <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl mb-2 text-white font-medium">Payroll Integration</h3>
                <p className="text-gray-400 text-sm">Sync time data with payroll system</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
