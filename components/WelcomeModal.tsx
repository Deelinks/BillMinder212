
import React, { useState } from 'react';
import { ICONS, APP_NAME, FREE_BILL_LIMIT } from '../constants';
import { LogoMark } from './Branding';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    {
      icon: <LogoMark className="w-full h-full" variant="white" />,
      title: "Welcome to BillMinder",
      desc: "Stay on top of your financial health with the professional's choice for secure bill tracking and settlements."
    },
    {
      icon: <i className="fa-solid fa-shield-halved"></i>,
      title: "Secure Settlements",
      desc: "When you pay a bill, our Verification Modal handles everything: Reference IDs and Receipt Snaps in one secure, unified flow."
    },
    {
      icon: <i className="fa-solid fa-file-invoice-dollar"></i>,
      title: "Audit Protection",
      desc: "Pro users can enforce strict verification rules. Attach a proof of payment and log a reference ID to ensure your financial history is bulletproof."
    },
    {
      icon: <i className="fa-solid fa-arrows-spin"></i>,
      title: "Smart Recurring",
      desc: "Mark a recurring bill as 'Paid' and BillMinder automatically schedules the next one. The proof of payment is saved to your history for auditing."
    },
    {
      icon: <div className="text-amber-400">{ICONS.CROWN}</div>,
      title: "Pro Access",
      desc: `Upgrade for unlimited tracking and audit tools. Note: A registered account is required for secure cross-device synchronization.`
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-xs bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-400">
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-xl shadow-indigo-200 rotate-3">
            {currentStep.icon}
          </div>
          
          <div className="mb-2">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Module {step} of {totalSteps}</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none">
            {currentStep.title}
          </h2>
          
          <p className="text-slate-500 text-sm leading-relaxed mb-10 min-h-[80px]">
            {currentStep.desc}
          </p>

          <div className="flex gap-1.5 mb-10">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}
              />
            ))}
          </div>

          <button 
            onClick={() => {
              if (step < totalSteps) setStep(step + 1);
              else onClose();
            }}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            {step === totalSteps ? 'Launch App' : 'Next Lesson'}
          </button>
        </div>
        
        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
          <button 
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
          >
            Skip Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;