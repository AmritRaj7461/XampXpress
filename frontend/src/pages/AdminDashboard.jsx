import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, GraduationCap, Building2, FileText, ChevronRight, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { api } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load system statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/10',
    },
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      shadow: 'shadow-purple-500/10',
    },
    {
      title: 'Organizations',
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      color: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/10',
    },
    {
      title: 'Exams Scheduled',
      value: stats?.totalExams || 0,
      icon: FileText,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/10',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 dark:from-white dark:via-indigo-200 dark:to-purple-200">
            System Administrator Control Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Monitor and manage teachers, student populations, and exam organization accounts.
          </p>
        </div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-500/20 self-start md:self-auto"
        >
          Manage Users
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass rounded-3xl p-6 flex items-center justify-between border border-gray-200/50 dark:border-gray-800/50 shadow-xl ${card.shadow} hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="space-y-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                  {card.title}
                </span>
                <h3 className="text-3xl font-black">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 z-10 relative">
        {/* Organization breakdown */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Organization Distribution</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Registered schools, universities, and exam boards</p>
              </div>
            </div>
          </div>

          {stats?.orgData && stats.orgData.length > 0 ? (
            <div className="space-y-4">
              {stats.orgData.map((org, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/30 dark:border-gray-800/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {org._id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold">
                      {org.count} {org.count === 1 ? 'Teacher' : 'Teachers'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <Building2 size={48} className="text-gray-400 mb-2 opacity-50" />
              <p className="font-medium">No registered organizations found</p>
              <p className="text-xs max-w-sm mt-1">Teachers currently registered do not belong to any designated organizations.</p>
            </div>
          )}
        </div>

        {/* Administration Actions & Quick Links */}
        <div className="glass rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Console</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quick settings and options</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200/30 dark:border-gray-800/30 transition group"
            >
              <div className="flex flex-col">
                <span className="font-bold group-hover:text-indigo-500 transition text-sm">Assign Organizations</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Link teachers to schools, NTA, or coaching centers.</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition" />
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200/30 dark:border-gray-800/30 transition group"
            >
              <div className="flex flex-col">
                <span className="font-bold group-hover:text-indigo-500 transition text-sm">Promote Admin Roles</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Empower independent coaching teachers as admins.</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition" />
            </Link>

            <Link
              to="/admin/profile"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200/30 dark:border-gray-800/30 transition group"
            >
              <div className="flex flex-col">
                <span className="font-bold group-hover:text-indigo-500 transition text-sm">System Profile Settings</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update credentials and avatar settings.</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
