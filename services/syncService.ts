
import { supabase } from './supabase';
import { Bill, UserProfile, Entitlement } from '../types';

export const syncService = {
  async fetchBills(userId: string): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(b => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      currency: b.currency,
      dueDate: b.due_date,
      frequency: b.frequency,
      // Fix: map interval_months from DB to intervalMonths in Bill interface
      intervalMonths: b.interval_months,
      status: b.status,
      lastPaidDate: b.last_paid_date,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      userId: b.user_id,
      adminNotes: b.admin_notes,
      isDisputed: b.is_disputed,
      waiverAmount: b.waiver_amount
    }));
  },

  async upsertBill(bill: Bill) {
    const { error } = await supabase
      .from('bills')
      .upsert({
        id: bill.id,
        user_id: bill.userId,
        name: bill.name,
        amount: bill.amount,
        currency: bill.currency,
        due_date: bill.dueDate,
        frequency: bill.frequency,
        interval_months: bill.intervalMonths,
        status: bill.status,
        last_paid_date: bill.lastPaidDate,
        updated_at: new Date().toISOString(),
        is_disputed: bill.isDisputed || false,
        waiver_amount: bill.waiverAmount || 0,
        admin_notes: bill.adminNotes || null
      });
    
    if (error) throw error;
  },

  async deleteBill(billId: string) {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);
    
    if (error) throw error;
  },

  async getProfile(userId: string): Promise<Partial<UserProfile> | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;
    
    return {
      uid: data.id,
      displayName: data.display_name,
      phoneNumber: data.phone_number,
      entitlement: data.entitlement as Entitlement,
      currency: data.currency
    };
  },

  async upsertProfile(profile: UserProfile) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.uid,
        display_name: profile.displayName,
        phone_number: profile.phoneNumber,
        entitlement: profile.entitlement,
        currency: profile.currency,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }
};
