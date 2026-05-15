import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, Clock, Send, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveMonitor from '../components/Proctoring/LiveMonitor';

const MAX_WARNINGS = 3;

const ExamPage = () => {
  const { id } = useParams();
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [violated, setViolated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.get(`/exams/${id}`);
        setExam(res.data);
        setTimeLeft(res.data.timeLimit * 60);
      } catch (err) {
        console.error(err);
        alert('Failed to load exam');
        navigate('/student/tests');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, api, navigate]);

  // ── Fullscreen Monitoring ──────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleFSChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('🔴 You exited fullscreen!');
        setIsPaused(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [hasStarted]);

  // ── Tab switch detection ────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation('⚠️ Tab switch detected!');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Timer — pauses when isPaused ────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || !exam || isSubmitting || isPaused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [hasStarted, exam, isSubmitting, isPaused]);

  const triggerViolation = (msg) => {
    setWarnings(prev => {
      const next = prev + 1;
      if (next >= MAX_WARNINGS) {
        setViolated(true);
        handleSubmit(true);
      }
      return next;
    });
  };

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsPaused(false);
    } catch {}
  };

  const handleOptionSelect = (qId, option) => setResponses({ ...responses, [qId]: option });

  const handleSubmit = async (isViolated = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

    const formattedResponses = Object.keys(responses).map(qId => ({
      questionId: qId,
      selectedOption: responses[qId],
    }));

    try {
      const res = await api.post(`/exams/${id}/submit`, {
        responses: formattedResponses,
        violated: isViolated || violated,
      });
      navigate(`/student/result/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white text-xl font-semibold">Loading Exam Engine...</div>;
  if (!exam) return null;

  const currentQ = exam.questions[currentQuestionIdx];
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStart = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setHasStarted(true);
    } catch (err) {
      alert("Failed to enter fullscreen. Please try again.");
    }
  };

  if (!hasStarted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white flex-col gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
          <Maximize size={40} />
        </div>
        <h1 className="text-4xl font-bold">Ready to start {exam.title}?</h1>
        <p className="text-gray-400 max-w-md">This test requires fullscreen mode. Do not switch tabs or exit fullscreen, or your test will be auto-submitted.</p>
        <button onClick={handleStart} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition flex items-center gap-2 mt-4">
          <Maximize size={20} /> Enter Fullscreen & Start
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* ── Paused Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-center p-8"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <Maximize size={48} />
            </div>
            <h2 className="text-3xl font-bold text-red-400">Test Paused</h2>
            <p className="text-gray-400 max-w-md">You exited fullscreen. Return to fullscreen to resume. Timer is paused.</p>
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-semibold">
              Warning {warnings}/{MAX_WARNINGS} — {MAX_WARNINGS - warnings} remaining before auto-submit
            </div>
            <button
              onClick={returnToFullscreen}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-blue-500/30 transition"
            >
              <Maximize size={22} /> Return to Fullscreen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-bold text-xl">{exam.title}</h1>
          <p className="text-sm text-gray-500">{exam.subject}</p>
        </div>
        <div className="flex gap-4 items-center">
          <AnimatePresence>
            {warnings > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                <AlertTriangle size={15} /> {warnings}/{MAX_WARNINGS} Warnings
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-2 text-xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800'}`}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
          <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50">
            <Send size={18} /> Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Exam Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500 tracking-wider uppercase">Question {currentQuestionIdx + 1} of {exam.questions.length}</span>
              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">Multiple Choice</span>
            </div>
            <h2 className="text-2xl font-medium mb-8 leading-relaxed">{currentQ.questionText}</h2>
            <div className="space-y-4">
              {currentQ.options.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    responses[currentQ._id] === option
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-blue-400/50 hover:bg-blue-500/5'
                  }`}
                >
                  <input type="radio" name={`q-${currentQ._id}`} className="w-5 h-5 accent-blue-600" checked={responses[currentQ._id] === option} onChange={() => handleOptionSelect(currentQ._id, option)} />
                  <span className="text-lg text-gray-200">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proctoring Active</span>
              <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            </div>
            <LiveMonitor />
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = !!responses[q._id];
                const isCurrent = idx === currentQuestionIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm transition ${
                      isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-400' : isAnswered ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >{idx + 1}</button>
                );
              })}
            </div>
            {warnings > 0 && (
              <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400">
                <AlertTriangle size={14} className="inline mr-1" />
                {warnings}/{MAX_WARNINGS} warnings. {MAX_WARNINGS - warnings} more = auto-submit.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(i => i - 1)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium disabled:opacity-40 transition">Prev</button>
            <button disabled={currentQuestionIdx === exam.questions.length - 1} onClick={() => setCurrentQuestionIdx(i => i + 1)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium disabled:opacity-40 transition shadow-lg shadow-red-500/20">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
