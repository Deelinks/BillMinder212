
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-6 min-h-screen bg-white animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 p-2 -ml-2">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Professional Service</h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            BillMinder is a personal financial organization tool. While we strive for 100% accuracy in reminders and status tracking, the user remains solely responsible for ensuring their financial obligations are met in accordance with third-party provider deadlines.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">2. "Pro" Subscriptions</h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Upgrading to a "Pro" plan provides access to unlimited tracking and advanced audit features. Subscriptions are billed via Paystack and are non-refundable once the premium features have been utilized.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">3. Data Responsibility</h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Users operating in "Guest Mode" acknowledge that their data exists only on their current device. BillMinder is not liable for data loss resulting from device failure, clearing browser cache, or uninstallation without a registered cloud account.
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">4. Prohibited Use</h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Users may not use BillMinder to track illegal transactions or facilitate fraudulent activities. We reserve the right to suspend accounts (as per Administrative Authority) found in violation of ethical financial standards.
          </p>
        </section>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            By using BillMinder, you agree to these professional standards and acknowledge the importance of data integrity in financial management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;
