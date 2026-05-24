import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, Briefcase, ArrowRight, Sparkles, Hexagon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const AuthPage = () => {
  const { login, register: registerUser, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const [loginData, setLoginData] = useState({ emailOrId: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (tokenResponse) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(tokenResponse.access_token, registerData.role);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Google authentication failed.';
      const details = err.response?.data?.details || '';
      setError(`${errorMsg} ${details}`);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Login Failed'),
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginData.emailOrId, loginData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerUser(registerData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    const newMode = !isLogin;
    setIsLogin(newMode);
    navigate(newMode ? '/login' : '/register', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#0a0a0f] text-white overflow-hidden relative">
      
      {/* 3D Animated Background Grid & Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Unified Container */}
      <div className="relative w-full max-w-[1000px] h-[750px] md:h-[650px] bg-[#161622]/90 backdrop-blur-xl rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col md:flex-row z-10">
        
        {/* MOBILE VIEW (Stack layout, only visible on small screens) */}
        <div className="md:hidden w-full h-full flex flex-col p-8 overflow-y-auto">
           <div className="text-center mb-8 mt-4">
             <Hexagon className="text-blue-500 mx-auto mb-2" size={40} />
             <h2 className="text-3xl font-bold">{isLogin ? 'Sign In' : 'Create Account'}</h2>
           </div>
           
           <button onClick={toggleMode} className="w-full py-3 mb-8 bg-white/5 border border-white/10 rounded-2xl text-blue-400 font-medium">
             {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
           </button>

           {/* We will just render the active form for mobile */}
           {isLogin ? (
             <form onSubmit={handleLogin} className="space-y-4">
               {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><User size={18} /></div>
                 <input type="text" value={loginData.emailOrId} onChange={(e) => setLoginData({...loginData, emailOrId: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="User ID or Email" required />
               </div>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><Lock size={18} /></div>
                 <input type="password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="Password" required />
               </div>
               <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-blue-600 rounded-2xl font-semibold text-white">{loading ? 'Authenticating...' : 'Sign In'}</button>
             </form>
           ) : (
             <form onSubmit={handleRegister} className="space-y-4">
               {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
               <div className="flex gap-2 p-1 bg-black/30 rounded-2xl">
                  <button type="button" onClick={() => setRegisterData({...registerData, role: 'student'})} className={`flex-1 py-2 rounded-xl text-sm font-medium ${registerData.role === 'student' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Student</button>
                  <button type="button" onClick={() => setRegisterData({...registerData, role: 'teacher'})} className={`flex-1 py-2 rounded-xl text-sm font-medium ${registerData.role === 'teacher' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Teacher</button>
               </div>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><User size={18} /></div>
                 <input type="text" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500" placeholder="Full Name" required />
               </div>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><Mail size={18} /></div>
                 <input type="email" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500" placeholder="Email Address" required />
               </div>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><Lock size={18} /></div>
                 <input type="password" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500" placeholder="Password" required minLength="6" />
               </div>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><Lock size={18} /></div>
                 <input type="password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500" placeholder="Confirm Password" required minLength="6" />
               </div>
               <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-purple-600 rounded-2xl font-semibold text-white">{loading ? 'Registering...' : 'Sign Up'}</button>
             </form>
           )}
        </div>

        {/* DESKTOP VIEW - Double Slider Layout */}
        <div className="hidden md:block w-full h-full relative">
          
          {/* LEFT PANEL: SIGN IN FORM */}
          <div className={`absolute top-0 left-0 w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700 ease-in-out z-10 ${isLogin ? 'translate-x-0 opacity-100 pointer-events-auto delay-300' : '-translate-x-20 opacity-0 pointer-events-none'}`}>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Hexagon className="text-blue-500" size={32} />
                <span className="text-2xl font-bold tracking-tight">XampXpress</span>
              </div>
              <h2 className="text-4xl font-bold mb-2">Sign In</h2>
              <p className="text-gray-400">Secure access to your educational portal.</p>
            </div>

            {error && !isLogin && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {error && isLogin && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 ml-1">User ID or Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={loginData.emailOrId}
                    onChange={(e) => setLoginData({...loginData, emailOrId: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder-gray-600"
                    placeholder="STU2023... or email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder-gray-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex justify-center items-center gap-2 group mt-8"
              >
                {loading ? 'Authenticating...' : 'Access Account'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="flex items-center gap-3 mt-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-sm font-medium text-gray-500">OR</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <button 
                type="button" 
                onClick={() => loginWithGoogle()}
                className="w-full mt-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-medium transition-all flex justify-center items-center gap-3 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: SIGN UP FORM */}
          <div className={`absolute top-0 right-0 w-1/2 h-full p-10 flex flex-col justify-center transition-all duration-700 ease-in-out z-10 ${isLogin ? 'translate-x-20 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto delay-300'}`}>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Hexagon className="text-purple-500" size={28} />
                <span className="text-xl font-bold tracking-tight">XampXpress</span>
              </div>
              <h2 className="text-3xl font-bold mb-1">Create Account</h2>
              <p className="text-sm text-gray-400">Join the next-gen exam platform.</p>
            </div>

            {error && !isLogin && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              
              <div className="flex gap-2 p-1 bg-black/30 rounded-xl mb-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setRegisterData({...registerData, role: 'student'})}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${registerData.role === 'student' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <GraduationCap size={16} /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterData({...registerData, role: 'teacher'})}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${registerData.role === 'teacher' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Briefcase size={16} /> Teacher
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors"><User size={18} /></div>
                <input type="text" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-white placeholder-gray-600 text-sm" placeholder="Full Name" required />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors"><Mail size={18} /></div>
                <input type="email" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-white placeholder-gray-600 text-sm" placeholder="Email Address" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors"><Lock size={18} /></div>
                  <input type="password" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-white placeholder-gray-600 text-sm" placeholder="Password" required minLength="6" />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors"><Lock size={18} /></div>
                  <input type="password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-white placeholder-gray-600 text-sm" placeholder="Confirm" required minLength="6" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex justify-center items-center gap-2 group mt-2"
              >
                {loading ? 'Registering...' : 'Sign Up Now'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="flex items-center gap-3 mt-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs font-medium text-gray-500">OR</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <button 
                type="button" 
                onClick={() => loginWithGoogle()}
                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex justify-center items-center gap-3 group text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
            </form>
          </div>

          {/* SLIDING OVERLAY */}
          <div 
            className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 z-50 transition-transform duration-700 ease-in-out flex items-center justify-center overflow-hidden
            ${isLogin ? 'translate-x-[100%] rounded-l-[50px] md:rounded-l-[100px]' : 'translate-x-0 rounded-r-[50px] md:rounded-r-[100px]'} shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20`}
          >
             {/* Glowing inner effect */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
             <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>

             {/* Overlay Content Container (Moves opposite to overlay to create fixed/parallax feel) */}
             <div className={`w-[200%] h-full absolute left-0 top-0 flex transition-transform duration-700 ease-in-out ${isLogin ? '-translate-x-1/2' : 'translate-x-0'}`}>
                
                {/* Overlay Left Side (Visible when Register form is shown) */}
                <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                    <User className="text-blue-200" size={40} />
                  </div>
                  <h2 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">Welcome<br/>Back!</h2>
                  <p className="text-purple-100 mb-10 text-lg font-medium leading-relaxed max-w-xs">
                    Log in to continue your educational journey with us.
                  </p>
                  <button
                    onClick={toggleMode}
                    className="px-12 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-white hover:text-indigo-700 transition-all"
                  >
                    Sign In Instead
                  </button>
                </div>

                {/* Overlay Right Side (Visible when Login form is shown) */}
                <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                    <Sparkles className="text-purple-200" size={40} />
                  </div>
                  <h2 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">New<br/>Student?</h2>
                  <p className="text-blue-100 mb-10 text-lg font-medium leading-relaxed max-w-xs">
                    Discover the smartest way to manage and take your exams.
                  </p>
                  <button
                    onClick={toggleMode}
                    className="px-12 py-4 bg-white text-indigo-700 rounded-full font-bold shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] transition-all"
                  >
                    Register Now
                  </button>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
