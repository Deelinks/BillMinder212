import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bill, BillStatus, Frequency } from '../types';
import { getStatus, formatCurrency, formatDate } from '../utils/dateUtils';
import { ICONS, APP_NAME } from '../constants';
// Standardized on PascalCase StorageService to resolve casing conflict
import { storageService } from '../services/StorageService';

interface BillDetailsScreenProps {
  bills: Bill[];
  currency: string;
  onPay: (id: string, ref?: string, proof?: string) => void;
  onDelete: (id: string) => void;
}

const BillDetailsScreen: React.FC<BillDetailsScreenProps> = ({ bills, currency, onPay, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showProofModal, setShowProofModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const bill = useMemo(() => bills.find(b => b.id === id), [bills, id]);

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <i className="fa-solid fa-magnifying-glass text-3xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Obligation Not Found</h2>
        <p className="text-slate-500 text-sm mb-8">This record may have been deleted or moved.</p>
        <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  const displayCurrency = bill.currency || currency;
  const currentStatus = getStatus(bill.dueDate, bill.status);
  const statusConfig = {
    [BillStatus.PAID]: { bg: 'bg-emerald-500', icon: <i className="fa-solid fa-check-double"></i>, label: 'Settled' },
    [BillStatus.UPCOMING]: { bg: 'bg-blue-500', icon: <i className="fa-solid fa-clock"></i>, label: 'Upcoming' },
    [BillStatus.DUE_TODAY]: { bg: 'bg-amber-500', icon: <i className="fa-solid fa-bolt"></i>, label: 'Due Today' },
    [BillStatus.OVERDUE]: { bg: 'bg-rose-500', icon: <i className="fa-solid fa-triangle-exclamation"></i>, label: 'Overdue' },
  };

  const config = statusConfig[currentStatus];

  const handleShare = () => {
    const message = `Reminder: ${bill.name} bill of ${formatCurrency(bill.amount, displayCurrency)} is ${currentStatus === BillStatus.OVERDUE ? 'OVERDUE' : 'due'} on ${formatDate(bill.dueDate)}. Please settle via ${bill.paymentLink || 'bank transfer'}. - Sent via ${APP_NAME}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Dynamic Header Background */}
      <div className={`h-48 ${config.bg} relative flex items-end px-6 pb-8 transition-colors duration-500`}>
        <div className="absolute top-6 left-6 flex gap-4">
           <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
        
        <div className="relative z-10 flex justify-between items-end w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">{config.label}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
              <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">{bill.frequency}</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">{bill.name}</h1>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white text-2xl">
            {config.icon}
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white rounded-t-[48px]"></div>
      </div>

      <div className="px-6 space-y-8">
        {/* Primary Stats Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount Due ({displayCurrency})</label>
            <div className="text-xl font-black text-slate-900">{bill.amount ? formatCurrency(bill.amount, displayCurrency) : 'Flexible'}</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
            <div className="text-xl font-black text-slate-900">{formatDate(bill.dueDate)}</div>
          </div>
        </div>

        {/* Description/Metadata Section */}
        <section>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Details & Logistics</label>
          <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden divide-y divide-slate-50 shadow-sm">
            {bill.paymentLink && (
              <a href={bill.paymentLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 active:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-link"></i>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Payment Portal</span>
                    <span className="text-[10px] text-indigo-500 font-medium truncate max-w-[180px] block">{bill.paymentLink}</span>
                  </div>
                </div>
                <i className="fa-solid fa-arrow-up-right-from-square text-slate-300 group-hover:text-indigo-600 transition-colors"></i>
              </a>
            )}
            
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-shield-check"></i>
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Security Protocol</span>
                  <span className="text-[10px] text-slate-500 font-medium">{bill.requireProof ? 'Strict Audit (Receipt Required)' : 'Standard Tracking'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                   <i className="fa-solid fa-rotate"></i>
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Occurrence</span>
                  <span className="text-[10px] text-slate-500 font-medium">Repeats {bill.frequency.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* History / Evidence Section */}
        {(bill.lastPaidDate || bill.proofImage) && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Evidence Trail</label>
            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Last Settlement</div>
                  <div className="text-xl font-black">{bill.lastPaidDate ? formatDate(bill.lastPaidDate) : 'Recently Logged'}</div>
                </div>
                {bill.proofImage && (
                  <button 
                    onClick={() => setShowProofModal(true)}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors active:scale-90"
                  >
                    <i className="fa-solid fa-image"></i>
                  </button>
                )}
              </div>
              
              {bill.transactionRef && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Reference ID</div>
                  <div className="text-sm font-mono text-indigo-300 font-bold">{bill.transactionRef}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Action Grid */}
        <section>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Action Center</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-white border border-slate-100 p-5 rounded-[28px] text-slate-700 font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-50"
            >
              <i className="fa-brands fa-whatsapp text-emerald-500 text-lg"></i> Share
            </button>
            <button 
              onClick={() => navigate(`/edit/${bill.id}`)}
              className="flex items-center justify-center gap-3 bg-white border border-slate-100 p-5 rounded-[28px] text-slate-700 font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-50"
            >
              <i className="fa-solid fa-pen text-indigo-500 text-lg"></i> Edit
            </button>
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="col-span-2 flex items-center justify-center gap-3 bg-rose-50 border border-rose-100 p-5 rounded-[28px] text-rose-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-100"
            >
              <i className="fa-solid fa-trash-can text-lg"></i> Purge Record
            </button>
          </div>
        </section>
      </div>

      {/* Proof Image Modal */}
      {showProofModal && bill.proofImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-sm flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] bg-white rounded-[40px] overflow-hidden shadow-2xl mb-8">
              <img src={bill.proofImage} alt="Receipt Proof" className="w-full h-full object-contain" />
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">Digital Receipt</div>
                <button onClick={() => setShowProofModal(false)} className="w-10 h-10 bg-slate-900/50 backdrop-blur-md rounded-full text-white flex items-center justify-center active:scale-90 transition-transform">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8">Verified Reference: {bill.transactionRef || 'N/A'}</p>
            <button 
              onClick={() => setShowProofModal(false)}
              className="w-full py-5 bg-indigo-600 text-white rounded-[28px] font-black text-lg shadow-xl shadow-indigo-900/20 active:scale-95 transition-transform"
            >
              Dismiss Viewer
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xs bg-white rounded-[40px] overflow-hidden shadow-2xl p-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6 mx-auto">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2 tracking-tight">Erase Record?</h2>
            <p className="text-slate-500 text-xs text-center mb-8 font-medium">This action will permanently remove this financial obligation and its history.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { onDelete(bill.id); navigate(-1); }} 
                className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-rose-100 active:scale-95 transition-transform"
              >
                Confirm Deletion
              </button>
              <button 
                onClick={() => setShowConfirmDelete(false)} 
                className="w-full text-slate-500 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50"
              >
                Keep Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillDetailsScreen;