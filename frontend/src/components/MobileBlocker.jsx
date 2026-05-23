import { useState, useEffect } from 'react';
import { Monitor, Camera, ShieldAlert, Laptop } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileBlocker = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden relative">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass max-w-md w-full rounded-[32px] p-8 border border-white/50 dark:border-slate-700/50 shadow-2xl flex flex-col items-center text-center space-y-6"
        >
          {/* Animated Header Icons */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
              <Laptop size={40} />
            </div>
            <span className="absolute -top-2 -right-2 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-white">
                <ShieldAlert size={12} />
              </span>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Desktop Required
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              XampXpress AI Proctoring
            </p>
          </div>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              To ensure the integrity of the examination, XampXpress utilizes real-time proctoring including **face mesh validation**, **gaze tracking**, and **multi-face warning**.
            </p>
            <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-left text-xs">
              <Camera className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <span>A functioning webcam, a wide landscape viewport, and a persistent keyboard/mouse input layout are mandatory.</span>
            </div>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Please open this link on a **Desktop or Laptop** device to continue.
            </p>
          </div>

          {/* Device indicators */}
          <div className="flex justify-center items-center gap-6 pt-2 text-gray-400">
            <div className="flex flex-col items-center gap-1">
              <Monitor size={20} />
              <span className="text-[10px]">Desktop</span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <div className="flex flex-col items-center gap-1">
              <Laptop size={20} />
              <span className="text-[10px]">Laptop</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default MobileBlocker;
