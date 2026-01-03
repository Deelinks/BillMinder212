
import React, { useState, useRef } from 'react';
import { Bill } from '../types';
import { formatCurrency, formatDate } from '../utils/dateUtils';

interface PaymentVerificationModalProps {
  bill: Bill;
  currency: string;
  onConfirm: (reference: string, proofImage: string) => void;
  onCancel: () => void;
  isStrict: boolean;
}

const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({ 
  bill, 
  currency, 
  onConfirm, 
  onCancel,
  isStrict 
}) => {
  const [reference, setReference] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (isStrict && (!reference.trim() || !image)) {
      alert("Strict Audit Protocol: Reference ID and Receipt Image are mandatory for this obligation.");
      return;
    }
    onConfirm(reference, image || '');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-indigo-600 p-8 text-white relative">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <i className="fa-solid fa-file-shield"></i>
            </div>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full hover:bg-black/20 transition-colors">
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-none mb-2">Verify Settlement</h2>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
            {bill.name} • {formatCurrency(bill.amount, currency)}
          </p>
          
          {isStrict && (
            <div className="absolute top-4 right-4 bg-amber-400 text-slate-900 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Strict Audit Active
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transaction Reference</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <i className="fa-solid fa-fingerprint"></i>
              </span>
              <input 
                type="text" 
                placeholder="Reference ID (e.g. T2023...)"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-12 focus:bg-white focus:border-indigo-100 outline-none text-slate-800 transition-all font-mono text-sm"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Evidence Trail (Receipt)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${image ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
            >
              {image ? (
                <>
                  <img src={image} alt="Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-rotate"></i> Replace Image
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Snap or Upload Proof</span>
                  <span className="text-[9px] text-slate-300 mt-1">PNG, JPG or PDF Screenshot</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
            />
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
          >
            Confirm & Log Payment
          </button>
          
          <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
            Validated for {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;
