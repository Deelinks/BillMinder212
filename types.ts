
export enum Frequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  TERMLY = 'TERMLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export enum BillStatus {
  UPCOMING = 'UPCOMING',
  DUE_TODAY = 'DUE_TODAY',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID'
}

export enum Entitlement {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface Bill {
  id: string;
  name: string;
  amount?: number;
  currency?: string;
  dueDate: string; // ISO string
  frequency: Frequency;
  intervalMonths?: number;
  status: BillStatus;
  lastPaidDate?: string;
  transactionRef?: string;
  paymentLink?: string;
  requireProof?: boolean;
  proofImage?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isDisputed?: boolean;
  waiverAmount?: number;
  adminNotes?: string;
  lastNotifiedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  isAnonymous: boolean;
  entitlement: Entitlement;
  currency: string;
}
