
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

const HelpScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Where do I upload my payment receipt?",
      a: "Receipts are uploaded during the payment settlement process. When you click 'Pay' on a bill, the Verification Modal will appear, allowing you to snap a photo or upload a file as proof of payment."
    },
    {
      q: "How does Secure Audit Verification work?",
      a: "Our protocol ensures that every payment marked as 'Paid' has a corresponding transaction reference number and a visual receipt. This creates a tamper-proof financial audit trail for your personal records."
    },
    {
      q: "What is the difference between Guest and Registered?",
      a: "Guest data is stored only on this specific browser. If you clear your history or lose your device, all data is gone. Registered accounts sync securely to the Supabase Cloud, ensuring your records are permanent and accessible anywhere."
    },
    {
      q: "Why do I need an account to upgrade to Pro?",
      a: "Pro features like Strict Auditing and Cloud Sync rely on your secure identity to protect sensitive financial data. Anonymous 'Guest' accounts cannot be encrypted or synced across devices reliably."
    },
    {
      q: "What is 'Require Verification' on a bill?",
      a: "If enabled, the app forces you to provide a transaction reference and a receipt image before the bill can be marked as settled. This is highly recommended for critical payments like Rent, Taxes, or School Fees."
    }
  ];

  return (
    <div className="px-6 py-6 min-h-screen bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support & FAQ</h1>
      </div>

      <div className="mb-10">
        {/* CRITICAL WARNING CARD */}
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-6">
          <div className="text-rose-500 text-3xl mb-3"><i className="fa-solid fa-triangle-exclamation"></i></div>
          <h2 className="text-sm font-black text-rose-900 uppercase tracking-tight mb-2">Guest Account Warning</h2>
          <p className="text-xs text-rose-700 leading-relaxed font-medium">
            Guest data is <strong>temporary</strong>. To prevent permanent data loss during browser updates or cache clearing, please create a free account to enable Secure Cloud Sync.
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="mt-4 text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] border-b-2 border-rose-200 pb-1"
          >
            Create Secure Account
          </button>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 mb-8">
          <div className="text-indigo-600 text-3xl mb-3">{ICONS.LIGHTBULB}</div>
          <h2 className="text-lg font-bold text-indigo-900 mb-2">Audit Tip: Data Integrity</h2>
          <p className="text-sm text-indigo-700 leading-relaxed">
            When performing a <strong>Reference Check</strong>, ensure your manual Transaction ID perfectly matches the receipt. This ensures that your exported PDF reports are bank-ready and verifiable.
          </p>
        </div>

        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Common Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              className={`border rounded-2xl transition-all cursor-pointer ${activeFaq === index ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}
            >
              <div className="p-4 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{faq.q}</span>
                <span className={`text-xs transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}>
                  <i className="fa-solid fa-chevron-down text-slate-300"></i>
                </span>
              </div>
              {activeFaq === index && (
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-10 border-t border-slate-50 flex flex-col items-center">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Secure Help Desk</p>
        <a 
          href="mailto:support@billminder.app" 
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-black active:scale-95 transition-transform"
        >
          <i className="fa-solid fa-envelope"></i>
          <span>Contact Technical Support</span>
        </a>
      </div>
    </div>
  );
};

export default HelpScreen;
