
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-6 min-h-screen bg-white animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 p-2 -ml-2">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
      </div>

      <div className="prose prose-slate prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Data Sovereignty</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            BillMinder is built on an "Offline-First" architecture. Your financial records, bill details, and payment proof images are stored locally on your device by default. We do not access this data unless you explicitly enable Cloud Sync.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Cloud Infrastructure</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            When you register an account, your data is transmitted via SSL encryption to our secure Supabase database clusters. This data is used solely for cross-device synchronization and disaster recovery.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Payment Security</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            All financial transactions for "Pro" upgrades are handled by <strong>Paystack</strong>. BillMinder never sees or stores your credit card numbers, CVVs, or bank login credentials. Paystack is PCI-DSS Level 1 compliant.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Local Permissions</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            The app requests <strong>Camera</strong> access specifically for the "Strict Audit" feature, allowing you to attach proof of payment to your records. These images remain on your device unless Cloud Sync is active.
          </p>
        </section>

        <div className="pt-10 pb-12 border-t border-slate-50 flex flex-col items-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Effective Date: October 2023</p>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Last Revised: May 2024</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;
