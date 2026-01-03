
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, BillStatus, UserProfile } from '../types';
import { formatCurrency, formatDate, getStatus } from '../utils/dateUtils';
import { APP_NAME } from '../constants';

type ReportType = 'ACTIVE' | 'PAID' | 'HISTORY' | 'ALL';

export const reportService = {
  generateBillsReport: (allBills: Bill[], profile: UserProfile | null, type: ReportType = 'ALL') => {
    const doc = new jsPDF();
    const currency = profile?.currency || 'NGN';
    const userName = profile?.displayName || profile?.email || 'Guest User';
    const dateGenerated = new Date().toLocaleString();

    // 1. Filter Logic (Synchronized with BillsScreen)
    let displayBills: Bill[] = [];
    let reportTitle = "";

    if (type === 'ACTIVE') {
      displayBills = allBills.filter(b => b.status !== BillStatus.PAID);
      reportTitle = "Active Obligations Report";
    } else if (type === 'PAID') {
      displayBills = allBills.filter(b => b.status === BillStatus.PAID);
      reportTitle = "Settled One-Time Bills Report";
    } else if (type === 'HISTORY') {
      displayBills = allBills.filter(b => !!b.lastPaidDate);
      reportTitle = "Payment History Audit Report";
    } else {
      displayBills = allBills;
      reportTitle = "Comprehensive Financial Statement";
    }

    // Sort by date (History/Paid = most recent first, Active = nearest due first)
    displayBills.sort((a, b) => {
        if (type === 'PAID' || type === 'HISTORY') {
            const dateA = new Date(a.lastPaidDate || a.updatedAt).getTime();
            const dateB = new Date(b.lastPaidDate || b.updatedAt).getTime();
            return dateB - dateA;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // 2. Title & Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(APP_NAME.toUpperCase(), 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(reportTitle, 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated for: ${userName}`, 14, 40);
    doc.text(`Date: ${dateGenerated}`, 14, 45);

    // 3. Summary Stats Section
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 50, 196, 50);

    const unpaidTotal = allBills
      .filter(b => b.status !== BillStatus.PAID)
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const paidTotal = allBills
      .filter(b => b.status === BillStatus.PAID || b.lastPaidDate)
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    if (type === 'ACTIVE' || type === 'ALL') {
        doc.text(`Outstanding Balance (Global View): ${formatCurrency(unpaidTotal, currency)}`, 14, 60);
    }
    if (type === 'PAID' || type === 'HISTORY' || type === 'ALL') {
        const yPos = (type === 'ALL') ? 66 : 60;
        doc.text(`Total Settled to Date (Global View): ${formatCurrency(paidTotal, currency)}`, 14, yPos);
    }

    // 4. Table Generation
    const tableHeaders = [['Bill Name', 'Reference Date', 'Frequency', 'Amount', 'Status']];
    const tableData = displayBills.map(b => {
      const isPaidStatus = b.status === BillStatus.PAID;
      const hasHistory = !!b.lastPaidDate;
      const refDate = (hasHistory && (type === 'PAID' || type === 'HISTORY')) ? b.lastPaidDate! : b.dueDate;
      
      return [
        b.name,
        formatDate(refDate),
        b.frequency,
        b.amount ? formatCurrency(b.amount, b.currency || currency) : 'N/A',
        isPaidStatus ? 'PAID' : getStatus(b.dueDate, b.status).replace('_', ' ')
      ];
    });

    autoTable(doc, {
      startY: (type === 'ALL') ? 75 : 70,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 10, halign: 'left' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'right' },
        4: { fontStyle: 'bold' }
      },
      didDrawPage: (data: any) => {
        // Footer
        const str = `Page ${doc.internal.getNumberOfPages()} | ${APP_NAME} Secure Report`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    // 5. Save the PDF
    const fileName = `${APP_NAME}_${type}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
};
