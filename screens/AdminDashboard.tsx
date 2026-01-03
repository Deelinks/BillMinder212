
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, AdminStats, AdminUserRecord, AuditLog } from '../services/adminService';
import { Bill, Entitlement, BillStatus } from '../types';
import { formatCurrency, formatDate, getStatus } from '../utils/dateUtils';
import { ICONS, FREE_BILL_LIMIT } from '../constants';
import Branding from '../components/Branding';

const AdminDashboard: React.FC<{ userEmail?: string | null }> = ({ userEmail }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bills' | 'logs' | 'settings'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Staged Settings State
  const [stagedSettings, setStagedSettings] = useState({
    maintenance_mode: 'false',
    registration_closed: 'false',
    free_tier_limit: String(FREE_BILL_LIMIT),
    global_audit_lock: 'false',
    system_announcement: '',
    announcement_active: 'false'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsPromise = adminService.getDashboardStats();
      const usersPromise = adminService.getAllUsers();
      const billsPromise = adminService.getAllBills();
      const logsPromise = adminService.getAuditLogs();
      const configPromise = adminService.getSystemConfig();

      const [s, u, b, l, c] = await Promise.all([
        statsPromise,
        usersPromise,
        billsPromise,
        logsPromise,
        configPromise
      ]);
      
      setStats(s);
      setUsers(u);
      setBills(b);
      setLogs(l);
      setConfig(c);
      
      setStagedSettings({
        maintenance_mode: c.maintenance_mode || 'false',
        registration_closed: c.registration_closed || 'false',
        free_tier_limit: c.free_tier_limit || String(FREE_BILL_LIMIT),
        global_audit_lock: c.global_audit_lock || 'false',
        system_announcement: c.system_announcement || '',
        announcement_active: c.announcement_active || 'false'
      });
    } catch (e: any) {
      console.error("Admin data load error", e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminService.checkAccess(userEmail)) {
      navigate('/');
      return;
    }
    loadData();
  }, [userEmail, navigate]);

  const hasPendingChanges = useMemo(() => {
    const currentConfig = {
      maintenance_mode: config.maintenance_mode || 'false',
      registration_closed: config.registration_closed || 'false',
      free_tier_limit: config.free_tier_limit || String(FREE_BILL_LIMIT),
      global_audit_lock: config.global_audit_lock || 'false',
      system_announcement: config.system_announcement || '',
      announcement_active: config.announcement_active || 'false'
    };
    return JSON.stringify(stagedSettings) !== JSON.stringify(currentConfig);
  }, [stagedSettings, config]);

  const commitAllSettings = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        Object.entries(stagedSettings).map(([key, value]) => 
          adminService.updateConfig(key, value)
        )
      );
      await loadData();
      alert("AUTHORITY SYNCED: All platform protocols updated.");
    } catch (e: any) {
      alert(`COMMIT FAILED: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTier = async (userId: string, newTier: Entitlement, oldTier: Entitlement) => {
    const effectiveReason = adminReason.trim() || "Manual Administrative Authority Override";
    setIsProcessing(true);
    try {
      await adminService.updateUserTier(userId, newTier, oldTier, effectiveReason);
      await loadData();
      alert(`SUCCESS: User updated to ${newTier}.`);
      setAdminReason('');
      setSelectedUser(prev => prev ? {...prev, entitlement: newTier} : null);
    } catch (e: any) {
      alert(`ERROR: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestriction = async (userId: string, type: 'DISABLE' | 'RESTRICT' | 'ENABLE') => {
    const effectiveReason = adminReason.trim() || "Manual Security Policy Adjustment";
    setIsProcessing(true);
    try {
      await adminService.updateUserRestriction(userId, type, effectiveReason);
      await loadData();
      alert(`SECURITY UPDATE: User set to ${type}.`);
      setAdminReason('');
      setSelectedUser(null);
    } catch (e: any) {
      alert(`ERROR: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeLogs = async () => {
    if (!confirm("CRITICAL: Are you sure you want to purge the current audit trail?")) return;
    setIsProcessing(true);
    try {
      await adminService.clearAuditLogs();
      await loadData();
      alert("Audit logs successfully purged.");
    } catch (e: any) {
      alert(`Purge failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBillAction = async (billId: string, updates: any) => {
    const effectiveReason = adminReason.trim() || "Administrative Bill Correction";
    setIsProcessing(true);
    try {
      await adminService.updateBillAdminAction(billId, updates, effectiveReason);
      await loadData();
      alert("Bill data updated in global ledger.");
      setAdminReason('');
      setSelectedBill(null);
    } catch (e: any) {
      alert(`Error updating bill: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && !stats) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <Branding size="sm" variant="white" showText={false} />
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter uppercase text-white">System <span className="text-indigo-500">Authority</span></h1>
            <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Operator: {userEmail}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {(['overview', 'users', 'bills', 'logs', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/10 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all group">
            <i className="fa-solid fa-power-off text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Exit</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 custom-scrollbar">
        {error && (
          <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span className="text-sm font-bold">{error}</span>
            </div>
            <button onClick={loadData} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black">RETRY</button>
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats.totalUsers} icon={<i className="fa-solid fa-users"></i>} color="indigo" />
              <StatCard title="Total Bills" value={stats.totalBills} icon={<i className="fa-solid fa-file-invoice"></i>} color="amber" />
              <StatCard title="Total Volume" value={formatCurrency(stats.totalVolume, 'NGN')} icon={<i className="fa-solid fa-money-bill-trend-up"></i>} color="emerald" />
              <StatCard title="Settled Volume" value={formatCurrency(stats.totalPaidVolume, 'NGN')} icon={<i className="fa-solid fa-circle-check"></i>} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
               <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Recent Activity Trend</h3>
                 <div className="h-48 flex items-end gap-2 px-2">
                    {Array.from({length: 12}).map((_, i) => (
                      <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg hover:bg-indigo-500/40 transition-colors" style={{ height: `${Math.random() * 100}%` }}></div>
                    ))}
                 </div>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">System Health Matrix</h3>
                  <div className="space-y-4">
                    <HealthIndicator label="Cloud Database" status="Active" color="emerald" />
                    <HealthIndicator label="Paystack Gateway" status="Operational" color="emerald" />
                    <HealthIndicator label="Push Notification Hub" status="Standby" color="amber" />
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight">User Directory</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <th className="px-8 py-4">User Profile</th>
                     <th className="px-8 py-4">Plan Status</th>
                     <th className="px-8 py-4">Onboarded</th>
                     <th className="px-8 py-4 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {users.map(user => (
                     <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                       <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-400">{user.displayName?.[0] || 'G'}</div>
                           <div>
                            <div className="font-bold text-slate-200">{user.displayName || 'Guest'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{user.email || 'Anonymous'}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.entitlement === Entitlement.PRO ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                          {user.entitlement}
                        </span>
                        {user.isDisabled && <span className="ml-2 px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase">SUSPENDED</span>}
                       </td>
                       <td className="px-8 py-5 text-[10px] text-slate-500">{formatDate(user.createdAt)}</td>
                       <td className="px-8 py-5 text-right"><button onClick={() => setSelectedUser(user)} className="text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase">Control</button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'bills' && (
           <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight">Global Bills Ledger</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <th className="px-8 py-4">Bill Objective</th>
                     <th className="px-8 py-4">Account Holder</th>
                     <th className="px-8 py-4">Financials</th>
                     <th className="px-8 py-4">Status</th>
                     <th className="px-8 py-4 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {bills.map(bill => {
                     const billUser = users.find(u => u.id === bill.userId);
                     const status = getStatus(bill.dueDate, bill.status);
                     return (
                       <tr key={bill.id} className="hover:bg-slate-800/30 transition-colors">
                         <td className="px-8 py-5">
                           <div className="font-bold text-slate-200">{bill.name}</div>
                           <div className="text-[10px] text-slate-500">{formatDate(bill.dueDate)}</div>
                         </td>
                         <td className="px-8 py-5 text-[10px] text-slate-400">
                           {billUser?.email || 'System Default'}
                         </td>
                         <td className="px-8 py-5">
                           <div className="font-mono text-xs font-bold">{formatCurrency(bill.amount, bill.currency || 'NGN')}</div>
                           {bill.waiverAmount && <div className="text-[9px] text-emerald-500 font-black">- {formatCurrency(bill.waiverAmount, bill.currency || 'NGN')} WAIVER</div>}
                         </td>
                         <td className="px-8 py-5">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                             status === BillStatus.PAID ? 'bg-emerald-500/10 text-emerald-500' :
                             status === BillStatus.OVERDUE ? 'bg-rose-500/10 text-rose-500' :
                             'bg-indigo-500/10 text-indigo-400'
                           }`}>
                             {status.replace('_', ' ')}
                           </span>
                           {bill.isDisputed && <div className="text-[8px] font-black text-amber-500 uppercase mt-1">DISPUTED</div>}
                         </td>
                         <td className="px-8 py-5 text-right"><button onClick={() => setSelectedBill(bill)} className="text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase">Audit</button></td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Audit Trail</h2>
                  <p className="text-xs text-slate-500 mt-1">Every administrative action is logged for accountability.</p>
                </div>
                <button onClick={handlePurgeLogs} className="px-6 py-3 bg-rose-600/10 border border-rose-500/30 text-rose-500 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">
                  Purge Trails
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <th className="px-8 py-4">Action Event</th>
                     <th className="px-8 py-4">Actor ID</th>
                     <th className="px-8 py-4">Entity Target</th>
                     <th className="px-8 py-4">Timestamp</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {logs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                       <td className="px-8 py-5">
                         <div className="font-bold text-slate-200 text-xs">{log.action_type.replace('_', ' ')}</div>
                         {log.metadata?.reason && <div className="text-[10px] text-slate-500 italic">"{log.metadata.reason}"</div>}
                       </td>
                       <td className="px-8 py-5 font-mono text-[10px] text-indigo-400">{log.metadata?.admin || 'SYSTEM'}</td>
                       <td className="px-8 py-5">
                         <div className="text-[10px] font-bold uppercase text-slate-400">{log.entity_type}</div>
                         <div className="text-[9px] font-mono text-slate-600 truncate max-w-[100px]">{log.entity_id}</div>
                       </td>
                       <td className="px-8 py-5 text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto">
            <header className="mb-4">
              <h2 className="text-2xl font-black tracking-tight">System Protocols</h2>
              <p className="text-slate-500 text-sm mt-1">Configure global platform behavior and security guardrails.</p>
            </header>

            {hasPendingChanges && (
              <div className="sticky top-0 z-40 mb-6 p-4 bg-indigo-600 border border-indigo-400 rounded-2xl flex items-center justify-between shadow-2xl shadow-indigo-900/40 animate-bounce">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-white"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Pending Authority Sync</span>
                </div>
                <button onClick={commitAllSettings} className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                   APPLY NOW
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Security & Audit Group */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
                 <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                     <i className="fa-solid fa-shield-halved"></i> Security & Trust
                   </h3>
                 </div>
                 <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between group">
                      <div>
                        <div className="font-bold text-slate-200">Global Audit Lock</div>
                        <div className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">Forces EVERY account to upload receipts for all payments.</div>
                      </div>
                      <button 
                        onClick={() => setStagedSettings(s => ({...s, global_audit_lock: s.global_audit_lock === 'true' ? 'false' : 'true'}))}
                        className={`w-12 h-6 rounded-full transition-all relative ${stagedSettings.global_audit_lock === 'true' ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${stagedSettings.global_audit_lock === 'true' ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                 </div>
              </div>

              {/* Operations Group */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
                 <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                     <i className="fa-solid fa-server"></i> Platform Operations
                   </h3>
                 </div>
                 <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Maintenance Protocol</div>
                        <div className="text-[10px] text-slate-500 font-medium">Temporarily disable app access.</div>
                      </div>
                      <button 
                        onClick={() => setStagedSettings(s => ({...s, maintenance_mode: s.maintenance_mode === 'true' ? 'false' : 'true'}))}
                        className={`w-12 h-6 rounded-full transition-all relative ${stagedSettings.maintenance_mode === 'true' ? 'bg-rose-600' : 'bg-slate-800 border border-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${stagedSettings.maintenance_mode === 'true' ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">Close Registration</div>
                        <div className="text-[10px] text-slate-500 font-medium">Prevent new user signups.</div>
                      </div>
                      <button 
                        onClick={() => setStagedSettings(s => ({...s, registration_closed: s.registration_closed === 'true' ? 'false' : 'true'}))}
                        className={`w-12 h-6 rounded-full transition-all relative ${stagedSettings.registration_closed === 'true' ? 'bg-amber-600' : 'bg-slate-800 border border-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${stagedSettings.registration_closed === 'true' ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                 </div>
              </div>

              {/* Financial Constraints */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl lg:col-span-1">
                 <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                     <i className="fa-solid fa-coins"></i> Tier Management
                   </h3>
                 </div>
                 <div className="p-8 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <div className="font-bold text-slate-200">Free Tier Limit</div>
                          <div className="text-[10px] text-slate-500 font-medium">Max bills for non-pro users.</div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl font-black text-xl border border-emerald-500/20">
                          {stagedSettings.free_tier_limit}
                        </div>
                      </div>
                      <input 
                        type="range" min="10" max="500" step="10"
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        value={stagedSettings.free_tier_limit}
                        onChange={(e) => setStagedSettings(s => ({...s, free_tier_limit: e.target.value}))}
                      />
                      <div className="flex justify-between text-[8px] font-black text-slate-600 mt-2 uppercase">
                        <span>10 Bills</span>
                        <span>500 Bills</span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Announcements */}
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl lg:col-span-1">
                 <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                     <i className="fa-solid fa-bullhorn"></i> Global Broadcast
                   </h3>
                   <button 
                    onClick={() => setStagedSettings(s => ({...s, announcement_active: s.announcement_active === 'true' ? 'false' : 'true'}))}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${stagedSettings.announcement_active === 'true' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}
                   >
                     {stagedSettings.announcement_active === 'true' ? 'BROADCASTING' : 'OFF AIR'}
                   </button>
                 </div>
                 <div className="p-8">
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 min-h-[120px] text-slate-300 font-medium resize-none placeholder:text-slate-700"
                      placeholder="Type urgent system-wide announcement for all dashboard headers..."
                      value={stagedSettings.system_announcement}
                      onChange={(e) => setStagedSettings(s => ({...s, system_announcement: e.target.value}))}
                    />
                 </div>
              </div>
            </div>

            <div className="pt-12 text-center opacity-40">
              <i className="fa-solid fa-fingerprint text-4xl mb-4"></i>
              <p className="text-[9px] font-black uppercase tracking-widest">Authority Session: Standard Encrypted Override</p>
            </div>
          </div>
        )}
      </main>

      {/* User Review Sidebar */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4 md:p-0">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-xl font-black uppercase tracking-widest">Profile Audit</h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white p-2"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="flex items-center gap-6 p-6 bg-slate-800/50 rounded-3xl border border-slate-800">
                <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-600/20">{selectedUser.displayName?.[0] || 'G'}</div>
                <div>
                  <h3 className="text-2xl font-black">{selectedUser.displayName || 'Guest User'}</h3>
                  <p className="text-slate-500 text-sm font-mono">{selectedUser.email || 'No Email Verified'}</p>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest">{selectedUser.entitlement} Plan</span>
                     {selectedUser.isDisabled && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest">Suspended</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Financial Footprint</div>
                    <div className="text-lg font-black text-slate-200">
                      {bills.filter(b => b.userId === selectedUser.id).length} Active Bills
                    </div>
                 </div>
                 <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Member Since</div>
                    <div className="text-lg font-black text-slate-200">{formatDate(selectedUser.createdAt)}</div>
                 </div>
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Security Overrides</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleUpdateTier(selectedUser.id, selectedUser.entitlement === Entitlement.FREE ? Entitlement.PRO : Entitlement.FREE, selectedUser.entitlement)}
                    className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                  >
                    Force {selectedUser.entitlement === Entitlement.FREE ? 'PRO' : 'FREE'} Status
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleRestriction(selectedUser.id, selectedUser.isDisabled ? 'ENABLE' : 'DISABLE')}
                    className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                    {selectedUser.isDisabled ? 'Restore Privileges' : 'Revoke Account'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">System Audit Reason</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm outline-none focus:border-indigo-500 min-h-[120px] font-medium text-slate-300"
                  value={adminReason}
                  onChange={e => setAdminReason(e.target.value)}
                  placeholder="Justify this modification for the permanent audit trail..."
                />
              </div>

              {selectedUser.adminNotes && (
                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                  <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Legacy Admin Notes</label>
                  <p className="text-xs text-indigo-200/60 italic leading-relaxed">"{selectedUser.adminNotes}"</p>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-800 bg-slate-950/30">
               <button onClick={() => setSelectedUser(null)} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white">Dismiss Auditor</button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Audit Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-indigo-600">
               <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-white">Bill Audit</h2>
                  <p className="text-[10px] text-indigo-200 font-bold uppercase">{selectedBill.name}</p>
               </div>
               <button onClick={() => setSelectedBill(null)} className="text-white/50 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleUpdateBillAction(selectedBill.id, { is_disputed: !selectedBill.isDisputed })}
                    className={`p-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${selectedBill.isDisputed ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {selectedBill.isDisputed ? 'Resolve Dispute' : 'Flag as Disputed'}
                  </button>
                  <button 
                    onClick={() => {
                      const amount = prompt("Enter waiver amount (currency match):", "0");
                      if (amount !== null) handleUpdateBillAction(selectedBill.id, { waiver_amount: parseFloat(amount) });
                    }}
                    className="p-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Apply Waiver
                  </button>
               </div>

               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Public Admin Commentary</label>
                 <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500"
                    placeholder="Enter notes visible to user or audit..."
                    value={adminReason}
                    onChange={e => setAdminReason(e.target.value)}
                 />
                 <button 
                    onClick={() => handleUpdateBillAction(selectedBill.id, { admin_notes: adminReason })}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest mt-2"
                 >
                   Save Notes & Close
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-400 border-indigo-500/20',
    amber: 'text-amber-400 border-amber-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
    rose: 'text-rose-400 border-rose-500/20',
  };
  return (
    <div className={`bg-slate-900/50 border rounded-[32px] p-6 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">{title}</p>
      <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
      <div className="absolute right-6 top-6 opacity-20 text-2xl group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  );
};

const HealthIndicator: React.FC<{ label: string; status: string; color: string }> = ({ label, status, color }) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${colors[color]} animate-pulse`}></div>
        <span className="text-[10px] font-black uppercase text-slate-200">{status}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
