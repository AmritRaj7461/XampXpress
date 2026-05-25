import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, Building2, UserCheck, ShieldAlert, Check, X, Edit, ArrowLeft, ChevronDown, Award, GraduationCap, School } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  const { api } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [organizationsList, setOrganizationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('instructors'); // 'instructors' | 'organizations' | 'students'
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');
  
  // Edit Org modal/state
  const [editingUser, setEditingUser] = useState(null);
  const [orgInput, setOrgInput] = useState('');
  
  // Student specific edit states
  const [studentEduLevel, setStudentEduLevel] = useState('');
  const [studentSchool10th, setStudentSchool10th] = useState('');
  const [studentSchool12th, setStudentSchool12th] = useState('');
  const [studentCollege, setStudentCollege] = useState('');
  const [studentDegree, setStudentDegree] = useState('');
  const [studentCgpa, setStudentCgpa] = useState('');
  
  // Confirmation state
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes, studentsRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/organizations'),
        api.get('/admin/students')
      ]);
      setUsers(usersRes.data);
      setOrganizationsList(orgsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch database information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  const handleUpdateOrg = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      if (editingUser.role === 'student') {
        await api.put(`/admin/students/${editingUser._id}/organization`, {
          organization: orgInput.trim(),
          educationLevel: studentEduLevel,
          schoolName10th: studentSchool10th.trim(),
          schoolName12th: studentSchool12th.trim(),
          collegeName: studentCollege.trim(),
          degree: studentDegree.trim(),
          cgpa: studentCgpa.trim()
        });
        setSuccessMsg(`Successfully updated student details for ${editingUser.name}`);
      } else {
        await api.put(`/admin/teachers/${editingUser._id}/organization`, { organization: orgInput.trim() });
        setSuccessMsg(`Successfully updated organization for ${editingUser.name}`);
      }
      setEditingUser(null);
      fetchData();
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
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote teacher');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleToggleLicense = async (orgName, currentStatus) => {
    setActionLoading(true);
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await api.put(`/admin/organizations/${orgName}/status`, { status: newStatus });
      setSuccessMsg(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update organization status');
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

  // Get unique organizations for the filter dropdown (teachers + students)
  const organizations = [
    'All',
    ...new Set([
      ...users.map(u => u.organization || 'Independent'),
      ...students.map(s => s.organization || s.collegeName || s.schoolName12th || s.schoolName10th || 'Independent')
    ].filter(Boolean))
  ];

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

  // Filtered students list
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      (student.userId && student.userId.toLowerCase().includes(search.toLowerCase()));

    const studentOrg = student.organization || student.collegeName || student.schoolName12th || student.schoolName10th || 'Independent';
    const matchesOrg = orgFilter === 'All' || studentOrg === orgFilter;

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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-1 z-10 relative">
        <button
          onClick={() => setActiveTab('instructors')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'instructors'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Manage Instructors
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'organizations'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Manage Organizations
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'students'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Manage Students
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 flex justify-between items-center z-10 relative">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-500/20 rounded-full transition"><X size={16} /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-2xl border border-green-500/20 flex justify-between items-center z-10 relative">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-green-500/20 rounded-full transition"><X size={16} /></button>
        </div>
      )}

      {/* Instructors Tab */}
      {activeTab === 'instructors' && (
        <div className="space-y-6 z-10 relative">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-950 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg">
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

            {/* Organization Filter (Custom Themed Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-400 absolute left-4" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Organization: <strong className="text-indigo-600 dark:text-indigo-400">{orgFilter}</strong>
                  </span>
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl p-2 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {organizations.map(org => (
                    <button
                      key={org}
                      onClick={() => {
                        setOrgFilter(org);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        orgFilter === org
                          ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                      }`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              )}
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
                                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-500/20 transition cursor-pointer"
                                title="Edit Organization"
                              >
                                <Edit size={16} />
                              </button>

                              {!isUserAdmin && (
                                <button
                                  onClick={() => setConfirmPromote(user)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-500/10 cursor-pointer"
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
        </div>
      )}

      {/* Organizations License Tab */}
      {activeTab === 'organizations' && (
        <div className="glass rounded-[32px] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl z-10 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Organization Name</th>
                  <th className="px-6 py-4">License Status</th>
                  <th className="px-6 py-4">Affiliated Teachers</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800/50 text-sm font-medium">
                {organizationsList.length > 0 ? (
                  organizationsList.map((org, index) => {
                    const isSuspended = org.status === 'suspended';
                    const affiliatedTeachers = users.filter(u => u.organization === org.name).length;
                    return (
                      <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 dark:text-white">{org.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isSuspended 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-400' : 'bg-green-400'}`} />
                            {isSuspended ? 'Suspended (Ceased)' : 'Active License'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500 dark:text-gray-400 font-bold">{affiliatedTeachers} Instructors</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleToggleLicense(org.name, org.status)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                              isSuspended
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/10'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/10'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <Check size={14} />
                                Activate License
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={14} />
                                Cease License
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No active organizations registered on the platform.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Organization ─── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-[32px] p-6 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Academic Organization</h3>
                <p className="text-xs text-gray-500 mt-0.5">Assign or modify organization credentials for {editingUser.name}.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition cursor-pointer">
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850 font-bold transition text-sm cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrg}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-sm shadow-md shadow-indigo-500/20 cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6 z-10 relative">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-950 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg font-medium">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            {/* Organization Filter (Custom Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-400 absolute left-4" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Institution: <strong className="text-indigo-600 dark:text-indigo-400">{orgFilter}</strong>
                  </span>
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl p-2 max-h-60 overflow-y-auto space-y-0.5">
                  {organizations.map(org => (
                    <button
                      key={org}
                      onClick={() => {
                        setOrgFilter(org);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                        orgFilter === org
                          ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                      }`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div className="glass rounded-[32px] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Name / Email</th>
                    <th className="px-6 py-4">Education Level</th>
                    <th className="px-6 py-4">Institution / Organization</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800/50 text-sm font-medium animate-in fade-in duration-300">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                      const currentInstitution = student.organization || student.collegeName || student.schoolName12th || student.schoolName10th || 'Independent';
                      return (
                        <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                              {student.userId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-gray-900 dark:text-white font-bold">{student.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{student.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              student.educationLevel === 'college'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : student.educationLevel === 'school'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                              {student.educationLevel === 'college' ? (
                                <GraduationCap size={12} />
                              ) : student.educationLevel === 'school' ? (
                                <School size={12} />
                              ) : null}
                              {student.educationLevel === 'college' ? 'College' : student.educationLevel === 'school' ? 'School' : 'Not Specified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                            {currentInstitution}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => {
                                setEditingUser(student);
                                setOrgInput(student.organization || '');
                                setStudentEduLevel(student.educationLevel || '');
                                setStudentSchool10th(student.schoolName10th || '');
                                setStudentSchool12th(student.schoolName12th || '');
                                setStudentCollege(student.collegeName || '');
                                setStudentDegree(student.degree || '');
                                setStudentCgpa(student.cgpa || '');
                              }}
                              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-500/20 transition cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No students match your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Organization / Student Details ─── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`glass rounded-[32px] p-6 ${editingUser.role === 'student' ? 'max-w-lg' : 'max-w-md'} w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingUser.role === 'student' ? 'Edit Student Details' : 'Edit Academic Organization'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Modify institution, school, or organization credentials for {editingUser.name}.
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* General Organization */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">General Organization</label>
                <input
                  type="text"
                  placeholder="e.g. NTA, independent coaching, or general org"
                  value={orgInput}
                  onChange={e => setOrgInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                />
              </div>

              {/* Student specific fields */}
              {editingUser.role === 'student' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Education Level</label>
                    <select
                      value={studentEduLevel}
                      onChange={e => setStudentEduLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                    >
                      <option value="" className="bg-white dark:bg-gray-950 text-gray-950 dark:text-white">None (Not Specified)</option>
                      <option value="school" className="bg-white dark:bg-gray-950 text-gray-950 dark:text-white">School (10th/12th)</option>
                      <option value="college" className="bg-white dark:bg-gray-955 text-gray-955 dark:text-white">College / University</option>
                    </select>
                  </div>

                  {studentEduLevel === 'school' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">10th School Name</label>
                        <input
                          type="text"
                          placeholder="10th School"
                          value={studentSchool10th}
                          onChange={e => setStudentSchool10th(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">12th School Name</label>
                        <input
                          type="text"
                          placeholder="12th School"
                          value={studentSchool12th}
                          onChange={e => setStudentSchool12th(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {studentEduLevel === 'college' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">College Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Stanford University"
                          value={studentCollege}
                          onChange={e => setStudentCollege(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Degree / Programme</label>
                          <input
                            type="text"
                            placeholder="e.g. B.Tech Computer Science"
                            value={studentDegree}
                            onChange={e => setStudentDegree(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CGPA</label>
                          <input
                            type="text"
                            placeholder="e.g. 9.1"
                            value={studentCgpa}
                            onChange={e => setStudentCgpa(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm text-gray-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850 font-bold transition text-sm cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrg}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-sm shadow-md shadow-indigo-500/20 cursor-pointer"
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850 font-bold transition text-sm cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteAdmin}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition text-sm shadow-md shadow-rose-500/20 cursor-pointer"
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
