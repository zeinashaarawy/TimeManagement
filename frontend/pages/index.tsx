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
  Sparkles
} from 'lucide-react';

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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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

            {/* LOGIN BUTTON */}
            <div className="hidden lg:block">
              <button className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
                <div className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center gap-2">
                  Login
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
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
            <button className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
              Login
            </button>
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

    </div>
  );
}
