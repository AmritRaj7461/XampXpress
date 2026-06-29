import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Floating Shape Component ───────────────────────────────────────────
const FloatingShape = ({ className, delay = 0, duration = 6, children, style }) => (
  <motion.div
    className={className}
    style={style}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -3, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

// ─── Animated Counter ────────────────────────────────────────────────────
const AnimatedNumber = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        let start = 0;
        const duration = 2000;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// ─── Word Reveal Animation ───────────────────────────────────────────────
const WordReveal = ({ text, className }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.22em]"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};


// ─── Exam Card Mock ──────────────────────────────────────────────────────
const ExamMockCard = ({ title, subject, time, color, rotate, delay, floatY = 14 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  >
    <motion.div
      className="rounded-2xl p-4 shadow-xl text-left cursor-pointer"
      style={{ background: color, width: '190px', rotate: `${rotate}deg` }}
      animate={{ y: [0, -floatY, 0], rotate: [rotate, rotate + 2, rotate - 1, rotate] }}
      transition={{ duration: 4.5 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.3 }}
      whileHover={{ rotate: 0, scale: 1.07, zIndex: 10, y: -floatY - 4 }}
    >
      <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{subject}</div>
      <div className="text-sm font-bold text-gray-900 leading-tight">{title}</div>
      <div className="mt-2 text-[10px] opacity-70 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
        {time}
      </div>
    </motion.div>
  </motion.div>
);

// ─── Badge ───────────────────────────────────────────────────────────────
const FloatingBadge = ({ label, className, delay = 0 }) => (
  <motion.div
    className={`absolute px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${className}`}
    initial={{ opacity: 0, scale: 0, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    whileHover={{ scale: 1.1 }}
  >
    {label}
  </motion.div>
);

// ─── Feature Modal ──────────────────────────────────────────────────────────
const FeatureModal = ({ feature, onClose }) => {
  if (!feature) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden z-10 flex flex-col md:flex-row"
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left side: Image */}
          <div className="relative h-56 md:h-auto md:w-[45%] flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: feature.color }}>
            <img src={feature.image} alt={feature.title} className="w-full h-full object-cover md:object-contain p-0 md:p-6 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors text-sm font-bold leading-none"
            >
              ✕
            </button>
          </div>
          
          {/* Right side: Content */}
          <div className="p-7 md:p-10 flex flex-col justify-center overflow-y-auto w-full md:w-[55%] relative">
            {/* Close button for desktop */}
            <button
              onClick={onClose}
              className="hidden md:flex absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors items-center justify-center text-gray-600 text-sm font-bold leading-none"
            >
              ✕
            </button>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{feature.icon}</div>
                <div
                  className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: feature.color, color: feature.accent }}
                >
                  Platform feature
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{feature.desc}</p>
              
              <ul className="space-y-3 mb-8">
                {feature.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: feature.color, color: feature.accent }}
                    >
                      ✓
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
              
              <Link
                to="/register"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center px-8 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: feature.accent, boxShadow: `0 10px 25px -5px ${feature.accent}66` }}
              >
                Try it free →
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({ container: containerRef });
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const heroBg = useTransform(scrollYProgress, [0, 0.2], ['#7C3AED', '#4C1D95']);

  // GSAP scroll-triggered reveals
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-reveal').forEach((el) => {
        gsap.fromTo(el,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              scroller: containerRef.current,
              start: 'top 90%',
              once: true,
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Section observer for active nav indicator
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { root: containerRef.current, threshold: 0.4 });

    const sections = ['features', 'how', 'stats', 'faq'].map(id => document.getElementById(id));
    sections.forEach(s => s && observer.observe(s));

    const handleScroll = (e) => {
      if (e.target.scrollTop < 300) setActiveSection('');
    };
    const cRef = containerRef.current;
    if (cRef) cRef.addEventListener('scroll', handleScroll);

    return () => {
      sections.forEach(s => s && observer.unobserve(s));
      if (cRef) cRef.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getDashboardPath = () => user?.role === 'student' ? '/student' : '/teacher';

  const features = [
    {
      icon: '🛡️',
      title: 'Smart Focus Guard',
      desc: 'Detects tab switches, copy-paste attempts, and shortcut blocking. Locks the exam to fullscreen — the moment focus is lost, it is instantly flagged.',
      color: '#EDE9FE',
      accent: '#7C3AED',
      image: '/feature_focus_guard.png',
      details: [
        'Fullscreen lock enforced from exam start to submission',
        'Tab switch detected within milliseconds and logged with timestamp',
        'Keyboard shortcut blocking (Ctrl+C, Alt+Tab, PrintScreen, etc.)',
        'Screen blur detection — every focus-loss event is recorded',
        'Teachers see a complete violation log per student after the exam',
      ],
    },
    {
      icon: '⚡',
      title: 'Instant Test Builder',
      desc: 'AI-powered question generator. Teachers create full exams from a topic in seconds — MCQs, short answers, long form.',
      color: '#FEF3C7',
      accent: '#D97706',
      image: '/feature_ai_builder.png',
      details: [
        'Enter any topic and AI generates a full question paper instantly',
        'Choose difficulty: Easy, Medium, or Hard per question',
        'Mix MCQ, True/False, short answer, and long-form questions',
        'Edit, reorder, or delete any generated question before publishing',
        'Set per-question marks and overall time limit in one click',
      ],
    },
    {
      icon: '🤖',
      title: 'AI Camera Proctoring',
      desc: 'Uses your webcam to detect phone usage, multiple faces, or suspicious head movements — without recording or storing any footage. Flags events for teacher review.',
      color: '#FCE7F3',
      accent: '#DB2777',
      image: '/feature_ai_proctoring.png',
      details: [
        'Real-time smartphone detection using computer vision',
        'Multiple-face detection flags potential impersonation',
        'Head pose tracking identifies frequent looking away',
        'Zero footage stored — only flag events and timestamps saved',
        'Teachers review a timestamped violation report after every exam',
      ],
    },
    {
      icon: '📊',
      title: 'Live Analytics',
      desc: 'Real-time score dashboards, per-question analysis, and class-wide performance heatmaps — right after submission.',
      color: '#DCFCE7',
      accent: '#16A34A',
      image: '/feature_analytics.png',
      details: [
        'Scores available the second a student submits the exam',
        'Per-question accuracy breakdown across the entire class',
        'Score distribution curve with percentile ranking',
        'Export results as CSV or PDF for record-keeping',
        'Compare class performance across multiple exam sessions',
      ],
    },
  ];

  const faqs = [
    {
      q: 'Do students need to install anything?',
      a: 'Absolutely not. XampXpress runs 100% in the browser — no plugins, no extensions, no downloads. Students just open the link and start.'
    },
    {
      q: 'How does AI proctoring work without being invasive?',
      a: 'Our AI uses the webcam to detect suspicious behavior — like a student holding a smartphone, looking away too frequently, or another face entering the frame. It flags events for teacher review without recording or storing video footage. Your data stays private.'
    },
    {
      q: 'What happens if the internet cuts out during an exam?',
      a: 'Nothing bad! Every keystroke is saved locally in the browser. When connectivity returns, everything syncs automatically to the cloud. Students never lose work.'
    },
    {
      q: 'How does the AI test builder work?',
      a: 'Teachers enter a topic, select question types and difficulty level. Our AI generates a full question paper in seconds — which you can edit, reorder, and publish instantly.'
    },
    {
      q: 'Can teachers review flagged proctoring events?',
      a: 'Yes. After each exam, teachers see a timeline of flagged moments — each with a timestamp and the detected violation type (e.g. "Phone detected at 14:32"). Teachers make the final judgment call.'
    }
  ];

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#F5F4F0] text-gray-900 font-sans"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ══════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between bg-[#F5F4F0]/80 backdrop-blur-xl border-b border-black/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black text-sm">X</div>
          <span className="font-black text-lg tracking-tight">XampXpress</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600"
        >
          {['features', 'how', 'stats', 'faq'].map((id) => {
            const labels = { features: 'Features', how: 'How It Works', stats: 'Results', faq: 'FAQ' };
            const isActive = activeSection === id;
            return (
              <a 
                key={id} 
                href={`#${id}`} 
                className={`relative px-1 py-1 transition-colors ${isActive ? 'text-violet-700 font-bold' : 'hover:text-violet-600'}`}
              >
                {labels[id]}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {user ? (
            <Link to={getDashboardPath()} className="px-5 py-2 bg-violet-600 text-white text-sm font-bold rounded-full hover:bg-violet-700 transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-5 py-2 bg-gray-200 text-gray-900 text-sm font-bold rounded-full hover:bg-gray-300 transition-colors">
                Log in
              </Link>
              <Link to="/register" className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors">
                Start Free
              </Link>
            </>
          )}
        </motion.div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO — Full-bleed violet with floating cards
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ paddingTop: '72px' }}>
        {/* Big violet background blob — starts right below the navbar */}
        <motion.div
          className="absolute rounded-3xl overflow-hidden"
          style={{ scale: heroScale, top: '10px', bottom: '16px', left: '16px', right: '16px' }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ background: ['#7C3AED', '#6D28D9', '#7C3AED'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] rounded-3xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px',
            }}
          />

          {/* Decorative blobs inside hero */}
          <FloatingShape
            className="absolute top-[10%] left-[8%] w-32 h-32 rounded-full"
            style={{ background: 'rgba(167,139,250,0.4)' }}
            delay={0} duration={7}
          />
          <FloatingShape
            className="absolute bottom-[15%] right-[6%] w-48 h-48 rounded-full"
            style={{ background: 'rgba(109,40,217,0.6)' }}
            delay={1} duration={9}
          />
          <FloatingShape
            className="absolute top-[20%] right-[20%] w-16 h-16"
            style={{ background: '#EC4899', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
            delay={0.5} duration={5}
          />
          <FloatingShape
            className="absolute bottom-[30%] left-[15%] w-12 h-12 rotate-45"
            style={{ background: '#F59E0B' }}
            delay={1.5} duration={6}
          />
          <FloatingShape
            className="absolute top-[55%] right-[35%] w-8 h-8 rounded-full"
            style={{ background: '#34D399' }}
            delay={2} duration={4}
          />

          {/* Floating exam cards — all fully inside the violet box */}
          <div className="absolute right-[5%] top-[14%]">
            <ExamMockCard
              title="Calculus Final Exam"
              subject="Mathematics · Grade 12"
              time="90 min · 40 questions"
              color="#FEF3C7"
              rotate={4}
              delay={0.8}
              floatY={12}
            />
          </div>
          <div className="absolute left-[4%] bottom-[22%]">
            <ExamMockCard
              title="World History Quiz"
              subject="Humanities · Grade 10"
              time="45 min · 25 questions"
              color="#EDE9FE"
              rotate={-5}
              delay={1.1}
              floatY={16}
            />
          </div>
          <div className="absolute right-[22%] bottom-[12%]">
            <ExamMockCard
              title="Python Fundamentals"
              subject="Computer Science"
              time="60 min · MCQ + Code"
              color="#FCE7F3"
              rotate={2}
              delay={1.4}
              floatY={10}
            />
          </div>
          <div className="absolute left-[28%] top-[10%]">
            <ExamMockCard
              title="Biology Unit Test"
              subject="Science · Grade 11"
              time="30 min · 20 questions"
              color="#D1FAE5"
              rotate={-3}
              delay={1.7}
              floatY={14}
            />
          </div>

          {/* Floating badges — accurate platform messaging */}
          <FloatingBadge label="🤖 AI proctoring active" className="bg-white text-gray-800 top-[12%] right-[30%]" delay={2} />
          <FloatingBadge label="⚡ AI-generated exams" className="bg-amber-400 text-gray-900 bottom-[40%] right-[8%]" delay={2.4} />
          <FloatingBadge label="🔒 Privacy-first" className="bg-emerald-400 text-gray-900 top-[45%] left-[8%]" delay={2.8} />
        </motion.div>

        {/* Hero headline — centered */}
        <div className="relative z-10 text-center px-6 mt-[-20px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold tracking-widest uppercase mb-6 border border-white/30">
              The examination platform reimagined
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight max-w-4xl mx-auto">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              Exams that
            </motion.span>
            <motion.span
              className="block italic font-black"
              style={{ color: '#FDE68A' }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              respect you.
            </motion.span>
          </h1>

          <motion.p
            className="text-white/70 text-base md:text-lg max-w-md mx-auto mt-6 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Create, deliver, and grade powerful assessments — without surveillance cameras, without invasive software.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-violet-700 font-black rounded-full hover:scale-105 transition-transform shadow-xl text-sm"
            >
              Start for free — it's quick
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 border border-white/40 text-white font-bold rounded-full hover:bg-white/10 transition-colors text-sm"
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SCROLL MARQUEE
      ══════════════════════════════════════════════ */}
      <div className="overflow-hidden bg-violet-600 py-4 relative">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(2)].map((_, outer) => (
            ['Smart Proctoring', '·', 'AI Test Builder', '·', 'Offline Safe', '·', 'Live Analytics', '·', 'AI Detection', '·', 'Privacy First', '·', 'Instant Results', '·'].map((item, i) => (
              <span key={`${outer}-${i}`} className={`text-sm font-bold ${item === '·' ? 'text-violet-300' : 'text-white'}`}>
                {item}
              </span>
            ))
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════ */}
      <section id="features" className="pt-12 pb-14 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="mb-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold tracking-widest uppercase text-violet-600 mb-2"
          >
            Platform capabilities
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black leading-tight max-w-2xl">
            <WordReveal text="Everything you need to run world-class exams." />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group rounded-3xl p-8 cursor-pointer relative overflow-hidden"
              style={{ background: f.color }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {/* Hover glow */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{ background: f.accent, filter: 'blur(30px)' }}
              />
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="text-xl font-black mb-3 text-gray-900">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              <button
                onClick={() => setActiveModal(f)}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold hover:gap-3 transition-all duration-200"
                style={{ color: f.accent }}
              >
                Learn more →
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Modal */}
      {activeModal && <FeatureModal feature={activeModal} onClose={() => setActiveModal(null)} />}

      {/* ══════════════════════════════════════════════
          HOW IT WORKS — Giant step numbers
      ══════════════════════════════════════════════ */}
      <section id="how" className="pt-12 pb-14 bg-gray-900 text-white relative overflow-hidden">
        {/* Big decorative shapes */}
        <FloatingShape
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#7C3AED' }}
          delay={0} duration={10}
        />
        <FloatingShape
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#EC4899' }}
          delay={2} duration={8}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="mb-6">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block text-xs font-bold tracking-widest uppercase text-violet-400 mb-2"
            >
              How it works
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black leading-tight max-w-xl">
              <WordReveal text="Up and running in three steps." />
            </h2>
          </div>

          <div className="space-y-0">
            {[
              {
                num: '01',
                title: 'Create your exam',
                desc: 'Use our AI builder or write your own questions. Add timers, marks, and instructions. Publish with one click.',
                tag: 'For Teachers',
                color: '#7C3AED',
                link: '/register',
              },
              {
                num: '02',
                title: 'Students enter and write',
                desc: 'Students open the link, go fullscreen and start. Our AI camera system silently monitors for suspicious behavior — phone detection, identity checks — without invasive recording.',
                tag: 'For Students',
                color: '#EC4899',
                link: '/register',
              },
              {
                num: '03',
                title: 'Instant results & insights',
                desc: 'Scores are calculated the moment the exam ends. Teachers get per-student breakdowns, class averages, and question analytics.',
                tag: 'For Everyone',
                color: '#F59E0B',
                link: '/register',
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                className="group flex flex-col md:flex-row items-start md:items-center gap-6 py-8 border-t border-white/10"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 8 }}
              >
                <span
                  className="text-7xl md:text-8xl font-black leading-none shrink-0 transition-all duration-500 group-hover:scale-110"
                  style={{ color: step.color, opacity: 0.9 }}
                >
                  {step.num}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-2xl md:text-3xl font-black">{step.title}</h3>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: step.color + '25', color: step.color, border: `1px solid ${step.color}40` }}
                    >
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg">{step.desc}</p>
                </div>
                <Link
                  to={step.link}
                  className="shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/30 group-hover:border-white/60 group-hover:text-white group-hover:bg-white/10 transition-all duration-300"
                >
                  →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS — Big bold numbers like Wollo
      ══════════════════════════════════════════════ */}
      <section id="stats" className="py-28 px-6 md:px-10 gsap-stats-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-violet-600 mb-4 block">By the numbers</span>
            <h2 className="text-4xl md:text-5xl font-black">Real results, right now.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: 50000, suffix: '+', label: 'Exams Delivered', desc: 'Across schools, colleges, and training centers', color: '#EDE9FE', accent: '#7C3AED', icon: '📝' },
              { num: 98, suffix: '%', label: 'Student Satisfaction', desc: 'No cameras, no anxiety, no invasive spyware', color: '#FEF3C7', accent: '#D97706', icon: '😊' },
              { num: 0, suffix: 'sec', label: 'Setup Time', desc: 'Open browser, share link, start exam. Done.', color: '#FCE7F3', accent: '#DB2777', icon: '🚀' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{ background: stat.color }}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-6xl md:text-7xl font-black leading-none mb-2" style={{ color: stat.accent }}>
                  {stat.num === 0 ? (
                    <span>~0</span>
                  ) : (
                    <AnimatedNumber target={stat.num} suffix={stat.suffix} />
                  )}
                </div>
                <div className="text-lg font-black text-gray-900 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIAL-STYLE QUOTE BANNER
      ══════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-10 bg-violet-600 relative overflow-hidden">
        <FloatingShape
          className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          delay={0} duration={8}
        />
        <FloatingShape
          className="absolute bottom-[-40px] right-[-40px] w-64 h-64 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          delay={1} duration={10}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.p
            className="text-3xl md:text-5xl font-black text-white leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            "We ran our entire semester finals — 600 students, 12 subjects — without a single technical issue."
          </motion.p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">P</div>
            <div className="text-left">
              <div className="text-white font-bold text-sm">Prof. Ananya Sharma</div>
              <div className="text-violet-200 text-xs">Head of Department, Delhi University</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section id="faq" className="pt-12 pb-16 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="text-xs font-bold tracking-widest uppercase text-violet-600 mb-2 block">Questions answered</span>
          <h2 className="text-4xl md:text-5xl font-black">
            <WordReveal text="Got questions? We've got answers." />
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <span className="font-bold text-base text-gray-900">{faq.q}</span>
                <motion.span
                  animate={{ rotate: activeFaq === i ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-2xl font-thin text-gray-400 ml-4 shrink-0"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="mx-4 mb-8 rounded-3xl bg-gray-900 py-20 px-6 text-center relative overflow-hidden">
        <FloatingShape
          className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-20"
          style={{ background: '#7C3AED' }}
          delay={0} duration={10}
        />
        <FloatingShape
          className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full opacity-20"
          style={{ background: '#EC4899' }}
          delay={1} duration={8}
        />

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold tracking-widest uppercase mb-6 border border-violet-500/30">
            Free forever for small classes
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            Ready to run<br />
            <span className="text-violet-400 italic">smarter exams?</span>
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto mb-10 leading-relaxed">
            Join thousands of educators who've ditched surveillance proctoring for something better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-violet-600 text-white font-black rounded-full hover:bg-violet-500 transition-colors text-sm shadow-xl shadow-violet-500/25"
            >
              Create your first exam →
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-white/20 text-white font-bold rounded-full hover:border-white/50 transition-colors text-sm"
            >
              Already have an account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-5 px-6 md:px-10 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black text-sm">X</div>
            <span className="font-black text-gray-900 text-sm">XampXpress</span>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-gray-400 font-medium order-last sm:order-none">
            © {new Date().getFullYear()} XampXpress · Smart examination, zero surveillance.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2.5">
            {/* X / Twitter */}
            <motion.a
              href="https://twitter.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-900 flex items-center justify-center transition-colors group"
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }} title="Follow on X"
            >
              <svg className="w-3.5 h-3.5 fill-gray-500 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </motion.a>

            {/* Instagram */}
            <motion.a
              href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all group"
              whileHover={{ scale: 1.12, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' }}
              whileTap={{ scale: 0.95 }} title="Follow on Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-gray-500 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </motion.a>

            {/* Facebook */}
            <motion.a
              href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[#1877F2] flex items-center justify-center transition-colors group"
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }} title="Follow on Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-gray-500 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
