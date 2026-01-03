
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bill, BillStatus, UserProfile } from '../types';
import BillCard from '../components/BillCard';
import { ICONS } from '../constants';
import { reportService } from '../services/reportService';

interface BillsScreenProps {
  bills: Bill[];
  profile: UserProfile | null;
  onPay: (id: string) => void;
  onDelete: (id: string) => void;
  onVerifyAudit?: (image: string, ref: string) => Promise<{ success: boolean; extractedId?: string; error: string | null }>;
}

const BillsScreen: React.FC<BillsScreenProps> = ({ bills, profile, onPay, onDelete, onVerifyAudit }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ACTIVE' | 'PAID' | 'HISTORY' | 'ALL'>('ACTIVE');
  const [isDownloading, setIsDownloading] = useState(false);
  const currency = profile?.currency || 'NGN';

  const filteredBills = useMemo(() => {
    let result = [...bills];

    if (filter === 'ACTIVE') {
      result = result.filter(b => b.status !== BillStatus.PAID);
    } else if (filter === 'PAID') {
      result = result.filter(b => b.status === BillStatus.PAID);
    } else if (filter === 'HISTORY') {
      result = result.filter(b => !!b.lastPaidDate);
    }

    // Sort logic: Active/All by due date (nearest first), History/Paid by payment date (newest first)
    if (filter === 'HISTORY' || filter === 'PAID') {
      return result.sort((a, b) => {
        const dateA = new Date(a.lastPaidDate || a.updatedAt).getTime();
        const dateB = new Date(b.lastPaidDate || b.updatedAt).getTime();
        return dateB - dateA;
      });
    }

    return result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills, filter]);

  const handleDownloadReport = () => {
    if (bills.length === 0) return;
    setIsDownloading(true);
    
    setTimeout(() => {
      try {
        reportService.generateBillsReport(bills, profile, filter);
      } catch (err) {
        console.error("PDF generation failed", err);
        alert("Failed to generate report.");
      } finally {
        setIsDownloading(false);
      }
    }, 500);
  };

  return (
    <div className="px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Portfolio</h1>
        
        {bills.length > 0 && (
          <button 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isDownloading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95'
            }`}
          >
            {isDownloading ? (
              <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : ICONS.FILE_PDF}
            <span>{isDownloading ? 'Working...' : 'Export'}</span>
          </button>
        )}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 overflow-x-auto custom-scrollbar no-scrollbar">
        <div className="flex min-w-full gap-1">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${
              filter === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ACTIVE
          </button>
          <button
            onClick={() => setFilter('PAID')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${
              filter === 'PAID' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            PAID
          </button>
          <button
            onClick={() => setFilter('HISTORY')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${
              filter === 'HISTORY' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            HISTORY
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBills.map(bill => (
          <div key={bill.id} className={filter !== 'ACTIVE' && filter !== 'ALL' ? 'opacity-90 transition-opacity' : ''}>
             <BillCard 
              bill={bill} 
              currency={currency}
              onPay={onPay} 
              onDelete={onDelete}
              onClick={(id) => navigate(`/edit/${id}`)}
              isHistoryView={filter === 'PAID' || filter === 'HISTORY'}
              onVerifyAudit={onVerifyAudit}
            />
          </div>
        ))}

        {filteredBills.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 border-2 border-dashed border-slate-100">
               <i className={`fa-solid ${filter === 'HISTORY' ? 'fa-clock-rotate-left' : filter === 'PAID' ? 'fa-circle-check' : 'fa-clipboard-list'} text-2xl`}></i>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
              {filter === 'HISTORY' ? 'No historical records' : filter === 'PAID' ? 'No settled one-time bills' : 'No active bills found'}
            </p>
          </div>
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default BillsScreen;
