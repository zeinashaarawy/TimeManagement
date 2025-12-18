import Link from "next/link";
import { Settings, FileText, DollarSign, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { getCurrentUserRole, type UserRole } from "../../../utils/auth";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import the existing page components - they will be rendered as tab content
const PoliciesPage = dynamic(() => import("./policies"), { ssr: false });
const ReportsPage = dynamic(() => import("./reports"), { ssr: false });
const PayrollPage = dynamic(() => import("./payroll-sync"), { ssr: false });
const AttendancePage = dynamic(() => import("./attendance"), { ssr: false });
const ExceptionsPage = dynamic(() => import("./exceptions"), { ssr: false });

type MainTabType = "attendance" | "exceptions" | "policies" | "reports" | "payroll";

export default function TimeManagement() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabType>("attendance");

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
    
    // Set default tab based on available access
    if (canAccessAttendance()) {
      setActiveTab("attendance");
    } else if (role === 'HR Manager' || role === 'System Admin') {
      setActiveTab("policies");
    } else if (role === 'Payroll Specialist' || role === 'Payroll Manager') {
      setActiveTab("reports");
    }
  }, []);

  // Permission checks
  const canAccessAttendance = (): boolean => {
    if (!userRole) return false;
    // All employees can access attendance dashboard
    return true;
  };

  const canAccessExceptions = (): boolean => {
    if (!userRole) return false;
    // Only managers can access exception management
    return userRole === 'HR Manager' || userRole === 'System Admin' || userRole === 'HR Admin';
  };

  const canAccessReports = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin' || 
           userRole === 'HR Admin' || userRole === 'Payroll Specialist' || 
           userRole === 'Payroll Manager';
  };

  const canAccessPolicies = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin';
  };

  const canAccessPayrollIntegration = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin' ||
           userRole === 'Payroll Specialist' || userRole === 'Payroll Manager';
  };

  const tabs = [
    {
      id: "attendance" as MainTabType,
      label: "Attendance",
      icon: Clock,
      canAccess: canAccessAttendance(),
      color: "#60a5fa",
    },
    {
      id: "exceptions" as MainTabType,
      label: "Exceptions",
      icon: AlertCircle,
      canAccess: canAccessExceptions(),
      color: "#f59e0b",
    },
    {
      id: "policies" as MainTabType,
      label: "Policies",
      icon: Settings,
      canAccess: canAccessPolicies(),
      color: "#8b5cf6",
    },
    {
      id: "reports" as MainTabType,
      label: "Reports & Analytics",
      icon: FileText,
      canAccess: canAccessReports(),
      color: "#a78bfa",
    },
    {
      id: "payroll" as MainTabType,
      label: "Payroll Integration",
      icon: DollarSign,
      canAccess: canAccessPayrollIntegration(),
      color: "#4ade80",
    },
  ].filter(tab => tab.canAccess);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </Link>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-light">Time Management</h1>
                <p className="text-gray-400 mt-1">
                  Policy Configuration, Reports & Analytics, and Payroll Integration
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          {tabs.length > 0 && (
            <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? ""
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                    style={
                      isActive
                        ? {
                            borderBottomColor: tab.color,
                            color: tab.color,
                          }
                        : {}
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 min-h-[600px] overflow-hidden">
            {activeTab === "attendance" && canAccessAttendance() && (
              <AttendancePage asTab={true} />
            )}
            {activeTab === "exceptions" && canAccessExceptions() && (
              <ExceptionsPage asTab={true} />
            )}
            {activeTab === "policies" && canAccessPolicies() && (
              <PoliciesPage asTab={true} />
            )}
            {activeTab === "reports" && canAccessReports() && (
              <ReportsPage asTab={true} />
            )}
            {activeTab === "payroll" && canAccessPayrollIntegration() && (
              <PayrollPage asTab={true} />
            )}
            
            {tabs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">You do not have access to any Time Management features.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
