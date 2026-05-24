import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, BarChart, Zap, ArrowRight, BrainCircuit, Globe, Layers } from 'lucide-react';

const LandingPage = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Navbar Minimal */}
      <nav className="absolute top-0 w-full p-6 z-50 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
            X
          </div>
          <span className="text-xl font-bold tracking-tight">XampXpress</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8"
          >
            <BrainCircuit size={16} />
            <span>AI-Powered Proctoring Engine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
          >
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Secure Examinations
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Create, manage, and proctor exams with military-grade security. 
            XampXpress uses advanced AI to detect tab switches, track attention, and ensure absolute academic integrity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started for Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-white border border-gray-700 rounded-xl font-semibold transition-all flex items-center justify-center backdrop-blur-sm"
            >
              Teacher Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0F1523] border-y border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to conduct fair and transparent assessments.</p>
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
                icon: <Eye className="text-blue-400" size={24} />,
                title: "Strict Tab Detection",
                desc: "Instantly terminates the exam if a student attempts to switch tabs or open other applications."
              },
              {
                icon: <Globe className="text-emerald-400" size={24} />,
                title: "Fullscreen Lock",
                desc: "Enforces a strict fullscreen environment. Exiting fullscreen logs a severe violation."
              },
              {
                icon: <ShieldCheck className="text-purple-400" size={24} />,
                title: "DevTools Blocking",
                desc: "Prevents students from opening developer tools, inspecting elements, or altering local code."
              },
              {
                icon: <BarChart className="text-pink-400" size={24} />,
                title: "Automated Grading",
                desc: "Instant result generation with comprehensive accuracy, fair points, and violation logs."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                className="bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-gray-800/60 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-900/80 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-gray-800">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A seamless experience for both educators and students.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 text-8xl font-black text-gray-800/30">1</div>
              <Layers className="text-indigo-400 mb-6" size={32} />
              <h3 className="text-2xl font-bold mb-4">Create Test</h3>
              <p className="text-gray-400">Teachers effortlessly craft exams, set time limits, and configure AI proctoring strictness rules in a few clicks.</p>
            </div>
            
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 mt-0 lg:mt-12">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 text-8xl font-black text-gray-800/30">2</div>
              <ShieldCheck className="text-purple-400 mb-6" size={32} />
              <h3 className="text-2xl font-bold mb-4">Secure Execution</h3>
              <p className="text-gray-400">Students enter a locked-down browser environment. AI continuously monitors their activity to prevent malpractice.</p>
            </div>
            
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 mt-0 lg:mt-24">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 text-8xl font-black text-gray-800/30">3</div>
              <Zap className="text-pink-400 mb-6" size={32} />
              <h3 className="text-2xl font-bold mb-4">Instant Analytics</h3>
              <p className="text-gray-400">Results, accuracy metrics, and detailed proctoring violation logs are immediately available to the teacher.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 relative z-10 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">
              X
            </div>
            <span className="text-lg font-bold">XampXpress</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} XampXpress. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="text-gray-500 hover:text-white transition-colors text-sm">Login</Link>
            <Link to="/register" className="text-gray-500 hover:text-white transition-colors text-sm">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
