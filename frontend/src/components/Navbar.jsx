import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student' },
    { name: 'Mock Tests', path: '/student/tests' },
    { name: 'History', path: '/student/history' },
  ];

  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher' },
    { name: 'Create Test', path: '/teacher/create-test' },
    { name: 'Manage Tests', path: '/teacher/tests' },
  ];

  const links = user?.role === 'student' ? studentLinks : user?.role === 'teacher' ? teacherLinks : [];

  return (
    <nav className="sticky top-0 z-50 px-8 py-4 flex justify-between items-center bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform duration-300">X</div>
        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">XampXpress</span>
      </div>

      {user && (
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/student' || link.path === '/teacher'}
              className={({ isActive }) => 
                `relative px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {user ? (
          <div className="relative group">
            {/* User Profile Button (Hover Target) */}
            <div className="flex items-center gap-3 cursor-pointer py-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="font-semibold text-sm leading-tight">{user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">{user.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-white dark:border-[#161622] shadow-md flex items-center justify-center text-blue-600 dark:text-blue-300 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
            </div>

            {/* Hover Tray Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-2 flex flex-col gap-1">
                
                <div className="px-3 py-2 mb-1 border-b border-gray-200 dark:border-gray-800 sm:hidden">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>

                <Link 
                  to={user.role === 'student' ? '/student/profile' : '/teacher/profile'}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <User size={18} className="text-blue-500" />
                  My Profile
                </Link>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5 mx-2" />
                
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition w-full text-left"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to="/login" className="px-5 py-2.5 rounded-xl text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">Login</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-0.5">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
