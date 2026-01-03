import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bill, Frequency, BillStatus, Entitlement } from '../types';
import { ICONS, FREE_BILL_LIMIT } from '../constants';
// Standardized on PascalCase to resolve casing conflict
import { storageService } from '../services/StorageService';

interface AddEditBillScreenProps {
  bills: Bill[];
  entitlement: Entitlement;
  onSave: (bill: Partial<Bill>) => void;
  onDelete: (id: string) => void;
}

const AddEditBillScreen: React.FC<AddEditBillScreenProps> = ({ bills, entitlement, onSave, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const isEditing = !!id;
  const [isSaving, setIsSaving] = useState(false);
  const [limitError, setLimitError] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    amount: string;
    currency: string;
    dueDate: string;
    frequency: Frequency;
    intervalMonths: string;
    paymentLink: string;
    requireProof: boolean;
  }>({
    name: '',
    amount: '',
    currency: 'NGN',
    dueDate: new Date().toISOString().split('T')[0],
    frequency: Frequency.MONTHLY,
    intervalMonths: '1',
    paymentLink: '',
    requireProof: true,
  });

  const currencies = [
    { code: 'NGN', name: 'Naira (₦)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
  ];

  const isLimitReached = !isEditing && entitlement === Entitlement.FREE && bills.length >= FREE_BILL_LIMIT;

  // Helper to format string with commas for display
  const formatMoneyInput = (value: string) => {
    // Remove everything except numbers and period
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    let result = parts[0];
    if (parts.length > 1) {
      result += '.' + parts[1].slice(0, 2); // Max 2 decimals
    }
    
    // Add thousands separators to the integer part
    if (result) {
      const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.length > 1 ? `${formattedInteger}.${parts[1].slice(0, 2)}` : formattedInteger;
    }
    
    return result;
  };

  useEffect(() => {
    const user = storageService.getUser();
    
    if (isEditing) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        setForm({
          name: bill.name,
          amount: bill.amount ? formatMoneyInput(bill.amount.toString()) : '',
          currency: bill.currency || user?.currency || 'NGN',
          dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
          frequency: bill.frequency,
          intervalMonths: bill.intervalMonths?.toString() || '1',
          paymentLink: bill.paymentLink || '',
          requireProof: bill.requireProof ?? true,
        });
      }
    } else if (user?.currency) {
      setForm(prev => ({ ...prev, currency: user.currency }));
    }
  }, [id, bills, isEditing]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMoneyInput(e.target.value);
    setForm({ ...form, amount: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dueDate || isSaving) return;

    if (isLimitReached) {
      setLimitError(true);
      setTimeout(() => navigate('/paywall', { state: { fromApp: true } }), 1500);
      return;
    }

    setIsSaving(true);
    try {
      // Clean commas before parsing to number
      const cleanAmount = form.amount.replace(/,/g, '');
      await onSave({
        id,
        name: form.name,
        amount: cleanAmount ? parseFloat(cleanAmount) : undefined,
        currency: form.currency,
        dueDate: new Date(form.dueDate).toISOString(),
        frequency: form.frequency,
        intervalMonths: form.frequency === Frequency.CUSTOM ? parseInt(form.intervalMonths) : undefined,
        paymentLink: form.paymentLink,
        requireProof: form.requireProof,
      });
      navigate(-1);
    } catch (err) {
      console.error("Failed to save bill", err);
      setIsSaving(false);
    }
  };

  const frequencies = [
    { id: Frequency.ONE_TIME, label: 'Once' },
    { id: Frequency.MONTHLY, label: 'Monthly' },
    { id: Frequency.TERMLY, label: 'Termly' },
    { id: Frequency.YEARLY, label: 'Yearly' },
    { id: Frequency.CUSTOM, label: 'Custom' },
  ];

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$'
    };
    return symbols[code] || '';
  };

  return (
    <div className="px-6 py-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 p-2 -ml-2">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Edit Bill Details' : 'Track New Obligation'}
        </h1>
        <div className="w-10"></div> 
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details Section */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Information</label>
          <div className="space-y-3">
            <input 
              type="text" 
              required
              disabled={isSaving || limitError}
              placeholder="Bill Name (e.g. Electricity)"
              className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none text-slate-800 font-bold"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
            
            <div className="flex gap-2">
              <div className="relative w-1/3">
                <select
                  value={form.currency}
                  onChange={e => setForm({...form, currency: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8"
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.code}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </div>
              </div>
              
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">
                  {getCurrencySymbol(form.currency)}
                </span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  required
                  disabled={isSaving || limitError}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 pl-10 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none text-slate-800 font-black"
                  value={form.amount}
                  onChange={handleAmountChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Logistics Section */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Logistics</label>
          <div className="space-y-3">
            <div className="relative">
               <span className="absolute left-4 top-4 text-slate-400"><i className="fa-solid fa-link text-xs"></i></span>
               <input 
                type="url" 
                placeholder="Payment Portal (e.g. Bank App Link)"
                className="w-full bg-slate-50 border-0 rounded-2xl p-4 pl-10 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none text-slate-700 text-sm font-medium"
                value={form.paymentLink}
                onChange={e => setForm({...form, paymentLink: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl">
              <div>
                <span className="block text-[10px] font-black text-indigo-900 uppercase">Require Verification</span>
                <span className="text-[9px] text-indigo-600 font-medium tracking-tight">Forces entry of transaction reference ID</span>
              </div>
              <button 
                type="button"
                onClick={() => setForm({...form, requireProof: !form.requireProof})}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.requireProof ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.requireProof ? 'left-5' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Schedule & Frequency</label>
          <div className="space-y-4">
             <input 
              type="date" 
              required
              className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-bold"
              value={form.dueDate}
              onChange={e => setForm({...form, dueDate: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-2">
              {frequencies.map(freq => (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setForm({...form, frequency: freq.id})}
                  className={`px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    form.frequency === freq.id 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSaving || limitError}
            className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            {isSaving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {isEditing ? 'Update Obligation' : 'Start Tracking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditBillScreen;