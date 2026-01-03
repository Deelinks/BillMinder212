import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Entitlement } from '../types';
import { ICONS } from '../constants';
// Standardized on PascalCase StorageService to resolve casing conflict
import { storageService } from '../services/StorageService';
import { adminService } from '../services/adminService';
import Branding, { LogoMark } from '../components/Branding';

interface SettingsScreenProps {
  profile: UserProfile | null;
  onLogout: () => void;
  onUpdateCurrency: (currency: string) => void;
  onShowWelcome: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ profile, onLogout, onUpdateCurrency, onShowWelcome }) => {
  const navigate = useNavigate();
  const [restoring, setRestoring] = useState(false);
  const [isPaymentValidationEnabled, setIsPaymentValidationEnabled] = useState(true);
  
  // Notification States
  const [notifSettings, setNotifSettings] = useState({
    enabled: true,
    sound: 'Standard Chime',
    vibration: true
  });

  const isPro = profile?.entitlement === Entitlement.PRO;
  const isAdmin = adminService.checkAccess(profile?.email);

  useEffect(() => {
    const config = storageService.getSecurityConfig();
    setIsPaymentValidationEnabled(config.paymentValidationEnabled);
    
    const savedNotifs = storageService.getNotificationSettings();
    setNotifSettings(savedNotifs);
  }, []);

  const togglePaymentValidation = () => {
    if (!isPro) {
      navigate('/paywall', { state: { fromApp: true } });
      return;
    }
    const newValue = !isPaymentValidationEnabled;
    setIsPaymentValidationEnabled(newValue);
    const config = storageService.getSecurityConfig();
    storageService.saveSecurityConfig({ ...config, paymentValidationEnabled: newValue });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleNotifToggle = (key: keyof typeof notifSettings) => {
    if (key !== 'enabled' && !isPro) {
      navigate('/paywall', { state: { fromApp: true } });
      return;
    }
    const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(newSettings);
    storageService.saveNotificationSettings(newSettings);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSoundChange = (sound: string) => {
    if (!isPro) {
      navigate('/paywall', { state: { fromApp: true } });
      return;
    }
    const newSettings = { ...notifSettings, sound };
    setNotifSettings(newSettings);
    storageService.saveNotificationSettings(newSettings);
  };

  const currencies = [
    { code: 'NGN', name: 'Naira (₦)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
  ];

  const notificationSounds = [
    'Standard Chime',
    'Professional Alert',
    'Modern Pulse',
    'Minimal Tick',
    'Urgent Alarm'
  ];

  const handleRestore = () => {
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      alert("No active subscriptions found for this account.");
    }, 2000);
  };

  return (
    <div className="px-6 py-6 relative pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

      {/* Admin Quick Access */}
      {isAdmin && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Administration</label>
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-6 bg-slate-900 text-white rounded-[32px] shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all group overflow-hidden relative"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
                <i className="fa-solid fa-terminal"></i>
              </div>
              <div className="text-left">
                <div className="font-black text-sm uppercase tracking-tight">Command Center</div>
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">System Management</div>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-indigo-400 group-hover:translate-x-1 transition-transform relative z-10"></i>
          </button>
        </div>
      )}

      {/* PRO Upgrade CTA for Settings */}
      {!isPro && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Premium Access</label>
          <button 
            onClick={() => navigate('/paywall', { state: { fromApp: true } })}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-[32px] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-lg">
                {ICONS.CROWN}
              </div>
              <div className="text-left">
                <div className="font-black text-sm uppercase tracking-tight">Upgrade to Pro</div>
                <div className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">Unlock Advanced Tools</div>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-white/50 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      )}

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account</label>
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-black">
              {profile?.displayName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'B'}
            </div>
            <div>
              <div className="font-bold text-slate-800">{profile?.isAnonymous ? 'Guest User' : (profile?.displayName || profile?.email || 'Authenticated')}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                {isPro ? (
                  <span className="text-yellow-600 font-bold flex items-center gap-1">
                    {ICONS.CROWN} Pro Subscriber
                  </span>
                ) : (
                  <span className="text-slate-400">Standard Plan</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {profile?.isAnonymous ? (
              <button 
                onClick={() => navigate('/auth')}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                {ICONS.GOOGLE} <span>Sign In to Sync</span>
              </button>
            ) : (
              <button 
                onClick={onLogout}
                className="w-full text-slate-500 py-3 rounded-2xl font-bold text-sm border border-slate-100 hover:bg-slate-50"
              >
                Sign Out
              </button>
            )}

            {!isPro && (
              <button 
                onClick={handleRestore}
                disabled={restoring}
                className="w-full text-indigo-600 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border border-indigo-50 hover:bg-indigo-50/50 flex items-center justify-center gap-2"
              >
                {restoring ? <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div> : <i className="fa-solid fa-rotate-left"></i>}
                Restore Purchases
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Notifications</label>
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <span className="text-indigo-600 text-lg">{ICONS.BELL}</span>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold text-sm">Push Reminders</span>
                <span className="text-[10px] text-slate-400 font-medium">Get notified before bills are due</span>
              </div>
            </div>
            <button 
              onClick={() => handleNotifToggle('enabled')}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifSettings.enabled ? 'bg-indigo-600 shadow-inner' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${notifSettings.enabled ? 'left-7' : 'left-1'}`} ></div>
            </button>
          </div>

          <div className={`flex items-center justify-between p-5 transition-opacity ${!isPro ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`text-lg ${isPro ? 'text-indigo-600' : 'text-slate-400'}`}>
                <i className="fa-solid fa-volume-high"></i>
              </span>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold text-sm">Reminder Sound</span>
                <span className="text-[10px] text-slate-400 font-medium">Custom alert tones (Pro only)</span>
              </div>
            </div>
            <select 
              disabled={!isPro}
              value={notifSettings.sound}
              onChange={(e) => handleSoundChange(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-indigo-600 focus:ring-0 outline-none appearance-none text-right cursor-pointer"
            >
              {notificationSounds.map(sound => (
                <option key={sound} value={sound}>{sound}</option>
              ))}
            </select>
          </div>

          <div className={`flex items-center justify-between p-5 transition-opacity ${!isPro ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`text-lg ${isPro ? 'text-indigo-600' : 'text-slate-400'}`}>
                <i className="fa-solid fa-vibration"></i>
              </span>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold text-sm">Reminder Vibration</span>
                <span className="text-[10px] text-slate-400 font-medium">Haptic feedback (Pro only)</span>
              </div>
            </div>
            <button 
              onClick={() => handleNotifToggle('vibration')}
              disabled={!isPro}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifSettings.vibration && isPro ? 'bg-indigo-600 shadow-inner' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${notifSettings.vibration && isPro ? 'left-7' : 'left-1'}`} ></div>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
          Pro Features
          {!isPro && <span className="text-amber-500 text-[10px] font-black tracking-widest">{ICONS.CROWN} PRO</span>}
        </label>
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <div className={`flex items-center justify-between p-5 transition-opacity ${!isPro ? 'opacity-60' : ''}`}>
             <div className="flex items-center gap-3">
              <span className={`text-lg ${isPro ? 'text-indigo-600' : 'text-slate-400'}`}>
                <i className="fa-solid fa-shield-check"></i>
              </span>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold text-sm">Strict Audit Protocol</span>
                <span className="text-[10px] text-slate-400 font-medium">Require verified receipt matches</span>
              </div>
            </div>
            <button 
              onClick={togglePaymentValidation}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isPaymentValidationEnabled && isPro ? 'bg-indigo-600 shadow-inner' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${isPaymentValidationEnabled && isPro ? 'left-7' : 'left-1'}`} ></div>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preferences</label>
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-[28px] border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Currency</label>
            <div className="relative">
              <select 
                value={profile?.currency || 'NGN'}
                onChange={(e) => onUpdateCurrency(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-10"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Support & Legal</label>
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <button onClick={onShowWelcome} className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-indigo-600 text-lg"><i className="fa-solid fa-circle-info"></i></span>
              <span className="text-slate-700 font-bold text-sm">App Walkthrough</span>
            </div>
            {ICONS.CHEVRON_RIGHT}
          </button>
          
          <button onClick={() => navigate('/help')} className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-indigo-600 text-lg">{ICONS.QUESTION}</span>
              <span className="text-slate-700 font-bold text-sm">Help Center & FAQ</span>
            </div>
            {ICONS.CHEVRON_RIGHT}
          </button>

          <button onClick={() => navigate('/privacy')} className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-lg"><i className="fa-solid fa-shield-halved"></i></span>
              <span className="text-slate-700 font-bold text-sm">Privacy Policy</span>
            </div>
            {ICONS.CHEVRON_RIGHT}
          </button>

          <button onClick={() => navigate('/terms')} className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-lg"><i className="fa-solid fa-file-contract"></i></span>
              <span className="text-slate-700 font-bold text-sm">Terms of Service</span>
            </div>
            {ICONS.CHEVRON_RIGHT}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center pb-12">
        <div className="mb-3">
          <LogoMark className="w-10 h-10 grayscale opacity-30" />
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">BillMinder v1.1.0-PROD</div>
        <div className="text-[9px] text-slate-300 mt-1 uppercase">Advanced Financial Engineering</div>
      </div>
    </div>
  );
};

export default SettingsScreen;