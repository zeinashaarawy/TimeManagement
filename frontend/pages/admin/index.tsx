import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    const normalizedRole = (savedRole || '')
      .toUpperCase()
      .replaceAll(' ', '_');

    if (normalizedRole !== 'SYSTEM_ADMIN') {
      router.push('/dashboard');
      return;
    }

    setUsername(savedUser || 'Unknown User');
    setRole(normalizedRole);
    setLoading(false);
  }, [router]);

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: '👥',
      path: '/admin/users',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Organization Structure',
      description: 'Manage departments and positions',
      icon: '🏢',
      path: '/admin/organization-structure',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'System Activity',
      description: 'View system logs and activity',
      icon: '📊',
      path: '/admin/system-activity',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  if (loading) {
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
        <h2 className="text-5xl mb-4 text-center">Admin Dashboard</h2>
        <p className="text-center text-gray-400 mb-12">Welcome, {username}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <div
              key={card.path}
              onClick={() => router.push(card.path)}
              className="group relative cursor-pointer"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} blur-xl opacity-20 rounded-3xl`}
              />
              <div className="relative bg-white/5 border border-white/10 p-6 rounded-3xl hover:-translate-y-2 transition-all">
                <div
                  className={`p-3 mb-4 rounded-2xl bg-gradient-to-br ${card.gradient}`}
                >
                  <span className="text-3xl">{card.icon}</span>
                </div>
                <h4 className="text-xl mb-2">{card.title}</h4>
                <p className="text-gray-400 text-sm">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
