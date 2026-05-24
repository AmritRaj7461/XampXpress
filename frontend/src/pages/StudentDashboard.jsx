import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Award, Target, BookOpen, Clock, User, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import MiniCalendar from '../components/MiniCalendar';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getAvatarUrl = (avatar) => {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${BACKEND}${avatar}`;
};

const StatCard = ({ title, value, icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2 }}
    className="glass p-6 rounded-[24px] flex items-center gap-5 shadow-sm border border-white/10 relative overflow-hidden"
  >
    <div className={`p-4 rounded-[16px] ${color} shadow-lg relative z-10`}>
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</h3>
    </div>
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${color} opacity-10 blur-2xl`}></div>
  </motion.div>
);

const StudentDashboard = () => {
  const { user, api } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const stats = {
    totalTests: user?.totalTests || 0,
    accuracy: user?.accuracy || 0,
    averageScore: user?.averageScore || 0,
    streak: user?.streak || 0,
    badges: user?.badges || [],
    fairPoints: user?.fairPoints ?? 0,
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams');
        setExams(res.data);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    fetchExams();
  }, [api]);



  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg border-2 border-white dark:border-[#161622] flex-shrink-0">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white"><User size={32} /></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 dark:text-gray-400">Ready to crush your next exam?</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <StatCard 
          title="Tests Attempted" 
          value={stats.totalTests} 
          icon={<BookOpen size={24} className="text-white" />} 
          color="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20" 
        />
        <StatCard 
          title="Accuracy Rate" 
          value={`${stats.accuracy.toFixed(1)}%`} 
          icon={<Target size={24} className="text-white" />} 
          color="bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20" 
        />
        <StatCard 
          title="Average Score" 
          value={stats.averageScore.toFixed(1)} 
          icon={<Award size={24} className="text-white" />} 
          color="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20" 
        />
        <StatCard 
          title="Day Streak" 
          value={stats.streak} 
          icon={<Clock size={24} className="text-white" />} 
          color="bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/20" 
        />
        <StatCard 
          title="Fair Points" 
          value={stats.fairPoints} 
          icon={<Star size={24} className="text-white" />} 
          color={stats.fairPoints >= 5 ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/20" : "bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/20"} 
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Side: Performance & Achievements */}
        <div className="flex-1 space-y-8">
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Recent Performance</h2>
            {/* Chart would go here */}
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-gray-400">Take more tests to see performance chart</p>
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold">Achievements</h2>
            <div className="space-y-4">
              {stats.badges.length > 0 ? (
                stats.badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                      <Award size={20} />
                    </div>
                    <span className="font-medium">{badge}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No badges yet. Start taking exams!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Calendar & Quick Info */}
        <div className="xl:w-80 shrink-0 space-y-8">
          <MiniCalendar exams={exams} />
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
