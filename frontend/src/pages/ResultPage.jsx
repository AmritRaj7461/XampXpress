import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Target, Award, ArrowRight, Bot, AlertTriangle, GraduationCap } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResultPage = () => {
  const { id } = useParams();
  const { api } = useContext(AuthContext);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get('/results');
        const currentResult = res.data.find(r => r._id === id);
        setResult(currentResult);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, api]);

  if (loading) return <div className="h-[calc(100vh-64px)] flex items-center justify-center">Analyzing performance...</div>;
  if (!result) return <div className="h-[calc(100vh-64px)] flex items-center justify-center text-red-500">Result not found.</div>;

  const isAI = result.type === 'ai';
  const examTitle = isAI ? `AI Mock Test: ${result.aiTestData?.subject}` : (result.exam?.title || 'Teacher Test');
  const subjectName = isAI ? result.aiTestData?.subject : (result.exam?.subject || 'General');

  const chartData = {
    labels: ['Correct', 'Incorrect', 'Unattempted'],
    datasets: [
      {
        data: [
          result.score,
          result.attempted - result.score,
          result.totalQuestions - result.attempted
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green
          'rgba(239, 68, 68, 0.8)', // Red
          'rgba(156, 163, 175, 0.8)' // Gray
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      {result.violated && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-500"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold">Auto-Submitted due to Violations</h3>
            <p className="text-sm opacity-80">This test was submitted automatically after 3 warnings for fullscreen exit or tab switching. 2 Fair Points have been deducted.</p>
          </div>
        </motion.div>
      )}

      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={`w-24 h-24 ${result.violated ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl ${result.violated ? 'shadow-red-500/20' : 'shadow-green-500/20'}`}
        >
          <Award size={48} />
        </motion.div>
        <div className="flex items-center justify-center gap-3 mb-2">
          {isAI ? <Bot size={20} className="text-purple-500" /> : <GraduationCap size={20} className="text-blue-500" />}
          <span className={`text-sm font-bold uppercase tracking-widest ${isAI ? 'text-purple-500' : 'text-blue-500'}`}>{subjectName}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">{examTitle}</h1>
        <p className="text-gray-500 text-lg">Performance analysis for test taken on {new Date(result.createdAt).toLocaleDateString()}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-gray-500 mb-2 font-medium">Total Score</div>
          <div className="text-5xl font-bold text-blue-600 mb-2">{result.score}<span className="text-2xl text-gray-400">/{result.totalQuestions}</span></div>
          <div className="text-sm text-gray-500">marks</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-gray-500 mb-2 font-medium">Accuracy</div>
          <div className={`text-5xl font-bold ${result.accuracy > 70 ? 'text-green-600' : 'text-yellow-600'} mb-2`}>{result.accuracy.toFixed(1)}<span className="text-2xl text-gray-400">%</span></div>
          <div className="text-sm text-gray-500">precision</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-gray-500 mb-2 font-medium">Attempted</div>
          <div className="text-5xl font-bold text-purple-600 mb-2">{result.attempted}<span className="text-2xl text-gray-400">/{result.totalQuestions}</span></div>
          <div className="text-sm text-gray-500">questions</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-6 w-full text-left">Performance Breakdown</h2>
          <div className="w-64 h-64">
            <Doughnut data={chartData} options={{ maintainAspectRatio: false, cutout: '70%' }} />
          </div>
        </div>

        <div className="glass p-8 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold mb-6">Quick Stats</h2>
          
          <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center gap-3"><CheckCircle className="text-green-500" /> <span className="font-medium">Correct</span></div>
            <span className="text-xl font-bold text-green-600">{result.score}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <div className="flex items-center gap-3"><XCircle className="text-red-500" /> <span className="font-medium">Incorrect</span></div>
            <span className="text-xl font-bold text-red-600">{result.attempted - result.score}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3"><Target className="text-gray-500" /> <span className="font-medium">Unattempted</span></div>
            <span className="text-xl font-bold text-gray-600">{result.totalQuestions - result.attempted}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <Link 
          to="/student"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-1"
        >
          Return to Dashboard <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default ResultPage;
