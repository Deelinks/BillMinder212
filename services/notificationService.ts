
import { Bill, BillStatus } from '../types';
import { getStatus } from '../utils/dateUtils';

export const notificationService = {
  /**
   * Requests browser notification permission.
   */
  requestPermission: async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    
    if (Notification.permission === "granted") return true;
    
    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  /**
   * Scans bills and triggers local notifications for upcoming or overdue items.
   * Only notifies once per bill per day to avoid spam.
   */
  checkAndNotify: async (bills: Bill[], onBillUpdated: (bill: Bill) => void) => {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const bill of bills) {
      if (bill.status === BillStatus.PAID) continue;

      const dueDate = new Date(bill.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const lastNotified = bill.lastNotifiedAt ? bill.lastNotifiedAt.split('T')[0] : null;

      // Don't notify if we already notified today
      if (lastNotified === todayStr) continue;

      let shouldNotify = false;
      let title = "";
      let body = "";

      if (diffDays === 0) {
        shouldNotify = true;
        title = `🚨 Bill Due Today: ${bill.name}`;
        body = `Your payment for ${bill.name} is due today. Don't forget to settle it!`;
      } else if (diffDays === 1) {
        shouldNotify = true;
        title = `🔔 Reminder: ${bill.name} tomorrow`;
        body = `Just a heads up, your ${bill.name} bill is due tomorrow.`;
      } else if (diffDays === 3) {
        shouldNotify = true;
        title = `📅 Upcoming: ${bill.name}`;
        body = `Your ${bill.name} bill is due in 3 days.`;
      } else if (diffDays < 0) {
        // Overdue handling
        shouldNotify = true;
        title = `⚠️ Overdue: ${bill.name}`;
        body = `Your ${bill.name} bill was due ${Math.abs(diffDays)} days ago!`;
      }

      if (shouldNotify) {
        new Notification(title, {
          body,
          icon: '/favicon.ico', // Fallback to standard icon
          tag: bill.id, // Prevent duplicate notifications for the same bill
        });

        // Update the bill's notification timestamp locally and in the parent state
        const updatedBill = { 
          ...bill, 
          lastNotifiedAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        onBillUpdated(updatedBill);
      }
    }
  }
};
