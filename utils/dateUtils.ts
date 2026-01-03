
import { Bill, BillStatus, Frequency } from '../types';

export const getStatus = (dueDateStr: string, status: BillStatus): BillStatus => {
  if (status === BillStatus.PAID) return BillStatus.PAID;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate.getTime() === now.getTime()) return BillStatus.DUE_TODAY;
  if (dueDate.getTime() < now.getTime()) return BillStatus.OVERDUE;
  return BillStatus.UPCOMING;
};

export const calculateNextDueDate = (currentDueDate: string, frequency: Frequency, interval: number = 1): string => {
  const date = new Date(currentDueDate);
  
  switch (frequency) {
    case Frequency.MONTHLY:
      date.setMonth(date.getMonth() + 1);
      break;
    case Frequency.TERMLY:
      date.setMonth(date.getMonth() + 4);
      break;
    case Frequency.YEARLY:
      date.setFullYear(date.getFullYear() + 1);
      break;
    case Frequency.CUSTOM:
      date.setMonth(date.getMonth() + interval);
      break;
    default:
      return currentDueDate;
  }
  
  return date.toISOString();
};

export const formatCurrency = (amount?: number, currencyCode: string = 'NGN') => {
  if (amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat(currencyCode === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid or unsupported
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
