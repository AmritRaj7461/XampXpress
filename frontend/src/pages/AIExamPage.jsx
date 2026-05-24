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
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex-col gap-4 transition-colors duration-300">
        <AlertTriangle size={48} className="text-red-500 animate-pulse" />
        <p className="text-xl font-bold">No exam data found.</p>
        <button onClick={() => navigate('/student/tests')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-500/15">Back to Tests</button>
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
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white flex-col gap-6 p-8 text-center transition-colors duration-300">
        <div className="w-20 h-20 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-4 shadow-sm border border-purple-200 dark:border-purple-500/25">
          <Bot size={40} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Ready to start?</h1>
        <p className="text-slate-500 dark:text-gray-400 max-w-md leading-relaxed">This test requires fullscreen mode. Do not switch tabs or exit fullscreen, or your test will be auto-submitted.</p>
        <button onClick={handleStart} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2 mt-4 hover:scale-[1.02]">
          <Maximize size={20} /> Enter Fullscreen & Start
        </button>
      </div>
    );
  }

  return (
    <div ref={examRef} className="h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">

      {/* ── Paused Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-center p-8"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10 animate-pulse">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-black text-red-500 tracking-tight">Proctoring Alert</h2>
            
            <div className="max-w-md p-6 bg-slate-900/60 border border-white/5 dark:border-slate-800/80 rounded-3xl space-y-3">
              <p className="text-red-400 font-semibold text-lg leading-snug">
                You exited fullscreen or triggered a guideline violation!
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                The examination timer is paused. To continue, you must acknowledge this alert and resume the exam in fullscreen mode. Any further violations will trigger automatic test submission.
              </p>
            </div>

            <div className="px-5 py-2.5 bg-red-500/10 border border-red-500/25 rounded-full text-red-400 text-sm font-bold shadow-sm shadow-red-500/5">
              Warning {warnings} of {MAX_WARNINGS} — {MAX_WARNINGS - warnings} remaining before auto-submit
            </div>
            <button
              onClick={returnToFullscreen}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-blue-500/30 transition transform hover:scale-[1.02]"
            >
              <Maximize size={22} /> Resume Test & Return to Fullscreen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400"><Bot size={18} /></div>
          <div>
            <h1 className="font-extrabold text-lg leading-none text-slate-900 dark:text-white">{examData.subject} — AI Test</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{questions.length} Questions · {examData.mode === 'full' ? 'Full Syllabus' : 'Selected Topics'}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <AnimatePresence>
            {warnings > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle size={14} /> {warnings}/{MAX_WARNINGS} Warnings
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-2 text-lg font-mono font-bold px-4 py-2 rounded-xl border transition-colors ${
            timeLeft < 300 
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'
          }`}>
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-500/15 disabled:opacity-50 animate-pulse hover:scale-[1.02]"
          >
            <Send size={15} /> Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main Question Area ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Question {currentIdx + 1} of {questions.length}</span>
                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-500/20">MCQ</span>
              </div>
              <h2 className="text-2xl font-bold mb-8 leading-relaxed text-slate-800 dark:text-white">{currentQ.questionText}</h2>
              <div className="space-y-4">
                {currentQ.options.map((opt, idx) => {
                  const label = optionLabels[idx];
                  const isSelected = responses[currentQ._id] === label;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-purple-600 dark:border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 shadow-sm shadow-purple-500/5' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-400/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-gray-400'
                      }`}>{label}</div>
                      <input type="radio" className="hidden" checked={isSelected} onChange={() => setResponses({ ...responses, [currentQ._id]: label })} />
                      <span className="text-base font-medium text-slate-700 dark:text-gray-200">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Fixed Bottom Navigation ────────────────────────────────────── */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-3xl mx-auto flex gap-4">
              <button 
                disabled={currentIdx === 0} 
                onClick={() => setCurrentIdx(i => i - 1)} 
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold disabled:opacity-40 transition-all"
              >
                ← Previous
              </button>
              <button 
                disabled={currentIdx === questions.length - 1} 
                onClick={() => setCurrentIdx(i => i + 1)} 
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-40 transition-all shadow-md shadow-indigo-500/10"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Palette ──────────────────────────────────────────────── */}
        <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto transition-colors duration-300">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Question Palette</span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">{Object.keys(responses).length}/{questions.length} answered</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const answered = !!responses[q._id];
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      isCurrent 
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-md shadow-purple-500/20' 
                        : answered 
                          ? 'bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-600/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >{i + 1}</button>
                );
              })}
            </div>
          </div>
          <div className="p-5 space-y-2.5 text-xs text-slate-500 dark:text-gray-400 flex-1">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-600/10 dark:bg-green-600/20 border border-green-200 dark:border-green-600/30"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800"></div> Not Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-600"></div> Current</div>
          </div>
          {warnings > 0 && (
            <div className="m-4 p-3.5 bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-600 dark:text-red-400">
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
