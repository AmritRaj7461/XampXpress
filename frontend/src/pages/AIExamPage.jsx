import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, Clock, Send, Maximize, ShieldCheck, RefreshCw, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveMonitor from '../components/Proctoring/LiveMonitor';

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
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [violationLogs, setViolationLogs] = useState([]);
  const [activeWarningMsg, setActiveWarningMsg] = useState('');
  const [isEnvironmentTampered, setIsEnvironmentTampered] = useState(false);

  const [setupStream, setSetupStream] = useState(null);
  const [setupError, setSetupError] = useState('');
  const [setupGranted, setSetupGranted] = useState(false);

  const examRef = useRef(null);
  const timerRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const monitorRef = useRef(null);
  const setupVideoRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ── Early DevTools Check ───────────────────────────────────────────────
  useEffect(() => {
    let lagHits = 0;
    
    // DevTools check running immediately to block pre-exam inspection
    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
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

  // ── Setup Media Permissions ───────────────────────────────────────────
  useEffect(() => {
    if (hasStarted) return;
    let localStream = null;
    const requestSetupMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setSetupStream(localStream);
        setSetupGranted(true);
        if (setupVideoRef.current) {
          setupVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        setSetupError('Camera and microphone access is required to take this exam. Please allow permissions in your browser.');
        console.error("Setup camera access error:", err);
      }
    };
    requestSetupMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasStarted]);

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
      
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subject: examData.subject,
            topics: examData.topics,
            questions: examData.questions,
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
  }, [hasStarted, responses, violationLogs, examData]);

  // ── Fullscreen Monitoring & Continual Enforcer ─────────────────────────
  useEffect(() => {
    if (!isProctoringActive) return;
    
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
  }, [isProctoringActive]);

  // ── Tab switch detection & Anti-Cheat Measures ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isProctoringActive) return;

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

    // Block Shadow DOM attachment (commonly used by cheating extensions)
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
      } catch {
        // ignore
      }
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

      // Block cheating shortcuts (DevTools, Copy, Paste, Select All)
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

    // Helper to determine if a DOM node is whitelisted
    const isNodeWhitelisted = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return true;
      const tagName = node.tagName.toLowerCase();

      if (tagName === 'html' || tagName === 'head' || tagName === 'body') return true;

      const root = document.getElementById('root');
      if (root && (node === root || root.contains(node))) return true;

      if (tagName === 'style' || tagName === 'link' || tagName === 'meta' || tagName === 'title') return true;

      if (tagName === 'script') {
        const src = node.getAttribute('src');
        if (!src) return true;

        try {
          const url = new URL(src, window.location.origin);
          if (url.origin === window.location.origin) return true;
          
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
        } catch {
          // ignore
        }
        return false;
      }

      if (tagName.includes('vercel') || tagName.includes('nextjs')) return true;
      if (node.id && (node.id.includes('vercel') || node.id === '__next')) return true;

      return false;
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
    scanDOM();

    // 4. MutationObserver to block extensions
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = node.tagName.toLowerCase();

              if (tagName === 'iframe' && !isNodeWhitelisted(node)) {
                const srcAttr = node.getAttribute ? (node.getAttribute('src') || 'none') : 'none';
                const info = `Tag: <iframe?>, ID: "${node.id || 'none'}", Class: "${node.className || 'none'}", Src: "${srcAttr}"`;
                node.remove();
                triggerViolation(`🔴 Unauthorized frame/extension wrapper detected! (${info})`);
                return;
              }

              if (!isNodeWhitelisted(node)) {
                const srcAttr = node.getAttribute ? (node.getAttribute('src') || 'none') : 'none';
                const info = `Tag: <${node.tagName.toLowerCase()}>, ID: "${node.id || 'none'}", Class: "${node.className || 'none'}", Src: "${srcAttr}"`;
                node.remove();
                triggerViolation(`🔴 Unauthorized third-party extension injection detected! (${info})`);
              }
            }
          });
        }
      }
    });

    // 5. Time-Drift check
    let lastTick = null;
    let timingActive = true;

    const checkDrift = () => {
      if (!timingActive) return;
      
      if (isPausedRef.current) {
        lastTick = null; // Reset while paused so we don't calculate pause duration on resume
        requestAnimationFrame(checkDrift);
        return;
      }
      
      const now = Date.now();
      if (lastTick === null) {
        lastTick = now;
        requestAnimationFrame(checkDrift);
        return;
      }

      const delta = now - lastTick;
      lastTick = now;

      if (delta > 400) {
        triggerViolation('⚠️ Background activity detected! (Tab switch/minimization)');
      }

      requestAnimationFrame(checkDrift);
    };

    // 6. DevTools Inspector Detection Loop
    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
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
      Element.prototype.attachShadow = originalAttachShadow;
      observer.disconnect();
      clearInterval(devToolsInterval);
      clearInterval(visibilityChecker);
      timingActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProctoringActive]);

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
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasStarted, isSubmitting, violated]);

  function triggerViolation(msg, forceSubmit = false) {
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
        const next = prevWarn + 1;
        if (next >= MAX_WARNINGS || forceSubmit) {
          setViolated(true);
          handleSubmit(true, updatedLogs);
        }
        return next;
      });
      return updatedLogs;
    });
  }

  const handleDeviceDetect = (msg) => {
    triggerViolation(msg, true);
  };

  async function handleSubmit(isViolated = false, logsToSubmit = violationLogs) {
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
        violationLogs: logsToSubmit,
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
  }

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsPaused(false);
      isPausedRef.current = false;
      setActiveWarningMsg('');
    } catch {
      setIsPaused(false);
      isPausedRef.current = false;
      setActiveWarningMsg('');
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
    if (setupStream) {
      setupStream.getTracks().forEach(track => track.stop());
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      console.warn("Failed to enter fullscreen.");
    }
    setHasStarted(true);
    setTimeout(() => {
      setIsProctoringActive(true);
    }, 3000);
  };

  if (!hasStarted) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center p-6 overflow-y-auto transition-colors duration-300">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-8">
          
          {/* Top Header */}
          <div className="text-center">
            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-200 dark:border-indigo-500/25">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">System & Guidelines Setup</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Please read the rules and verify your camera to unlock the AI mock exam.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Guidelines */}
            <div className="flex flex-col gap-4 text-left">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Exam Guidelines</h2>
              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-gray-400">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span><strong>Fullscreen Enforcement:</strong> The test runs in fullscreen. Exiting fullscreen at any point triggers a violation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span><strong>Tab & Window Tracking:</strong> Switching tabs or opening external applications is strictly prohibited.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span><strong>Webcam Verification:</strong> Our AI monitors your face gaze and checks for secondary devices (e.g., cell phones).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span><strong>Violation Submission:</strong> Accumulating <strong>{MAX_WARNINGS} warnings</strong> will result in the immediate auto-submission of your test.</span>
                </li>
              </ul>
            </div>

            {/* Right: Camera Feed Check */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 text-left">Webcam Verification</h2>
              
              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                {setupError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-6 text-center">
                    <AlertTriangle size={36} className="mb-2 animate-bounce" />
                    <p className="text-xs font-semibold">{setupError}</p>
                  </div>
                ) : (
                  <video ref={setupVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                )}

                {setupGranted && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs text-green-400 border border-white/10 font-mono shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> CAMERA ACTIVE
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleStart}
              disabled={!setupGranted}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-2xl font-extrabold text-base transition-all shadow-xl shadow-blue-500/10 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Maximize size={18} /> Enter Fullscreen & Start Exam
            </button>
            {!setupGranted && !setupError && (
              <span className="text-xs text-amber-500 animate-pulse font-semibold flex items-center gap-1.5">
                <RefreshCw size={12} className="animate-spin" /> Requesting media permissions in browser...
              </span>
            )}
          </div>

        </div>
      </div>
    );
  }

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
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-500/15 disabled:opacity-50 hover:scale-[1.02]"
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
              <AnimatePresence>
                {activeWarningMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-lg shadow-red-500/5"
                  >
                    <AlertTriangle size={20} className="animate-bounce text-red-500 animate-pulse" />
                    <span>{activeWarningMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
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

        {/* ── Right Palette & Webcam Monitor ─────────────────────────────── */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
          
          {/* Live Proctoring Webcam Monitor */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Proctoring Active</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>
            <LiveMonitor 
              ref={monitorRef}
              onViolation={triggerViolation} 
              onDeviceDetect={handleDeviceDetect}
              isPaused={isPaused} 
            />
          </div>

          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex-1 overflow-y-auto">
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
          
          <div className="p-4 space-y-2 text-xs text-slate-500 dark:text-gray-400 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-600/10 dark:bg-green-600/20 border border-green-200 dark:border-green-600/30"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800"></div> Not Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-600"></div> Current</div>
          </div>
          
          {warnings > 0 && (
            <div className="m-4 mt-0 p-3.5 bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs text-red-600 dark:text-red-400">
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
