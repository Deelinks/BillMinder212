
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS, APP_NAME } from '../constants';
import { supabase } from '../services/supabase';
import Branding from '../components/Branding';

interface AuthScreenProps {
  onAuthComplete: (userData: { email: string; name: string; phone?: string; isAnonymous: boolean; uid: string }) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      localStorage.setItem('billminder_remember_me', rememberMe.toString());

      if (isLogin) {
        // Fix: Compatibility for Supabase v1/v2 - use signInWithPassword if available and destructure properly
        const signInMethod = (supabase.auth as any).signInWithPassword || (supabase.auth as any).signIn;
        const response = await signInMethod.call(supabase.auth, {
          email: formData.email,
          password: formData.password,
        });
        
        const { data, error: authError } = response;
        const finalUser = data?.user;
        
        if (authError) throw authError;
        if (finalUser) {
          onAuthComplete({
            uid: finalUser.id,
            email: finalUser.email!,
            name: finalUser.user_metadata?.full_name || finalUser.email!.split('@')[0],
            isAnonymous: false
          });
        }
      } else {
        // Fix: Use Supabase v2 signUp signature with single object and options
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              phone: formData.phone
            }
          }
        });

        const finalUser = data?.user;
        if (authError) throw authError;
        if (finalUser) {
          onAuthComplete({
            uid: finalUser.id,
            email: finalUser.email!,
            name: formData.name,
            phone: formData.phone,
            isAnonymous: false
          });
        }
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      localStorage.setItem('billminder_remember_me', 'true');
      // Compatibility for Supabase v1/v2
      const signInMethod = (supabase.auth as any).signInWithOAuth || (supabase.auth as any).signIn;
      const { error } = await signInMethod.call(supabase.auth, {
        provider: 'google'
      }, {
        redirectTo: window.location.origin
      } as any);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGuestMode = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-8 py-10 animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8 mt-4">
        <div className="mb-6 transform hover:rotate-3 transition-transform duration-300">
          <Branding size="lg" showText={false} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Bill<span className="text-indigo-600">Minder</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium text-center px-4">
          {isLogin 
            ? 'Sign in to sync your obligations across all your devices' 
            : 'Join BillMinder to secure your financial history in the cloud'}
        </p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => { setIsLogin(true); setError(null); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sign In
        </button>
        <button 
          onClick={() => { setIsLogin(false); setError(null); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sign Up
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
          <i className="fa-solid fa-circle-exclamation mr-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="animate-in slide-in-from-left-4 duration-300">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                {ICONS.USER}
              </span>
              <input 
                type="text" 
                required={!isLogin}
                placeholder="Full Name"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none text-slate-800 transition-all font-medium placeholder:text-slate-400"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
        )}

        {!isLogin && (
          <div className="animate-in slide-in-from-left-4 duration-300 delay-75">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                {ICONS.PHONE}
              </span>
              <input 
                type="tel" 
                placeholder="Phone Number"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none text-slate-800 transition-all font-medium placeholder:text-slate-400"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        )}

        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <i className="fa-solid fa-envelope"></i>
          </span>
          <input 
            type="email" 
            required
            placeholder="Email Address"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none text-slate-800 transition-all font-medium placeholder:text-slate-400"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {ICONS.LOCK}
          </span>
          <input 
            type={showPassword ? "text" : "password"} 
            required
            placeholder="Password"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 pr-12 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none text-slate-800 transition-all font-medium placeholder:text-slate-400"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
          >
            {showPassword ? ICONS.EYE_SLASH : ICONS.EYE}
          </button>
        </div>

        <div className="flex items-center justify-between px-1 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <div className="w-5 h-5 bg-slate-100 border-2 border-slate-200 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all"></div>
              <i className="fa-solid fa-check absolute text-[10px] text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"></i>
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Keep me signed in</span>
          </label>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className={`w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 active:scale-[0.98] hover:bg-indigo-700 transition-all mt-4 tracking-tight flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative flex items-center justify-center mb-8">
          <div className="border-t border-slate-100 w-full absolute"></div>
          <span className="bg-white px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative">Or connect with</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="group w-full border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">{ICONS.GOOGLE}</span>
          <span className="tracking-tight">Sign in with Google</span>
        </button>
      </div>

      {/* WHY REGISTER SECTION */}
      <div className="mt-12 p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-sparkles text-indigo-500"></i> Why create an account?
        </h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-1 text-indigo-500 text-[10px]"><i className="fa-solid fa-cloud-arrow-up"></i></div>
            <p className="text-[11px] text-indigo-800 leading-tight font-medium"><strong>Cloud Protection:</strong> Your records survive if you lose your phone or clear browser history.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 text-indigo-500 text-[10px]"><i className="fa-solid fa-mobile-screen-button"></i></div>
            <p className="text-[11px] text-indigo-800 leading-tight font-medium"><strong>Multi-Device:</strong> Add bills on your laptop and track them on your mobile instantly.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 text-indigo-500 text-[10px]"><i className="fa-solid fa-shield-check"></i></div>
            <p className="text-[11px] text-indigo-800 leading-tight font-medium"><strong>Upgrade Eligible:</strong> Only registered users can access Pro features and Advanced Auditing.</p>
          </li>
        </ul>
      </div>

      <div className="mt-10 mb-6 text-center">
        <button 
          onClick={handleGuestMode}
          className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] py-2"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
