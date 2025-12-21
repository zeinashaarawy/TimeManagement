import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { getCurrentUser, getCurrentUserRole, type UserRole } from '../../../utils/auth';

// Dynamically import tab components
const ShiftsTemplates = dynamic(() => import('./shifts-templates'), { ssr: false });
const ShiftsAssignments = dynamic(() => import('./shifts-assignments'), { ssr: false });
const ShiftsNotifications = dynamic(() => import('./shifts-notifications'), { ssr: false });
const ShiftsSchedulingRules = dynamic(() => import('./shifts-scheduling-rules'), { ssr: false });
const Attendance = dynamic(() => import('./attendance'), { ssr: false });
const Exceptions = dynamic(() => import('./exceptions'), { ssr: false });
const Policies = dynamic(() => import('./policies'), { ssr: false });
const Reports = dynamic(() => import('./reports'), { ssr: false });
const PayrollSync = dynamic(() => import('./payroll-sync'), { ssr: false });

type TabId = 
  | 'shifts-templates'
  | 'shifts-assignments'
  | 'shifts-notifications'
  | 'shifts-scheduling-rules'
  | 'attendance'
  | 'exceptions'
  | 'policies'
  | 'reports'
  | 'payroll-sync';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  roles: string[];
}

const tabs: Tab[] = [
  {
    id: 'shifts-templates',
    label: 'Shift Templates',
    icon: '📋',
    roles: ['HR Manager', 'System Admin', 'HR Admin'],
  },
  {
    id: 'shifts-assignments',
    label: 'Shift Assignments',
    icon: '📅',
    roles: ['HR Manager', 'System Admin', 'HR Admin'],
  },
  {
    id: 'shifts-notifications',
    label: 'Expiry Notifications',
    icon: '🔔',
    roles: ['HR Manager', 'System Admin', 'HR Admin'],
  },
  {
    id: 'shifts-scheduling-rules',
    label: 'Scheduling Rules',
    icon: '⚙️',
    roles: ['HR Manager', 'System Admin', 'HR Admin'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: '⏰',
    roles: ['HR Manager', 'System Admin', 'HR Admin', 'department head', 'department employee', 'Employee', 'EMPLOYEE'],
  },
  {
    id: 'exceptions',
    label: 'Exceptions',
    icon: '⚠️',
    roles: ['HR Manager', 'System Admin', 'HR Admin', 'department head'],
  },
  {
    id: 'policies',
    label: 'Policies',
    icon: '📜',
    roles: ['HR Manager', 'System Admin', 'HR Admin'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📊',
    roles: ['HR Manager', 'System Admin', 'HR Admin', 'Payroll Manager', 'Payroll Specialist'],
  },
  {
    id: 'payroll-sync',
    label: 'Payroll Integration',
    icon: '💰',
    roles: ['HR Manager', 'System Admin', 'Payroll Manager', 'Payroll Specialist', 'HR Admin'],
  },
];

export default function TimeManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('attendance');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check tab access
  // Use the same role detection as API interceptor for consistency
  const canAccessTab = (tabId: TabId, role: UserRole | null): boolean => {
    if (!role) return false;
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return false;
    
    // Normalize both the role and tab roles for comparison
    const normalizedRole = role.toLowerCase().trim().replace(/_/g, ' ');
    return tab.roles.some(r => {
      const normalizedTabRole = r.toLowerCase().trim().replace(/_/g, ' ');
      return normalizedTabRole === normalizedRole;
    });
  };

  useEffect(() => {
    // Check if we're in the browser (client-side)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Get current user and role using the same method as API interceptor
    // This ensures consistency between UI and API
    const user = getCurrentUser();
    
    // Use the same role detection as API interceptor
    const role = (typeof window !== 'undefined') 
      ? (localStorage.getItem('userRole') || localStorage.getItem('role') || null) as UserRole | null
      : null;
    
    // Check if user is logged in
    if (!user && !role) {
      // No user found, redirect to login
      router.push('/login');
      return;
    }

    // Set user and role
    setCurrentUser(user);
    setUserRole(role);
    setIsLoading(false);

    // Set default tab based on role - only show accessible tabs
    if (role) {
      const availableTabs = tabs.filter(tab => canAccessTab(tab.id, role));
      if (availableTabs.length > 0) {
        // If current active tab is not accessible, switch to first available tab
        if (!canAccessTab(activeTab, role)) {
          setActiveTab(availableTabs[0].id);
        }
      }
    }
  }, [router, activeTab]);

  const canAccessExceptions = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin' || userRole === 'HR Admin' || userRole === 'department head';
  };

  const canAccessPayrollIntegration = (): boolean => {
    if (!userRole) return false;
    return userRole === 'HR Manager' || userRole === 'System Admin' ||
           userRole === 'Payroll Specialist' || userRole === 'Payroll Manager' || userRole === 'HR Admin';
  };

  const userId = currentUser?.id || null;

  const availableTabs = tabs.filter(tab => canAccessTab(tab.id, userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shifts-templates':
        return <ShiftsTemplates />;
      case 'shifts-assignments':
        return <ShiftsAssignments />;
      case 'shifts-notifications':
        return <ShiftsNotifications />;
      case 'shifts-scheduling-rules':
        return <ShiftsSchedulingRules />;
      case 'attendance':
        return <Attendance />;
      case 'exceptions':
        return <Exceptions />;
      case 'policies':
        return <Policies />;
      case 'reports':
        return <Reports />;
      case 'payroll-sync':
        return <PayrollSync />;
      default:
        return <div className="p-6 text-center text-white/70">Select a tab to view content</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto mb-4"></div>
            <p className="text-cyan-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no role, show a helpful message
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6">
        <div className="text-center max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="mb-6">
            <p className="text-red-400 mb-2 font-semibold text-lg">Authentication Required</p>
            <p className="text-gray-400 text-sm">
              Please log in to access Time Management features.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                // Retry getting user
                const user = getCurrentUser();
                const role = getCurrentUserRole();
                if (user || role) {
                  setCurrentUser(user);
                  setUserRole(role);
                } else {
                  router.push('/');
                }
              }}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6">
        <div className="text-center bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md">
          <p className="text-yellow-400 mb-4 font-semibold">Access Denied</p>
          <p className="text-gray-400 text-sm mb-6">
            You don't have access to Time Management features.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
        >
          ← Back
        </button>
      </div>

      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl mb-12 text-center">Time Management</h2>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-2">
            <nav className="flex flex-wrap gap-2" aria-label="Tabs">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 rounded-2xl font-medium text-sm transition-all
                    ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 min-h-[400px]">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
