
import { supabase } from './supabase';
import { Bill, UserProfile, Entitlement, BillStatus } from '../types';

export interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  totalBills: number;
  totalVolume: number;
  totalPaidVolume: number;
  systemHealth: 'Optimal' | 'Degraded' | 'Maintenance';
}

export interface AdminUserRecord extends UserProfile {
  id: string;
  email: string;
  isDisabled: boolean;
  isRestricted: boolean;
  restrictionReason: string | null;
  entitlementUpdatedAt: string | null;
  createdAt: string;
  adminNotes: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: {
    reason?: string;
    old_value?: any;
    new_value?: any;
    admin?: string;
  };
  created_at: string;
}

const ADMIN_EMAIL = 'asksham4me2@gmail.com';

const serializeError = (err: any): string => {
  if (!err) return 'Unknown Error';
  if (typeof err === 'string') return err;
  
  // Handle Supabase/PostgREST error objects
  const message = err.message || err.error_description || err.code;
  const details = err.details ? ` - ${err.details}` : '';
  const hint = err.hint ? ` (Hint: ${err.hint})` : '';
  
  if (message) return `${message}${details}${hint}`;
  
  try {
    return JSON.stringify(err);
  } catch (e) {
    return 'Unserializable Error';
  }
};

export const adminService = {
  checkAccess: (email?: string | null) => email === ADMIN_EMAIL,

  async getDashboardStats(): Promise<AdminStats> {
    try {
      const { data: bills, error: bErr } = await supabase.from('bills').select('amount, status');
      if (bErr) throw bErr;

      const { count: userCount, error: uErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (uErr) throw uErr;

      const { data: config, error: cErr } = await supabase.from('system_config').select('*').eq('key', 'maintenance_mode').maybeSingle();

      const totalBills = bills?.length || 0;
      const totalVolume = bills?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
      const totalPaidVolume = bills?.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (b.amount || 0), 0) || 0;

      return {
        totalUsers: userCount || 0,
        activeUsers24h: Math.floor((userCount || 0) * 0.75),
        totalBills,
        totalVolume,
        totalPaidVolume,
        systemHealth: config?.value === true || config?.value === 'true' ? 'Maintenance' : 'Optimal'
      };
    } catch (err: any) {
      console.error("Dashboard Stats Fetch Error:", err);
      throw new Error(`Stats Load Error: ${serializeError(err)}`);
    }
  },

  async getAllUsers(): Promise<AdminUserRecord[]> {
    const { data, error } = await supabase.rpc('get_admin_user_list_v2');
    
    if (error) {
      console.error("RPC 'get_admin_user_list_v2' Error:", error);
      throw new Error(`User Fetch Error: ${serializeError(error)}`);
    }

    // Explicitly map snake_case SQL response to camelCase JS interface
    return (data || []).map((u: any) => ({
      id: u.id,
      uid: u.id, 
      email: u.email,
      displayName: u.display_name,
      phoneNumber: u.phone_number,
      entitlement: u.entitlement as Entitlement,
      currency: u.currency || 'NGN',
      isAnonymous: false,
      isDisabled: !!u.is_disabled,
      isRestricted: !!u.is_restricted,
      restrictionReason: u.restriction_reason,
      entitlementUpdatedAt: u.entitlement_updated_at,
      createdAt: u.created_at,
      adminNotes: u.admin_notes
    }));
  },

  async getAllBills(): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Bills Fetch Error: ${serializeError(error)}`);
    }
    
    return (data || []).map(b => ({
      ...b,
      dueDate: b.due_date,
      // Fix: map interval_months from DB to intervalMonths in Bill interface
      intervalMonths: b.interval_months,
      userId: b.user_id,
      updatedAt: b.updated_at,
      adminNotes: b.admin_notes,
      isDisputed: b.is_disputed,
      waiverAmount: b.waiver_amount
    })) as Bill[];
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return [];
    return data;
  },

  async clearAuditLogs() {
    // In a production app, we might move these to a cold storage table instead of just deleting
    const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(serializeError(error));
    
    await supabase.from('audit_logs').insert({
      action_type: 'LOGS_PURGED',
      entity_type: 'SYSTEM',
      entity_id: 'AUDIT_TRAIL',
      metadata: { admin: ADMIN_EMAIL, reason: 'Manual operator purge' }
    });
  },

  async updateUserTier(userId: string, newTier: Entitlement, oldTier: Entitlement, reason: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        entitlement: newTier,
        entitlement_updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw new Error(serializeError(error));

    await supabase.from('audit_logs').insert({
      action_type: 'TIER_CHANGE',
      entity_type: 'USER',
      entity_id: userId,
      metadata: { 
        admin: ADMIN_EMAIL, 
        reason,
        old_value: oldTier,
        new_value: newTier
      }
    });
  },

  async updateUserRestriction(userId: string, type: 'DISABLE' | 'RESTRICT' | 'ENABLE', reason: string) {
    const updates: any = {};
    if (type === 'DISABLE') updates.is_disabled = true;
    if (type === 'RESTRICT') updates.is_restricted = true;
    if (type === 'ENABLE') {
      updates.is_disabled = false;
      updates.is_restricted = false;
    }
    updates.restriction_reason = type === 'ENABLE' ? null : reason;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw new Error(serializeError(error));

    await supabase.from('audit_logs').insert({
      action_type: `USER_${type}`,
      entity_type: 'USER',
      entity_id: userId,
      metadata: { admin: ADMIN_EMAIL, reason }
    });
  },

  async updateBillAdminAction(billId: string, updates: any, reason: string) {
    const { error } = await supabase
      .from('bills')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', billId);
    
    if (error) throw new Error(serializeError(error));

    await supabase.from('audit_logs').insert({
      action_type: 'BILL_ADMIN_UPDATE',
      entity_type: 'BILL',
      entity_id: billId,
      metadata: { admin: ADMIN_EMAIL, reason, ...updates }
    });
  },

  async getSystemConfig(): Promise<any> {
    const { data, error } = await supabase.from('system_config').select('*');
    if (error) return {};
    return data?.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  },

  async updateConfig(key: string, value: any) {
    const { error } = await supabase
      .from('system_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) throw new Error(serializeError(error));

    // Audit the config change
    await supabase.from('audit_logs').insert({
      action_type: 'CONFIG_UPDATE',
      entity_type: 'SYSTEM',
      entity_id: key,
      metadata: { admin: ADMIN_EMAIL, new_value: value }
    });
  }
};
