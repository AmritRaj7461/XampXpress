import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShieldCheck, Eye, BarChart, Zap, ArrowRight, BrainCircuit, 
  Globe, Layers, User, Lock, AlertTriangle, CheckCircle, 
  HelpCircle, ChevronDown, RefreshCw, Star, Play
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Scroll handler for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Alert simulation for Proctoring Mockup
  const initialAlerts = [
    { id: 1, type: 'danger', student: 'Sarah K.', message: 'Tab switched to external resources', time: '1s ago' },
    { id: 2, type: 'warning', student: 'Alex M.', message: 'Multiple faces detected in frame', time: '12s ago' },
    { id: 3, type: 'info', student: 'Daniel P.', message: 'Camera feed resumed', time: '45s ago' },
    { id: 4, type: 'danger', student: 'Jessica L.', message: 'DevTools opened', time: '2m ago' },
  ];

  const [alerts, setAlerts] = useState(initialAlerts);

  useEffect(() => {
    const alertTemplates = [
      { type: 'danger', student: 'Ryan T.', message: 'Exited fullscreen mode' },
      { type: 'warning', student: 'Emily B.', message: 'Audio check: unexpected background speech' },
      { type: 'danger', student: 'Marcus G.', message: 'Second display output detected' },
      { type: 'success', student: 'Sophia K.', message: 'Identity verification completed' },
      { type: 'warning', student: 'Alex M.', message: 'Attention score dropped below 50%' }
    ];

    const interval = setInterval(() => {
      const randomTemplate = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const newAlert = {
        id: Date.now(),
        type: randomTemplate.type,
        student: randomTemplate.student,
        message: randomTemplate.message,
        time: 'Just now'
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 3)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const faqData = [
    {
      q: "How does the AI detect exam cheating?",
      a: "Our advanced client-side monitoring tracks tab focus, active windows, developer tools invocation, and browser fullscreen state. If any cheating attempt is made, warnings are immediately logged, points are deducted, or the test is auto-submitted based on teacher rules."
    },
    {
      q: "Is there any software installation required?",
      a: "No downloads or browser extensions are required. XampXpress runs entirely in the browser using HTML5 Fullscreen and Visibility APIs, allowing students to start instantly without friction."
    },
    {
      q: "What happens if a student loses their internet connection?",
      a: "Our system automatically tracks connection status. If a student disconnects, the exam state is saved locally. Once connection is restored, the student can resume under teacher authorization without losing progress."
    },
    {
      q: "Can the proctoring strictness be configured?",
      a: "Yes. Teachers can toggle features like Tab Switching limits, Fullscreen Lock, DevTools Blocker, and AI warning limits individually to customize the proctoring environment for any type of test."
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const getDashboardPath = () => {
    return user?.role === 'student' ? '/student' : '/teacher';
  };

  return (
    <div className="min-h-screen bg-[#070913] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      {/* ─── FLOATING CLASSY NAVBAR ─── */}
      <header className={`fixed left-1/2 -translate-x-1/2 z-50 w-[95%] xl:w-full max-w-7xl mx-auto transition-all duration-500 ${
        scrolled 
          ? 'top-4 rounded-2xl bg-[#0d1326]/75 backdrop-blur-xl border border-white/10 px-6 py-3 shadow-2xl shadow-indigo-950/30' 
          : 'top-0 bg-transparent px-8 py-6 border-b border-transparent'
      }`}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30 hover:rotate-6 transition-transform">
              X
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
              XampXpress
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to={getDashboardPath()} 
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 text-sm font-bold bg-white text-[#070913] hover:bg-gray-200 rounded-xl transition-all shadow-md shadow-white/5 hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600/15 to-purple-600/0 blur-[150px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-pink-600/10 to-indigo-600/10 blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 backdrop-blur-sm"
          >
            <BrainCircuit size={14} className="animate-pulse" />
            <span>Military-Grade AI Proctoring Engine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-none"
          >
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
              Secure Examinations
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Create, manage, and proctor exams with military-grade security. 
            XampXpress uses advanced AI browser lockdown and violation analytics to ensure absolute academic integrity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            {user ? (
              <Link 
                to={getDashboardPath()}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
              >
                Go to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group hover:-translate-y-0.5"
                >
                  Get Started for Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-900 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center backdrop-blur-sm hover:border-white/20"
                >
                  Educator Login
                </Link>
              </>
            )}
          </motion.div>

          {/* ─── LIVE AI PROCTORING DASHBOARD WIDGET ─── */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-5xl mx-auto p-2 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Window Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-white/5 rounded-t-2xl">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="text-xs text-gray-500 ml-4 font-mono select-none hidden sm:inline">proctoring-dashboard-v2.1</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live AI Shield
              </div>
            </div>

            {/* Dashboard Mock Inner Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-950/40">
              
              {/* Left: Video feed simulation (5 cols) */}
              <div className="md:col-span-5 bg-slate-950/70 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center border border-white/5">
                  {/* Grid scanning effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_80%)]" />
                  
                  {/* Status Tag */}
                  <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded border border-white/5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    FEED ACTIVE
                  </div>
                  
                  {/* Face mesh simulation SVG */}
                  <svg className="absolute inset-0 w-full h-full text-indigo-500/40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="28" y="18" width="44" height="64" rx="10" className="stroke-indigo-500/50 stroke-[0.75] fill-none animate-pulse" />
                    <circle cx="50" cy="38" r="1.5" className="fill-indigo-400" />
                    <circle cx="43" cy="35" r="1" className="fill-indigo-400" />
                    <circle cx="57" cy="35" r="1" className="fill-indigo-400" />
                    <circle cx="50" cy="50" r="1" className="fill-indigo-400" />
                    <circle cx="45" cy="58" r="1" className="fill-indigo-400" />
                    <circle cx="55" cy="58" r="1" className="fill-indigo-400" />
                    <line x1="43" y1="35" x2="50" y2="38" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="57" y1="35" x2="50" y2="38" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="43" y1="35" x2="50" y2="50" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="57" y1="35" x2="50" y2="50" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="50" y1="38" x2="50" y2="50" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="50" y1="50" x2="45" y2="58" className="stroke-indigo-500/20 stroke-[0.5]" />
                    <line x1="50" y1="50" x2="55" y2="58" className="stroke-indigo-500/20 stroke-[0.5]" />
                  </svg>
                  
                  {/* Floating scan line */}
                  <div className="absolute left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent animate-bounce" style={{ animationDuration: '3.5s' }} />

                  {/* Video Silhouette icon */}
                  <div className="w-16 h-16 rounded-full border border-dashed border-indigo-500/30 flex items-center justify-center bg-slate-950/80 shadow-inner">
                    <User size={28} className="text-indigo-400/70" />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-xs font-mono text-gray-400">
                  <div className="text-left">
                    <p className="font-semibold text-gray-200">Alexander Wright</p>
                    <p className="text-[10px] text-gray-500">Student ID: #20489</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">Focus: 98%</p>
                    <p className="text-[10px] text-gray-500">Secure State</p>
                  </div>
                </div>
              </div>

              {/* Right: AI Alert System Logs (7 cols) */}
              <div className="md:col-span-7 bg-slate-950/70 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 min-h-[220px]">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-mono font-bold text-indigo-400 tracking-wider">AI THREAT EVENT STREAM</span>
                  <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '4s' }} />
                    Live Syncing
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 flex-grow overflow-hidden relative">
                  <AnimatePresence initial={false}>
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-white/5"
                      >
                        {alert.type === 'danger' && (
                          <div className="p-1 rounded bg-red-500/10 text-red-500 mt-0.5 shrink-0">
                            <AlertTriangle size={13} />
                          </div>
                        )}
                        {alert.type === 'warning' && (
                          <div className="p-1 rounded bg-yellow-500/10 text-yellow-500 mt-0.5 shrink-0">
                            <AlertTriangle size={13} />
                          </div>
                        )}
                        {alert.type === 'info' && (
                          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 mt-0.5 shrink-0">
                            <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '8s' }} />
                          </div>
                        )}
                        {alert.type === 'success' && (
                          <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
                            <CheckCircle size={13} />
                          </div>
                        )}
                        
                        <div className="flex-grow text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-200">{alert.student}</span>
                            <span className="text-[9px] font-mono text-gray-500">{alert.time}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{alert.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── UNIVERSITY TRUST BANNER ─── */}
      <section className="py-10 bg-slate-950/40 border-y border-white/5 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-6">
            Trusted by modern academic institutions and training teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40 select-none">
            <span className="text-sm font-black tracking-widest font-mono">HARVARD SCHOLAR</span>
            <span className="text-sm font-black tracking-widest font-mono">STANFORD LABS</span>
            <span className="text-sm font-black tracking-widest font-mono">MIT ACADEMY</span>
            <span className="text-sm font-black tracking-widest font-mono">OXFORD ONLINE</span>
            <span className="text-sm font-black tracking-widest font-mono">CAMBRIDGE DIGITAL</span>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM STATS SECTION ─── */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {[
              { num: "1.2M+", label: "Exams Secured", desc: "100% cheat-free records" },
              { num: "99.98%", label: "Uptime SLA", desc: "Always online, zero lag" },
              { num: "< 2 mins", label: "Setup Time", desc: "No installer required" },
              { num: "250+", label: "Global Institutions", desc: "Schools, universities, bootcamps" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-4">
                <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
                  {stat.num}
                </h3>
                <p className="text-base font-bold text-gray-200 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-24 bg-[#0a0d1b] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Enterprise-Grade Security Core
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Armed with HTML5 integrity parameters and automated heuristics to shield assessments.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: <Eye className="text-indigo-400" size={24} />,
                title: "Strict Tab Detection",
                desc: "Triggers immediate alerts if a candidate navigates away or opens background browsers."
              },
              {
                icon: <Globe className="text-purple-400" size={24} />,
                title: "Fullscreen Lock",
                desc: "Enforces a fullscreen test environment. Attempting to exit prompts instant deduction."
              },
              {
                icon: <ShieldCheck className="text-pink-400" size={24} />,
                title: "DevTools Shield",
                desc: "Blocks F12, context menus, page inspector, and code injection scripts dynamically."
              },
              {
                icon: <BarChart className="text-emerald-400" size={24} />,
                title: "Automated Insights",
                desc: "Auto-evaluates responses and compiles complete suspicion records for instant evaluation."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                className="bg-slate-900/40 border border-white/5 backdrop-blur-md p-6 rounded-2xl hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all duration-300 group shadow-lg"
              >
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform border border-white/10 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 text-gray-100">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Simple 3-Step Orchestration
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A frictionless examination experience built on secure automation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Layers className="text-indigo-400" size={32} />,
                title: "Build Test Cases",
                desc: "Create tests, input multiple choice or coding prompts, allocate points, and customize proctoring restrictions."
              },
              {
                step: "2",
                icon: <ShieldCheck className="text-purple-400" size={32} />,
                title: "Secure Run",
                desc: "Candidates complete the test under automated AI supervision. Real-time deviations are saved with snapshots."
              },
              {
                step: "3",
                icon: <Zap className="text-pink-400" size={32} />,
                title: "Review & Grades",
                desc: "Points are computed instantly. Teachers access detailed dashboards with student timelines and logs."
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                className="relative p-8 rounded-3xl bg-slate-900/30 border border-white/5 hover:border-white/10 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="absolute top-0 right-8 transform -translate-y-1/2 text-8xl font-black text-white/5 select-none">{card.step}</div>
                <div className="mb-6">{card.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ACCORDION SECTION ─── */}
      <section className="py-24 bg-[#0a0d1b] border-t border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Everything you need to know about the proctoring flow and integrity parameters.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left font-bold text-gray-200 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-indigo-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    size={18} 
                    className={`text-gray-500 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-white' : ''}`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="px-6 pb-6 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 relative z-10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/30">
              X
            </div>
            <span className="text-lg font-bold">XampXpress</span>
          </div>
          
          <p className="text-gray-500 text-xs md:text-sm font-mono">
            © {new Date().getFullYear()} XampXpress. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-xs md:text-sm">
            <Link to="/login" className="text-gray-500 hover:text-indigo-400 transition-colors">Login</Link>
            <Link to="/register" className="text-gray-500 hover:text-indigo-400 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
