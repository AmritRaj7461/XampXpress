import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Award, Clock, Activity, ArrowRight, Bot, GraduationCap, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ResultCard = ({ result, idx }) => {
  const isAI = result.type === 'ai';
  const title = isAI ? `AI Mock: ${result.aiTestData?.subject}` : (result.exam?.title || 'Teacher Test');
  const subject = isAI ? result.aiTestData?.subject : (result.exam?.subject || 'General');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      key={result._id} 
      className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/40 dark:border-gray-700/50"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isAI ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
            {subject}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {new Date(result.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {result.violated && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-bold border border-red-500/20">
              <AlertTriangle size={10} /> AUTO-SUBMITTED
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          {isAI ? <Bot size={18} className="text-purple-400" /> : <GraduationCap size={18} className="text-blue-400" />}
          {title}
        </h3>
        {isAI && result.aiTestData?.topics?.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">Topics: {result.aiTestData.topics.join(', ')}</p>
        )}
      </div>

      <div className="flex gap-6 w-full md:w-auto">
        <div className="flex flex-col">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"><Award size={12}/> Score</span>
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{result.score}<span className="text-xs text-gray-400">/{result.totalQuestions}</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"><Activity size={12}/> Accuracy</span>
          <span className={`text-xl font-bold ${result.accuracy > 75 ? 'text-green-500' : result.accuracy > 40 ? 'text-yellow-500' : 'text-red-500'}`}>
            {result.accuracy.toFixed(0)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1"><Clock size={12}/> Date</span>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{new Date(result.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
        </div>
      </div>

      <Link 
        to={`/student/result/${result._id}`}
        className="w-full md:w-auto mt-4 md:mt-0 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center transition"
      >
        <ArrowRight size={20} />
      </Link>
    </motion.div>
  );
};

const StudentHistory = () => {
  const { api } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/results');
        setResults(res.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [api]);

  const teacherResults = results.filter(r => r.type !== 'ai');
  const aiResults = results.filter(r => r.type === 'ai');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test History</h1>
        <p className="text-gray-500">Track your progress across teacher-assigned and AI-generated mock tests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : results.length > 0 ? (
        <div className="space-y-16">
          {/* Section 1: Teacher Designed Tests */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <GraduationCap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Teacher Designed Tests</h2>
                <p className="text-sm text-gray-500">Official exams assigned by your instructors</p>
              </div>
              <div className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold">
                {teacherResults.length} Tests
              </div>
            </div>
            
            {teacherResults.length > 0 ? (
              <div className="space-y-4">
                {teacherResults.map((r, i) => <ResultCard key={r._id} result={r} idx={i} />)}
              </div>
            ) : (
              <div className="glass p-10 rounded-2xl text-center text-gray-500 border-dashed border-2 border-white/20">
                No teacher tests attempted yet.
              </div>
            )}
          </section>

          {/* Section 2: AI-Based Mock Tests */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">AI-Based Mock Tests</h2>
                <p className="text-sm text-gray-500">Personalized tests generated from your syllabus</p>
              </div>
              <div className="ml-auto px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full text-xs font-bold">
                {aiResults.length} Tests
              </div>
            </div>
            
            {aiResults.length > 0 ? (
              <div className="space-y-4">
                {aiResults.map((r, i) => <ResultCard key={r._id} result={r} idx={i} />)}
              </div>
            ) : (
              <div className="glass p-10 rounded-2xl text-center text-gray-500 border-dashed border-2 border-white/20">
                <div className="flex flex-col items-center gap-3">
                  <Sparkles size={32} className="text-purple-300" />
                  <p>No AI mock tests taken yet. Try uploading a syllabus!</p>
                  <Link to="/student/tests" className="text-purple-500 hover:underline font-bold text-sm">Create AI Test</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="glass p-16 rounded-[40px] text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300 dark:border-gray-700 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-500 mb-6">
            <Activity size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Your history is empty</h2>
          <p className="text-gray-500 mb-8 max-w-xs">Appear for tests to see your performance metrics and growth over time.</p>
          <Link to="/student/tests" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all">Start Practicing</Link>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;

