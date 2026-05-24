import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, Clock, Send, Maximize, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_WARNINGS = 3;

const AIExamPage = () => {
  const { state } = useLocation();
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const examData = state?.examData;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState((examData?.timeLimit || 45) * 60);
  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [violated, setViolated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const examRef = useRef(null);
  const timerRef = useRef(null);

  // ── Fullscreen Monitoring ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleFSChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation();
        setIsPaused(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [hasStarted]);

  // ── Tab visibility ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) triggerViolation();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || isPaused || isSubmitting) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          clearInterval(timerRef.current); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [hasStarted, isPaused, isSubmitting]);

  // Handle timer auto-submit
  useEffect(() => {
    if (timeLeft <= 0 && hasStarted && !isSubmitting && !violated) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasStarted, isSubmitting, violated]);

  function triggerViolation() {

    setWarnings(prev => {
      const next = prev + 1;
      if (next >= MAX_WARNINGS) {
        setViolated(true);
        handleSubmit(true);
      }
      return next;
    });
  };

  async function handleSubmit(isViolated = false) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

    const formattedResponses = Object.keys(responses).map(qId => ({
      questionId: qId,
      selectedOption: responses[qId],
    }));

    try {
      const res = await api.post('/ai/submit', {
        subject: examData.subject,
        topics: examData.topics,
        questions: examData.questions,
        responses: formattedResponses,
        violated: isViolated || violated,
      });
      navigate(`/student/result/${res.data._id}`, {
        state: {
          result: res.data,
          type: 'ai',
          subject: examData.subject,
          violated: isViolated || violated,
        },
      });
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsPaused(false);

    } catch {
      /* ignore */
    }
  };

  if (!examData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white flex-col gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-xl font-bold">No exam data found.</p>
        <button onClick={() => navigate('/student/tests')} className="px-6 py-3 bg-blue-600 rounded-xl">Back to Tests</button>
      </div>
    );
  }

  const questions = examData.questions;
  const currentQ = questions[currentIdx];
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleStart = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setHasStarted(true);
    } catch {
      alert("Failed to enter fullscreen. Please try again.");
    }
  };

  if (!hasStarted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white flex-col gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4">
          <Bot size={40} />
        </div>
        <h1 className="text-4xl font-bold">Ready to start?</h1>
        <p className="text-gray-400 max-w-md">This test requires fullscreen mode. Do not switch tabs or exit fullscreen, or your test will be auto-submitted.</p>
        <button onClick={handleStart} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 transition flex items-center gap-2 mt-4">
          <Maximize size={20} /> Enter Fullscreen & Start
        </button>
      </div>
    );
  }

  return (
    <div ref={examRef} className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

      {/* ── Paused Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-center p-8"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-2">
              <Maximize size={48} />
            </div>
            <h2 className="text-3xl font-bold text-red-400">Test Paused</h2>
            <p className="text-gray-400 max-w-md">You exited fullscreen. Please return to fullscreen to continue your test. The timer is paused.</p>
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400"><Bot size={18} /></div>
          <div>
            <h1 className="font-bold text-lg leading-none">{examData.subject} — AI Test</h1>
            <p className="text-xs text-gray-500 mt-0.5">{questions.length} Questions · {examData.mode === 'full' ? 'Full Syllabus' : 'Selected Topics'}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <AnimatePresence>
            {warnings > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full text-sm font-bold">
                <AlertTriangle size={15} /> {warnings}/{MAX_WARNINGS} Warnings
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-2 text-xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-white'}`}>
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
          >
            <Send size={16} /> Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main Question Area ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-gray-950">
          <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Question {currentIdx + 1} of {questions.length}</span>
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/20">MCQ</span>
            </div>
            <h2 className="text-2xl font-semibold mb-8 leading-relaxed text-white">{currentQ.questionText}</h2>
            <div className="space-y-4">
              {currentQ.options.map((opt, idx) => {
                const label = optionLabels[idx];
                const isSelected = responses[currentQ._id] === label;
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-purple-400/50 hover:bg-purple-500/5'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{label}</div>
                    <input type="radio" className="hidden" checked={isSelected} onChange={() => setResponses({ ...responses, [currentQ._id]: label })} />
                    <span className="text-base text-gray-200">{opt}</span>
                  </label>
                );
              })}
            </div>
            </div>
          </div>

          {/* ── Fixed Bottom Navigation ────────────────────────────────────── */}
          <div className="p-6 border-t border-gray-800 bg-gray-900">
            <div className="max-w-3xl mx-auto flex gap-4">
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold disabled:opacity-40 transition">← Previous</button>
              <button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold disabled:opacity-40 transition shadow-lg shadow-red-500/20">Next →</button>
            </div>
          </div>
        </div>

        {/* ── Right Palette ──────────────────────────────────────────────── */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question Palette</span>
              <span className="text-xs text-gray-500">{Object.keys(responses).length}/{questions.length} answered</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {questions.map((q, i) => {
                const answered = !!responses[q._id];
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      isCurrent ? 'bg-purple-600 text-white ring-2 ring-purple-400' : answered ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >{i + 1}</button>
                );
              })}
            </div>
          </div>
          <div className="p-5 space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-600/20 border border-green-600/30"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-800"></div> Not Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-600"></div> Current</div>
          </div>
          {warnings > 0 && (
            <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400">
              <AlertTriangle size={14} className="inline mr-1" />
              {warnings}/{MAX_WARNINGS} warnings. {MAX_WARNINGS - warnings} more = auto-submit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIExamPage;
