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
  const [violationLogs, setViolationLogs] = useState([]);
  const [activeWarningMsg, setActiveWarningMsg] = useState('');
  const [isEnvironmentTampered, setIsEnvironmentTampered] = useState(false);
  const timerRef = useRef(null);

  const isPausedRef = useRef(isPaused);
  const monitorRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ── Early DevTools Check ───────────────────────────────────────────────
  useEffect(() => {
    let lagHits = 0;
    
    // DevTools check running immediately to block pre-exam inspection
    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      debugger; // Halts execution when DevTools console/inspector is open
      const end = performance.now();
      
      // If the execution was paused for > 200ms, increment hits
      if (end - start > 200) {
        lagHits++;
        if (lagHits >= 3) {
          setIsEnvironmentTampered(true);
        }
      } else {
        lagHits = 0; // Reset if it was just a transient render/CPU lag spike
      }
    }, 1000);

    return () => {
      clearInterval(devToolsInterval);
    };
  }, []);

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

  const handleSubmit = async (isViolated = false, logsToSubmit = violationLogs) => {
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
        violationLogs: logsToSubmit,
      });
      navigate(`/student/result/${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  const triggerViolation = (msg, forceSubmit = false) => {
    if (isPausedRef.current && !forceSubmit) return;
    setIsPaused(true);
    isPausedRef.current = true;
    setActiveWarningMsg(msg);
    
    // Capture snapshot from webcam
    const snapshot = monitorRef.current?.captureSnapshot() || null;
    const newLog = { reason: msg, timestamp: new Date(), screenshotBase64: snapshot };
    
    setViolationLogs(prev => {
      const updatedLogs = [...prev, newLog];
      
      setWarnings(prevWarn => {
        const nextWarn = prevWarn + 1;
        if (nextWarn >= MAX_WARNINGS || forceSubmit) {
          setViolated(true);
          handleSubmit(true, updatedLogs);
        }
        return nextWarn;
      });

      return updatedLogs;
    });
  };

  const handleDeviceDetect = (msg) => {
    triggerViolation(msg, true); // True forces immediate submit
  };

  // ── Prevent Navigation & Auto-Submit on Unload ─────────────────────────
  useEffect(() => {
    if (!hasStarted) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome to show warning
      triggerViolation('🔴 Attempted to close or reload the exam tab!');
    };

    const handleUnload = () => {
      // Send a beacon to submit the exam if they actually leave
      const formattedResponses = Object.keys(responses).map(qId => ({
        questionId: qId,
        selectedOption: responses[qId],
      }));
      
      // We can't easily get the auth token for sendBeacon if it's protected by bearer token.
      // Alternatively, we use fetch with keepalive.
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/exams/${id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            responses: formattedResponses,
            violated: true,
            violationLogs: [...violationLogs, { reason: '🔴 Exam abandoned (Tab closed)', timestamp: new Date() }]
          }),
          keepalive: true
        }).catch(() => {});
      }
    };

    const blockPopState = () => {
      triggerViolation('🔴 Attempted to navigate back!');
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockPopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('popstate', blockPopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [hasStarted, responses, violationLogs, id]);

// (Logic replaced above)

  // ── Fullscreen Monitoring ──────────────────────────────────────────────
  // ── Fullscreen Monitoring & Continual Enforcer ─────────────────────────
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleFSChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('🔴 You exited fullscreen!');
      }
    };

    const checkFullscreenStatus = () => {
      if (!isPausedRef.current && !document.fullscreenElement) {
        triggerViolation('🔴 Fullscreen mode is required to take this exam! Please resume and do not exit fullscreen.');
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    
    // Check immediately and periodically every 1000ms
    checkFullscreenStatus();
    const fsInterval = setInterval(checkFullscreenStatus, 1000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      clearInterval(fsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  // ── Tab switch detection & Anti-Cheat Measures ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;

    // Extract pristine getters from a dynamic iframe to bypass any extension monkey-patching
    let originalHiddenGetter = null;
    let originalVisibilityGetter = null;
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.documentElement.appendChild(iframe);
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      const iframeProto = Object.getPrototypeOf(iframeDocument);
      originalHiddenGetter = Object.getOwnPropertyDescriptor(iframeProto, 'hidden')?.get;
      originalVisibilityGetter = Object.getOwnPropertyDescriptor(iframeProto, 'visibilityState')?.get;
      iframe.remove();
    } catch (e) {
      console.warn("Failed to retrieve pristine descriptors from iframe", e);
    }

    // Block Shadow DOM attachment (commonly used by extensions to hide their widgets)
    const originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(init) {
      triggerViolation('🔴 Shadow DOM activity detected (suspicious extension widget)!');
      return originalAttachShadow.call(this, init);
    };

    // Helper to get real visibility status
    const isTabHidden = () => {
      try {
        if (originalHiddenGetter && originalHiddenGetter.call(document)) return true;
        if (originalVisibilityGetter && originalVisibilityGetter.call(document) === 'hidden') return true;
      } catch (err) {}
      return document.hidden || document.visibilityState === 'hidden';
    };

    // 1. Tab visibility changes - instant 100ms interval polling using pristine getters
    const visibilityChecker = setInterval(() => {
      if (isTabHidden()) {
        triggerViolation('⚠️ Tab switch detected!');
      }
    }, 100);

    const handleVisibilityChange = () => {
      if (isTabHidden()) {
        triggerViolation('⚠️ Tab switch detected!');
      }
    };

    // 2. Prevent right-click, selection, copy, paste
    const preventActions = (e) => {
      e.preventDefault();
    };

    const preventKeys = (e) => {
      const key = e.key.toLowerCase();
      
      // Block PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('⚠️ Screenshot attempt detected!');
        return;
      }

      // Block only specific cheating shortcuts (DevTools, Copy, Paste, Select All)
      // Allows general modifiers like Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+Arrows (navigation) for future coding/typing tests
      const isCmdOption = e.metaKey && e.altKey;
      const isDevTools = e.key === 'F12' ||
                         (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
                         (e.ctrlKey && key === 'u') ||
                         (isCmdOption && (key === 'i' || key === 'j' || key === 'c' || key === 'u'));
                         
      const isClipboardOrSelectAll = (e.ctrlKey || e.metaKey) && (key === 'c' || key === 'v' || key === 'x' || key === 'a');

      if (isDevTools || isClipboardOrSelectAll) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation(`⚠️ Keyboard shortcut blocked (${isDevTools ? 'DevTools' : 'Clipboard/Selection'} disabled during exam)!`);
      }
    };

    // Helper to determine if a DOM node is whitelisted (i.e. part of our own app, styles, or trusted CDNs)
    const isNodeWhitelisted = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return true;
      const tagName = node.tagName.toLowerCase();

      // 1. Core HTML layout elements are always allowed
      if (tagName === 'html' || tagName === 'head' || tagName === 'body') return true;

      // 2. Elements inside the main React root container are allowed
      const root = document.getElementById('root');
      if (root && (node === root || root.contains(node))) return true;

      // 3. Document metadata, links, and stylesheets are allowed
      if (tagName === 'style' || tagName === 'link' || tagName === 'meta' || tagName === 'title') return true;

      // 4. Scripts
      if (tagName === 'script') {
        const src = node.getAttribute('src');
        if (!src) return true; // Allow inline scripts (e.g. Vite HMR/overlays)

        try {
          // Resolve URL relative to origin
          const url = new URL(src, window.location.origin);
          
          // Whitelist if same origin (local bundle, dev server, HMR)
          if (url.origin === window.location.origin) return true;
          
          // Whitelist trusted external CDNs
          const whitelistedDomains = [
            'cdn.jsdelivr.net',
            'mediapipe',
            'googleapis.com',
            'gstatic.com',
            'google.com',
            'vercel.live',
            'vercel.com'
          ];
          if (whitelistedDomains.some(domain => url.hostname.includes(domain))) {
            return true;
          }
        } catch (e) {
          // Fallback if URL parsing fails
        }
        return false;
      }

      // 5. Whitelist Vercel/Next.js injected tags and toolbars
      if (tagName.includes('vercel') || tagName.includes('nextjs')) return true;

      // 6. Whitelist specific IDs often used by Vercel
      if (node.id && (node.id.includes('vercel') || node.id === '__next')) return true;

      return false; // Block anything else outside the React root (like extension widgets, overlays, translation tools)
    };

    // 3. Scan DOM for pre-existing injected extension elements and remove them
    const scanDOM = () => {
      const bodyChildren = Array.from(document.body.children);
      const htmlChildren = Array.from(document.documentElement.children);
      const allChildren = [...bodyChildren, ...htmlChildren];

      allChildren.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && !isNodeWhitelisted(node)) {
          const srcAttr = node.getAttribute ? (node.getAttribute('src') || 'none') : 'none';
          const info = `Tag: <${node.tagName.toLowerCase()}>, ID: "${node.id || 'none'}", Class: "${node.className || 'none'}", Src: "${srcAttr}"`;
          console.warn("Anti-Cheat initial scan blocked element:", node, info);
          node.remove();
          triggerViolation(`🔴 Unauthorized third-party extension injection detected! (${info})`);
        }
      });
    };
    scanDOM(); // Run initial scan instantly on startup

    // 4. MutationObserver to block ALL unauthorized extensions & injected elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = node.tagName.toLowerCase();

              // If it's an iframe, delete it instantly
              if (tagName === 'iframe' && !isNodeWhitelisted(node)) {
                const srcAttr = node.getAttribute ? (node.getAttribute('src') || 'none') : 'none';
                const info = `Tag: <iframe?>, ID: "${node.id || 'none'}", Class: "${node.className || 'none'}", Src: "${srcAttr}"`;
                console.warn("Anti-Cheat iframe block:", node, info);
                node.remove();
                triggerViolation(`🔴 Unauthorized frame/extension wrapper detected! (${info})`);
                return;
              }

              if (!isNodeWhitelisted(node)) {
                const srcAttr = node.getAttribute ? (node.getAttribute('src') || 'none') : 'none';
                const info = `Tag: <${node.tagName.toLowerCase()}>, ID: "${node.id || 'none'}", Class: "${node.className || 'none'}", Src: "${srcAttr}"`;
                console.warn("Anti-Cheat mutation block:", node, info);
                node.remove();
                triggerViolation(`🔴 Unauthorized third-party extension injection detected! (${info})`);
              }
            }
          });
        }
      }
    });

    // 4. Time-Drift check to bypass Keep-Active visibility spoofing
    let lastTick = Date.now();
    let timingActive = true;

    const checkDrift = () => {
      if (!timingActive) return;
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      // If the loop was frozen for more than 400ms, the tab was backgrounded/suspended
      if (delta > 400) {
        triggerViolation('⚠️ Background activity detected! (Tab switch/minimization)');
      }

      requestAnimationFrame(checkDrift);
    };

    // 5. DevTools Inspector Detection Loop (using debugger timing)
    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      debugger; // Halts execution when DevTools console/inspector is open
      const end = performance.now();
      if (end - start > 100) {
        triggerViolation('⚠️ Developer tools inspection detected!');
      }
    }, 1000);

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('selectstart', preventActions);
    document.addEventListener('copy', preventActions);
    document.addEventListener('paste', preventActions);
    document.addEventListener('keydown', preventKeys);
    
    // Explicitly set window.onblur and document.onvisibilitychange properties to override extension intercepts
    window.onblur = () => {
      triggerViolation('⚠️ Window lost focus (tab switch or application switch)!');
    };
    document.onvisibilitychange = () => {
      if (isTabHidden()) {
        triggerViolation('⚠️ Tab switch detected!');
      }
    };
    
    observer.observe(document.documentElement, { childList: true, subtree: true });
    requestAnimationFrame(checkDrift);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('selectstart', preventActions);
      document.removeEventListener('copy', preventActions);
      document.removeEventListener('paste', preventActions);
      document.removeEventListener('keydown', preventKeys);
      window.onblur = null;
      document.onvisibilitychange = null;
      Element.prototype.attachShadow = originalAttachShadow; // Restore shadow DOM
      observer.disconnect();
      clearInterval(devToolsInterval);
      clearInterval(visibilityChecker);
      timingActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, exam, isSubmitting, isPaused]);



  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsPaused(false);
      isPausedRef.current = false;
      setActiveWarningMsg('');
    } catch (err) {
      console.warn("Fullscreen request was rejected:", err);
      // Even if fullscreen is rejected/fails, allow them to resume to avoid locking out the test completely
      setIsPaused(false);
      isPausedRef.current = false;
      setActiveWarningMsg('');
    }
  };

  const handleOptionSelect = (qId, option) => setResponses({ ...responses, [qId]: option });



  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white text-xl font-semibold">Loading Exam Engine...</div>;
  if (!exam) return null;

  if (isEnvironmentTampered) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Security Alert</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Our anti-cheat engine has detected that your browser console is open or critical web APIs have been modified. 
            To take the exam, please close developer tools/consoles, reload the page, and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition duration-200 shadow-lg shadow-red-500/20"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestionIdx];
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStart = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn("Failed to start fullscreen test:", err);
    }
    setHasStarted(true);
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
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10 animate-pulse">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-3xl font-black text-red-500 tracking-tight">Proctoring Alert</h2>
            
            <div className="max-w-md p-6 bg-slate-900/60 border border-white/5 dark:border-slate-800/80 rounded-3xl space-y-3">
              <p className="text-red-400 font-semibold text-lg leading-snug">
                {activeWarningMsg || "You exited fullscreen or triggered a guideline violation!"}
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
              Resume Test & Return to Fullscreen
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
            <AnimatePresence>
              {activeWarningMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-lg shadow-red-500/5"
                >
                  <AlertTriangle size={20} className="animate-bounce text-red-500 animate-pulse" />
                  <span>{activeWarningMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
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
            <LiveMonitor 
            ref={monitorRef}
            onViolation={triggerViolation} 
            onDeviceDetect={handleDeviceDetect}
            isPaused={isPaused} 
          />
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
