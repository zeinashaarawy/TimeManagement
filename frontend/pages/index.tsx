import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Network,
  Target,
  Clock,
  UserPlus,
  LogIn,
  Calendar,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  User,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { login, register } from '../services/authApi';
import { storeAuthToken, clearAuth, getCurrentUser, getCurrentUserRole, type UserRole } from '../utils/auth';

// MODULE DATA WITH ROUTES
const modules = [
  {
    name: "Employee Profile",
    desc: "Centralized employee records, documents, contracts, and master data.",
    icon: <Users className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    route: "/subsystems/employee-profile",
  },
  {
    name: "Leaves Management",
    desc: "Leave types, balances, accruals, requests, approvals, and policy automation.",
    icon: <Calendar className="w-8 h-8" />,
    gradient: "from-cyan-500 to-teal-500",
    route: "/subsystems/leaves",
  },
  {
    name: "Payroll Configuration",
    desc: "Salary structures, allowances, deductions, tax rules, and payroll settings.",
    icon: <DollarSign className="w-8 h-8" />,
    gradient: "from-blue-600 to-indigo-600",
    route: "/subsystems/payroll-configuration",
  },
  {
    name: "Payroll Execution",
    desc: "Payroll cycle processing, run generation, validations, and salary calculations.",
    icon: <Clock className="w-8 h-8" />,
    gradient: "from-indigo-500 to-purple-500",
    route: "/subsystems/payroll-execution",
  },
  {
    name: "Payroll Tracking",
    desc: "History tracking, pay slips, audit logs, and payroll reports.",
    icon: <Target className="w-8 h-8" />,
    gradient: "from-purple-500 to-pink-500",
    route: "/subsystems/payroll-tracking",
  },
  {
    name: "Recruitment",
    desc: "Job posting, applicant tracking, interviews, evaluations, and hiring pipeline.",
    icon: <UserPlus className="w-8 h-8" />,
    gradient: "from-blue-500 to-indigo-500",
    route: "/subsystems/recruitment",
  },
  {
    name: "Time Management",
    desc: "Attendance, overtime, shifts, schedules, and time exception handling.",
    icon: <Clock className="w-8 h-8" />,
    gradient: "from-teal-500 to-emerald-500",
    route: "/subsystems/time-management",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole; username: string } | null>(null);

  // Auth form state
  const [loginForm, setLoginForm] = useState({
    employeeNumber: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    employeeNumber: '',
    password: '',
    confirmPassword: '',
    role: 'department employee' as UserRole,
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfHire: '',
    city: '',
    street: '',
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await login(loginForm);
      storeAuthToken(response.data.access_token, response.data.payload);
      setCurrentUser(response.data.payload);
      setSuccess('Login successful!');
      setTimeout(() => {
        setShowAuthModal(false);
        setLoginForm({ employeeNumber: '', password: '' });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register({
        employeeNumber: registerForm.employeeNumber,
        password: registerForm.password,
        role: registerForm.role,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        nationalId: registerForm.nationalId,
        dateOfHire: registerForm.dateOfHire,
        address: {
          city: registerForm.city,
          street: registerForm.street,
        },
      });
      setSuccess('Registration successful! Please login.');
      setTimeout(() => {
        setIsLogin(true);
        setRegisterForm({
          employeeNumber: '',
          password: '',
          confirmPassword: '',
          role: 'department employee',
          firstName: '',
          lastName: '',
          nationalId: '',
          dateOfHire: '',
          city: '',
          street: '',
        });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setShowAuthModal(false);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-blue-900/20" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center py-5">

            {/* LOGO */}
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md" />
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <h1 className="text-2xl bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                HR System
              </h1>
            </div>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-8">
              {["home", "modules", "about", "footer"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item)}
                  className="text-gray-300 hover:text-white relative group"
                >
                  {item[0].toUpperCase() + item.slice(1)}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all"></span>
                </button>
              ))}
            </div>

            {/* LOGIN/USER BUTTON */}
            <div className="hidden lg:block">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{currentUser.username}</span>
                    <span className="text-xs text-gray-400">({currentUser.role})</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsLogin(true);
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-4">
            {["home", "modules", "about", "footer"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item)}
                className="block w-full text-left text-gray-300 hover:text-white py-2"
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{currentUser.username}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{currentUser.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setIsLogin(true);
                }}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl"
              >
                Login
              </button>
            )}
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header id="home" className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <span className="h-2 w-2 relative flex">
              <span className="absolute inset-0 animate-ping bg-cyan-400 rounded-full opacity-75" />
              <span className="relative bg-cyan-500 rounded-full h-2 w-2" />
            </span>
            <span className="text-sm text-cyan-400">Next Generation HR Platform</span>
          </div>

          <h2 className="text-6xl lg:text-7xl font-light mb-6 text-white leading-tight">
            HR Management
            <br />
            <span className="text-blue-300">Platform</span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            A complete system covering employee profiles, attendance, payroll,
            leaves, performance, recruitment, onboarding, and more — all powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-75 group-hover:blur-xl transition-all"></div>
              <div className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center gap-2">
                Get Started
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>

            <button
              onClick={() => scrollTo("modules")}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              Explore Modules
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {[
              { value: '7', label: 'Integrated Modules' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Support' },
              { value: 'AI', label: 'Powered System' },
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl" />
                <div className="relative bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="text-3xl text-blue-300">{s.value}</div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </header>

      {/* MODULES GRID WITH LINKS */}
      <section id="modules" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl mb-4 text-white">HR System Modules</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comprehensive suite of tools designed to streamline every aspect of HR management
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m) => (
              <Link key={m.name} href={m.route}>
                <div className="group relative cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} blur-xl rounded-3xl opacity-0 group-hover:opacity-30 transition-all`} />

                  <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 
                                  rounded-3xl hover:border-white/20 transition-all hover:-translate-y-2">

                    <div className="relative mb-4">
                      <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} rounded-2xl blur-md opacity-50`} />
                      <div className={`relative bg-gradient-to-br ${m.gradient} p-3 rounded-2xl`}>
                        {m.icon}
                      </div>
                    </div>

                    <h4 className="text-xl mb-3 text-white">{m.name}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                      Open Module
                      <ChevronRight className="w-4 h-4" />
                    </div>

                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl mb-4 text-white">Why This System?</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for the future of work with intelligent automation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[  
              {
                title: 'Unified Experience',
                desc: 'All subsystems share a single source of truth for maximum consistency and accuracy.',
                icon: <Network className="w-6 h-6" />,
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Modern Interface',
                desc: 'Intuitive UI ensures fast learning and seamless navigation across roles.',
                icon: <Sparkles className="w-6 h-6" />,
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                title: 'Modular Architecture',
                desc: 'Subsystems are independently developed yet fully integrated.',
                icon: <Target className="w-6 h-6" />,
                gradient: 'from-indigo-500 to-purple-500'
              }
            ].map((f, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} blur-xl rounded-3xl opacity-0 group-hover:opacity-20 transition-all`} />
                <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-white/20 transition-all">

                  <div className={`p-3 mb-6 rounded-2xl text-white bg-gradient-to-br ${f.gradient}`}>
                    {f.icon}
                  </div>

                  <h4 className="text-2xl mb-4 text-white">{f.title}</h4>
                  <p className="text-gray-400 leading-relaxed">{f.desc}</p>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md" />
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              HR System
            </span>
          </div>

          <p className="text-gray-400 text-center">
            © 2025 GIU HR Management System — All rights reserved.
          </p>

          <div className="flex gap-4">
            {["Privacy", "Terms", "Support"].map((t) => (
              <button key={t} className="text-gray-400 hover:text-white">
                {t}
              </button>
            ))}
          </div>

        </div>
      </footer>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">
                {isLogin ? 'Login' : 'Register'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 rounded-md transition-all ${
                  isLogin
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'hover:bg-white/5'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 rounded-md transition-all ${
                  !isLogin
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'hover:bg-white/5'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Employee Number</label>
                  <input
                    type="text"
                    required
                    value={loginForm.employeeNumber}
                    onChange={(e) => setLoginForm({ ...loginForm, employeeNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                    placeholder="Enter employee number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white pr-10"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Logging in...' : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Login
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Employee Number</label>
                  <input
                    type="text"
                    required
                    value={registerForm.employeeNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, employeeNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">National ID</label>
                  <input
                    type="text"
                    required
                    value={registerForm.nationalId}
                    onChange={(e) => setRegisterForm({ ...registerForm, nationalId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Role</label>
                  <select
                    required
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="department employee" className="bg-slate-800 text-white">Employee</option>
                    <option value="department head" className="bg-slate-800 text-white">Manager</option>
                    <option value="HR Manager" className="bg-slate-800 text-white">HR Manager</option>
                    <option value="HR Employee" className="bg-slate-800 text-white">HR Employee</option>
                    <option value="System Admin" className="bg-slate-800 text-white">System Admin</option>
                    <option value="Legal & Policy Admin" className="bg-slate-800 text-white">Legal & Policy Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date of Hire</label>
                  <input
                    type="date"
                    required
                    value={registerForm.dateOfHire}
                    onChange={(e) => setRegisterForm({ ...registerForm, dateOfHire: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">City</label>
                    <input
                      type="text"
                      required
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Street</label>
                    <input
                      type="text"
                      required
                      value={registerForm.street}
                      onChange={(e) => setRegisterForm({ ...registerForm, street: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Registering...' : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
