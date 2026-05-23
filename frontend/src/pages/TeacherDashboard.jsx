import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, FileText, Activity, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getAvatarUrl = (avatar) => {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${BACKEND}${avatar}`;
};

const TeacherDashboard = () => {
  const { user, api } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams');
        setExams(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExams();
  }, [api]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg border-2 border-white dark:border-[#161622] flex-shrink-0">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white"><User size={32} /></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Educator Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name.split(' ')[0]}. Here is your class overview.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-[24px] flex items-center gap-5 shadow-sm border border-white/10 relative overflow-hidden">
          <div className="p-4 rounded-[16px] bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 relative z-10 text-white"><FileText size={24} /></div>
          <div className="relative z-10">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Tests Created</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{exams.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-blue-500 opacity-10 blur-2xl"></div>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-[24px] flex items-center gap-5 shadow-sm border border-white/10 relative overflow-hidden">
          <div className="p-4 rounded-[16px] bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 relative z-10 text-white"><Users size={24} /></div>
          <div className="relative z-10">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Attempts</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">--</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-green-500 opacity-10 blur-2xl"></div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-[24px] flex items-center gap-5 shadow-sm border border-white/10 relative overflow-hidden">
          <div className="p-4 rounded-[16px] bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20 relative z-10 text-white"><Activity size={24} /></div>
          <div className="relative z-10">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Avg. Student Score</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">--</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-purple-500 opacity-10 blur-2xl"></div>
        </motion.div>
      </div>

      <div className="glass p-6 rounded-[24px] mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Your Recent Tests</h2>
          <button className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center">View All <ChevronRight size={16} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100 dark:border-gray-800 text-gray-500 text-sm uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold">Title</th>
                <th className="py-4 px-4 font-semibold">Subject</th>
                <th className="py-4 px-4 font-semibold">Duration</th>
                <th className="py-4 px-4 font-semibold">Questions</th>
                <th className="py-4 px-4 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? exams.map((exam, i) => (
                <tr key={exam._id} className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-white/50 dark:hover:bg-[#1a1a24]/50 transition ${i === exams.length - 1 ? 'border-none' : ''}`}>
                  <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{exam.title}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold">{exam.subject}</span>
                  </td>
                  <td className="py-4 px-4 font-medium">{exam.timeLimit} mins</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium">{exam.questions.length} Qs</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-sm font-medium">{new Date(exam.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <FileText size={32} />
                      </div>
                      No tests created yet. Let's create your first one!
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
