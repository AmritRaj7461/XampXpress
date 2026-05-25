import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, Building2, UserCheck, ShieldAlert, Check, X, Edit, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  const { api } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');
  
  // Edit Org modal/state
  const [editingUser, setEditingUser] = useState(null);
  const [orgInput, setOrgInput] = useState('');
  
  // Confirmation state
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const handleUpdateOrg = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/teachers/${editingUser._id}/organization`, { organization: orgInput.trim() });
      setSuccessMsg(`Successfully updated organization for ${editingUser.name}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update organization');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handlePromoteAdmin = async () => {
    if (!confirmPromote) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/teachers/${confirmPromote._id}/promote`);
      setSuccessMsg(`Successfully promoted ${confirmPromote.name} to Admin`);
      setConfirmPromote(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote teacher');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get unique organizations for the filter dropdown
  const organizations = ['All', ...new Set(users.map(u => u.organization || 'Independent').filter(Boolean))];

  // Filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.userId && user.userId.toLowerCase().includes(search.toLowerCase()));

    const userOrg = user.organization || 'Independent';
    const matchesOrg = orgFilter === 'All' || userOrg === orgFilter;

    return matchesSearch && matchesOrg;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 relative">
      {/* Decorative Blob */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Back Link */}
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage System Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View registered instructors, assign academic organizations, and promote new administrators.</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-500/20 rounded-full transition"><X size={16} /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-2xl border border-green-500/20 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-green-500/20 rounded-full transition"><X size={16} /></button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-950 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
          />
        </div>

        {/* Organization Filter */}
        <div className="relative">
          <Building2 size={18} className="absolute left-4 top-3.5 text-gray-400" />
          <select
            value={orgFilter}
            onChange={e => setOrgFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm appearance-none"
          >
            {organizations.map(org => (
              <option key={org} value={org}>
                Organization: {org}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-[32px] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800/50 text-sm font-medium">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const isUserAdmin = user.role === 'admin';
                  return (
                    <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {user.userId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white font-bold">{user.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isUserAdmin 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {isUserAdmin ? 'Administrator' : 'Teacher'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700 dark:text-gray-300">
                          {user.organization || <em className="text-gray-400 dark:text-gray-600 font-normal">Independent</em>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setOrgInput(user.organization || '');
                            }}
                            className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-500/20 transition"
                            title="Edit Organization"
                          >
                            <Edit size={16} />
                          </button>

                          {!isUserAdmin && (
                            <button
                              onClick={() => setConfirmPromote(user)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-500/10"
                              title="Promote to Admin"
                            >
                              <UserCheck size={14} />
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No users match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: Edit Organization ─── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-[32px] p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Academic Organization</h3>
                <p className="text-xs text-gray-500 mt-0.5">Assign or modify organization credentials for {editingUser.name}.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organization Name</label>
              <input
                type="text"
                placeholder="e.g. National Testing Agency (NTA), Stanford"
                value={orgInput}
                onChange={e => setOrgInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850 font-bold transition text-sm"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrg}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-sm shadow-md shadow-indigo-500/20"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Promote Admin ─── */}
      {confirmPromote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-[32px] p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert size={26} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Promote to System Admin?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to promote <strong>{confirmPromote.name}</strong>? Admins gain complete oversight across all teachers, exams, and settings. This action will assign them a new admin registration ID.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmPromote(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850 font-bold transition text-sm"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteAdmin}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition text-sm shadow-md shadow-rose-500/20"
                disabled={actionLoading}
              >
                {actionLoading ? 'Promoting...' : 'Confirm Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
