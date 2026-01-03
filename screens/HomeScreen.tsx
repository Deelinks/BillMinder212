
import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bill, BillStatus, UserProfile, Entitlement } from '../types';
import { getStatus } from '../utils/dateUtils';
import BillCard from '../components/BillCard';
import { ICONS, FREE_BILL_LIMIT } from '../constants';

interface HomeScreenProps {
  bills: Bill[];
  profile: UserProfile | null;
  onPay: (id: string) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ bills, profile, onPay, onDelete, onLogout }) => {
  const navigate = useNavigate();
  const isPro = profile?.entitlement === Entitlement.PRO;
  const isAnonymous = profile?.isAnonymous ?? true;
  
  const stats = useMemo(() => {
    const active = bills.filter(b => b.status !== BillStatus.PAID);
    const overdue = active.filter(b => getStatus(b.dueDate, b.status) === BillStatus.OVERDUE).length;
    const today = active.filter(b => getStatus(b.dueDate, b.status) === BillStatus.DUE_TODAY).length;
    const upcoming = active.length - overdue - today;
    
    return { overdue, today, upcoming, total: active.length };
  }, [bills]);

  const recentBills = useMemo(() => {
    return bills
      .filter(b => b.status !== BillStatus.PAID)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [bills]);

  return (
    <div className="px-6 py-6 animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm font-medium">Hello, {profile?.displayName || 'User'}</p>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            {isAnonymous ? (
              <button 
                onClick={() => navigate('/auth')}
                className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Sign In
              </button>
            ) : (
              <button 
                onClick={onLogout}
                className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
        {!isPro && (
          <button 
            onClick={() => navigate('/paywall', { state: { fromApp: true } })}
            className="bg-amber-100 text-amber-700 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm active:scale-90 transition-transform"
          >
            {ICONS.CROWN}
          </button>
        )}
      </header>

      {/* Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="mb-8 p-6 bg-slate-900 rounded-[32px] shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center text-sm shadow-lg shadow-amber-400/20">
                {ICONS.CROWN}
              </div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Upgrade to Pro</span>
            </div>
            <h3 className="text-white text-lg font-black tracking-tight mb-2">Unlock Unlimited Tracking</h3>
            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
              Track more than {FREE_BILL_LIMIT} bills, enable strict audit protocols, and secure your history in the cloud.
            </p>
            <button 
              onClick={() => navigate('/paywall', { state: { fromApp: true } })}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-indigo-900/40"
            >
              Get Full Access
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-rose-500 rounded-[32px] p-5 text-white shadow-xl shadow-rose-100">
          <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-1">Overdue</p>
          <div className="text-3xl font-black">{stats.overdue}</div>
        </div>
        <div className="bg-amber-500 rounded-[32px] p-5 text-white shadow-xl shadow-amber-100">
          <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Due Today</p>
          <div className="text-3xl font-black">{stats.today}</div>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority Bills</h2>
          <Link to="/bills" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">View All</Link>
        </div>

        <div className="space-y-3">
          {recentBills.map(bill => (
            <BillCard 
              key={bill.id} 
              bill={bill} 
              onPay={onPay} 
              onDelete={onDelete}
              currency={profile?.currency}
            />
          ))}

          {recentBills.length === 0 && (
            <div className="py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-8">
              <div className="text-slate-200 text-4xl mb-4">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">All caught up!</p>
              <button 
                onClick={() => navigate('/add')}
                className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest"
              >
                + Track New Bill
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Pro Features Teaser */}
      {isPro && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 text-xl shadow-sm">
            <i className="fa-solid fa-shield-check"></i>
          </div>
          <div>
            <h4 className="text-indigo-900 font-black text-sm">Strict Audit Enabled</h4>
            <p className="text-indigo-600 text-[10px] font-medium leading-tight mt-1">Every payment is now verified with a reference ID for your protection.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
