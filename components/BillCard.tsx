
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bill, BillStatus } from '../types';
import { getStatus, formatCurrency, formatDate } from '../utils/dateUtils';
import { ICONS } from '../constants';

interface BillCardProps {
  bill: Bill;
  onPay: (id: string, ref?: string, proof?: string) => void;
  onDelete: (id: string) => void;
  currency?: string;
  onClick?: (id: string) => void;
  isHistoryView?: boolean;
  // Added onVerifyAudit to support strict verification passed from parent components
  onVerifyAudit?: (image: string, ref: string) => Promise<{ success: boolean; extractedId?: string; error: string | null }>;
}

const BillCard: React.FC<BillCardProps> = ({ 
  bill, 
  onPay, 
  onDelete, 
  currency = 'NGN', 
  onClick,
  isHistoryView = false,
  onVerifyAudit
}) => {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const status = getStatus(bill.dueDate, bill.status);
  
  // Honor bill-specific currency if defined
  const displayCurrency = bill.currency || currency;

  const statusColors = {
    [BillStatus.PAID]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [BillStatus.UPCOMING]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    [BillStatus.DUE_TODAY]: 'bg-amber-50 text-amber-700 border-amber-100',
    [BillStatus.OVERDUE]: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(bill.id);
    } else {
      navigate(`/bill/${bill.id}`);
    }
  };

  const handlePayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(20);
    onPay(bill.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit/${bill.id}`);
  };

  const handleDeleteRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(bill.id);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-white border border-slate-100 rounded-3xl p-5 mb-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
              {bill.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {formatDate(bill.dueDate)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[status]}`}>
            {status.replace('_', ' ')}
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="text-2xl font-black text-slate-900 tracking-tighter">
            {bill.amount ? formatCurrency(bill.amount, displayCurrency) : 'Flexible'}
          </div>
          
          <div className="flex gap-2">
            {!isHistoryView && (
              <div className="flex gap-1.5">
                {status !== BillStatus.PAID && (
                  <button 
                    onClick={handlePayClick}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-90 transition-transform"
                  >
                    Pay
                  </button>
                )}
                <button 
                  onClick={handleEditClick}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-transform"
                >
                  Edit
                </button>
              </div>
            )}
            <button 
              onClick={handleDeleteRequest}
              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Local Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white rounded-[32px] overflow-hidden shadow-2xl p-8 scale-in-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-xl mb-4 mx-auto">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h2 className="text-lg font-black text-slate-900 text-center mb-1 tracking-tight">Delete Bill?</h2>
            <p className="text-slate-500 text-[11px] text-center mb-6 font-medium leading-relaxed">This action cannot be undone. All tracking data for "{bill.name}" will be erased.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                Yes, Delete
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }} 
                className="w-full text-slate-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillCard;
