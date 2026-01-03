
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICONS, APP_NAME } from '../constants';
import { formatCurrency } from '../utils/dateUtils';
import { paymentService } from '../services/paymentService';
import { LogoMark } from '../components/Branding';
import { UserProfile } from '../types';

interface PaywallScreenProps {
  onUpgrade: () => void;
  currency?: string;
  profile: UserProfile | null;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ onUpgrade, currency = 'NGN', profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isYearly, setIsYearly] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fromApp = (location.state as any)?.fromApp;
    if (!fromApp) {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  const monthlyPrice = 1200; // NGN
  const yearlyPrice = 9600;  // NGN
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;

  const isAnonymous = profile?.isAnonymous ?? true;

  const handleSubscribeClick = () => {
    if (isAnonymous) {
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    
    paymentService.initializePaystack(
      profile?.email || '', 
      currentPrice, 
      currency,
      (reference) => {
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        onUpgrade();
        navigate('/', { replace: true });
        setIsProcessing(false);
      },
      () => {
        setIsProcessing(false);
      }
    );
  };

  const handleDismiss = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10 flex-1 flex flex-col px-8 py-12">
        <button 
          onClick={handleDismiss} 
          className="self-start w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-slate-300 mb-8 hover:text-white hover:bg-white/20 transition-all active:scale-90"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-2xl mb-6 shadow-indigo-500/20 rotate-6">
            {ICONS.CROWN}
          </div>
          <h1 className="text-3xl font-black text-center tracking-tight mb-2">Upgrade to PRO</h1>
          <p className="text-slate-400 text-center text-sm font-medium">Unlock professional-grade financial tracking</p>
        </div>

        <div className="space-y-4 mb-10">
          {[
            { icon: "fa-infinity", title: "Unlimited Tracking", desc: "No more limits on your financial obligations." },
            { icon: "fa-shield-check", title: "Strict Auditing", desc: "Enforce receipt and reference ID matching for every payment." },
            { icon: "fa-cloud-arrow-up", title: "Secure Cloud Backup", desc: "Sync your data safely across all your devices." }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/50 p-1.5 rounded-[24px] flex mb-6 border border-white/5">
          <button 
            onClick={() => setIsYearly(false)}
            className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all ${!isYearly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            MONTHLY
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all relative ${isYearly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            ANNUAL
            <span className="absolute -top-3 -right-1 bg-emerald-500 text-[8px] px-2 py-1 rounded-full text-white font-black shadow-lg">SAVE 33%</span>
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black">{formatCurrency(currentPrice, currency)}</span>
            <span className="text-slate-500 font-bold">{isYearly ? '/year' : '/mo'}</span>
          </div>
          <p className="text-slate-500 text-[10px] mt-3 font-bold uppercase tracking-widest">Secured by Paystack Inline</p>
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={handleSubscribeClick}
            disabled={isProcessing}
            className="w-full bg-white text-slate-900 py-5 rounded-[28px] font-black text-lg active:scale-95 transition-transform shadow-xl shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isAnonymous ? 'Sign In to Upgrade' : 'Pay with Paystack'
            )}
          </button>

          <button 
            onClick={handleDismiss}
            className="w-full text-slate-400 py-3 rounded-2xl font-bold text-sm hover:text-white transition-colors uppercase tracking-widest"
          >
            Maybe Later
          </button>
          
          {isAnonymous && (
            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
              Subscription requires a secure account
            </p>
          )}

          <div className="flex justify-center gap-6 pt-4">
            <button className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hover:text-slate-300">Privacy Policy</button>
            <button className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hover:text-slate-300">Terms of Use</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallScreen;
