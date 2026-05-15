import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, Play, Bot, GraduationCap,
  Upload, ChevronRight, CheckSquare, Square,
  Loader2, AlertCircle, AlertTriangle, Sparkles, Calendar, Users
} from 'lucide-react';

// ─── Teacher Tests Card ───────────────────────────────────────────────────────
const TeacherTestsCard = ({ tests = [], navigate }) => {
  const now = new Date();

  const getStatus = (examDate) => {
    const d = new Date(examDate);
    const today = new Date(); today.setHours(0,0,0,0);
    const examDay = new Date(d); examDay.setHours(0,0,0,0);
    if (examDay < today) return { label: 'Completed', color: 'text-gray-400 bg-gray-100 dark:bg-gray-800' };
    if (examDay.getTime() === today.getTime()) return { label: 'Live Today', color: 'text-green-600 bg-green-50 dark:bg-green-900/30' };
    return { label: 'Upcoming', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' };
  };

  return (
    <div className="glass rounded-[32px] flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-6 border-b border-white/10">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3 text-blue-400">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-2xl font-bold mb-1">Teacher Designed Tests</h2>
        <p className="text-gray-500 text-sm">Tests assigned to you by your teacher</p>
      </div>

      {/* Test List */}
      <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[400px]">
        {tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 gap-3">
            <BookOpen size={40} className="opacity-30" />
            <p className="font-medium">No tests assigned yet.</p>
            <p className="text-sm">Check back later or ask your teacher.</p>
          </div>
        ) : tests.map((exam, i) => {
          const status = getStatus(exam.examDate);
          const isLive = status.label === 'Live Today';
          return (
            <motion.div
              key={exam._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-1">{exam.title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400">{exam.subject}</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ml-3 ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Clock size={14} /> {exam.timeLimit} mins</span>
                <span className="flex items-center gap-1"><BookOpen size={14} /> {exam.questions.length} Qs</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(exam.examDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                {exam.assignedTo?.length > 0 && <span className="flex items-center gap-1"><Users size={14} /> Selective</span>}
              </div>
              <button
                onClick={() => navigate(`/student/exam/${exam._id}`)}
                disabled={!isLive && status.label !== 'Upcoming'}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  isLive
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : status.label === 'Upcoming'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play size={16} /> {isLive ? 'Start Test Now' : status.label === 'Upcoming' ? 'Preview' : 'Test Ended'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── AI Test Card ─────────────────────────────────────────────────────────────
const AITestCard = ({ api, navigate }) => {
  const [step, setStep] = useState(0); // 0=subject, 1=upload, 2=topics, 3=generating
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [mode, setMode] = useState('selected'); // 'selected' | 'full'
  const [syllabusText, setSyllabusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleSyllabusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('syllabus', file);
      const res = await api.post('/ai/extract-topics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTopics(res.data.topics);
      setSyllabusText(res.data.syllabusText || '');
      setStep(2);
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Failed to extract topics. Please try a different file.';
      if (msg.includes('Quota')) {
        msg = 'AI Quota Exceeded. Please wait 1-2 minutes for the free tier limit to reset and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (t) => {
    setSelectedTopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const handleGenerateTest = async () => {
    const finalTopics = mode === 'full' ? topics : selectedTopics;
    if (mode === 'selected' && finalTopics.length === 0) {
      setError('Please select at least one topic.');
      return;
    }
    setLoading(true);
    setError('');
    setStep(3);
    try {
      const res = await api.post('/ai/generate-test', {
        subject,
        topics: finalTopics,
        mode,
        syllabusText,
      });
      // Navigate to AI exam page with generated data
      navigate('/student/ai-exam', { state: { examData: res.data } });
    } catch (err) {
      setError(err.response?.data?.message || 'AI failed to generate test. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-[32px] flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-5 border-b border-gray-200 dark:border-white/10">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center mb-2 text-purple-400">
          <Bot size={24} />
        </div>
        <h2 className="text-xl font-bold mb-0.5 text-gray-900 dark:text-white">AI-Based Mock Test</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs">Upload your syllabus and let AI create your test</p>
      </div>

      <div className="flex gap-2 px-6 pt-4">
        {['Subject', 'Upload', 'Topics', 'Generate'].map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
            }`}>{i < step ? '✓' : i + 1}</div>
            {i < 3 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-100 dark:bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 p-6 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step 0: Subject */}
            {step === 0 && (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">What subject do you want to practice?</h3>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600"
                  placeholder="e.g. Mathematics, Physics, History..."
                  onKeyDown={e => e.key === 'Enter' && subject.trim() && setStep(1)}
                />
                <button
                  onClick={() => setStep(1)}
                  disabled={!subject.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-40"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
              <>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Upload your syllabus for <span className="text-purple-400">{subject}</span></h3>
                <div
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition group"
                >
                  {loading ? (
                    <><Loader2 size={36} className="text-purple-400 animate-spin" /><p className="text-gray-400 font-medium text-center">AI is analyzing your syllabus...<br/><span className="text-xs text-gray-500">This can take 10-20 seconds</span></p></>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Click to upload syllabus</p>
                        <p className="text-xs text-gray-500 mt-1">PDF or DOC/DOCX · Max 10MB</p>
                      </div>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleSyllabusUpload} className="hidden" />
                </div>
                <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-gray-300 transition flex items-center gap-1">← Back</button>
              </>
            )}

            {/* Step 2: Pick Topics / Mode */}
            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold">Choose how you want to appear</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('full')}
                    className={`p-4 rounded-2xl border-2 text-left transition ${mode === 'full' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}
                  >
                    <Sparkles size={20} className="text-purple-400 mb-2" />
                    <p className="font-bold">Full Syllabus</p>
                    <p className="text-xs text-gray-500 mt-1">60 MCQs covering all topics</p>
                  </button>
                  <button
                    onClick={() => setMode('selected')}
                    className={`p-4 rounded-2xl border-2 text-left transition ${mode === 'selected' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                  >
                    <CheckSquare size={20} className="text-blue-400 mb-2" />
                    <p className="font-bold">Selected Topics</p>
                    <p className="text-xs text-gray-500 mt-1">30 MCQs on chosen topics</p>
                  </button>
                </div>

                {mode === 'selected' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-gray-400">Select topics ({selectedTopics.length} selected)</p>
                      <button onClick={() => setSelectedTopics(topics.length === selectedTopics.length ? [] : [...topics])} className="text-xs text-purple-400 hover:underline">
                        {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {topics.map((topic, i) => (
                        <button
                          key={i}
                          onClick={() => toggleTopic(topic)}
                          className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition text-sm ${
                            selectedTopics.includes(topic)
                              ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                              : 'border-white/10 hover:border-white/20 text-gray-400'
                          }`}
                        >
                          {selectedTopics.includes(topic) ? <CheckSquare size={16} /> : <Square size={16} />}
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}

                <button
                  onClick={handleGenerateTest}
                  disabled={mode === 'selected' && selectedTopics.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-40 shadow-lg shadow-purple-500/20"
                >
                  <Sparkles size={20} /> Generate AI Test
                </button>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-300 transition flex items-center gap-1">← Back</button>
              </>
            )}

            {/* Step 3: Generating */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                  <div className="absolute inset-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Bot size={32} className="text-purple-400" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Gemini AI is crafting your test...</h3>
                  <p className="text-gray-500 text-sm">Generating {mode === 'full' ? '60' : '30'} questions on {subject}</p>
                </div>
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Fair Points Info */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
            <Sparkles size={18} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Fair Points</p>
              <p className="text-xs text-gray-500 mt-0.5">Earn +1 point for every honest test. Violations deduct 2 points.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const StudentTestList = () => {
  const { api, user } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [teacherTests, setTeacherTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exams').then(res => {
      setExams(res.data);
      setTeacherTests(res.data.filter(e => e.type === 'teacher'));
    }).catch(console.error).finally(() => setLoading(false));
  }, [api]);


  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Mock Tests</h1>
        <p className="text-sm text-gray-500">All tests run in fullscreen with proctoring. 3 violations = auto-submit.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Section: Teacher Tests */}
        <div className="w-full lg:w-[450px] shrink-0 flex flex-col">
          <TeacherTestsCard tests={teacherTests} loading={loading} />
        </div>

        {/* Right Section: AI Test Wizard */}
        <div className="flex-1 w-full flex flex-col">
          <AITestCard 
            api={api} 
            navigate={navigate} 
            fairPoints={user?.fairPoints || 0}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentTestList;
