import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { formatShamsiDate } from './formatters';

/**
 * Enhanced Excel Exporter for Chandboom Platform (chandboom.ir)
 * - Produces chandboom_transactions.xlsx
 * - Sheet 1: "تراکنش‌های چندبوم" with expanded columns and automated totals row
 * - Sheet 2: "خلاصه و تحلیل دسته‌بندی‌ها" with grouped summary of Income vs Expense
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  fileName: string = `chandboom_transactions_${Date.now()}.xlsx`
) {
  // 1. Prepare Main Sheet Data (تراکنش‌های چندبوم)
  const mainSheetRows: any[] = [];

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx, idx) => {
    const isIncome = tx.type === 'income';
    if (isIncome) totalIncome += tx.amount;
    else totalExpense += tx.amount;

    mainSheetRows.push({
      'ردیف': idx + 1,
      'شناسه تراکنش': tx.id,
      'نوع': isIncome ? 'درآمد (+)' : 'هزینه (-)',
      'دسته‌بندی': tx.category,
      'حساب/کارت': tx.account || 'کارت پیش‌فرض',
      'برچسب‌ها (Tags)': (tx.tags && tx.tags.length > 0) ? tx.tags.join('، ') : '-',
      'مبلغ عددی': tx.amount,
      'مبلغ با واحد (تومان)': `${tx.amount.toLocaleString('fa-IR')} تومان`,
      'توضیحات': tx.description || '-',
      'تاریخ': formatShamsiDate(tx.date),
    });
  });

  // Append Automated Totals Rows to Sheet 1
  mainSheetRows.push({}); // Empty separator row
  mainSheetRows.push({
    'ردیف': 'مجموع',
    'شناسه تراکنش': 'جمع کل درآمدها',
    'نوع': 'درآمد (+)',
    'دسته‌بندی': '-',
    'حساب/کارت': '-',
    'برچسب‌ها (Tags)': '-',
    'مبلغ عددی': totalIncome,
    'مبلغ با واحد (تومان)': `${totalIncome.toLocaleString('fa-IR')} تومان`,
    'توضیحات': 'مجموع کل ورودی‌های مالی',
    'تاریخ': '-',
  });
  mainSheetRows.push({
    'ردیف': 'مجموع',
    'شناسه تراکنش': 'جمع کل هزینه‌ها',
    'نوع': 'هزینه (-)',
    'دسته‌بندی': '-',
    'حساب/کارت': '-',
    'برچسب‌ها (Tags)': '-',
    'مبلغ عددی': totalExpense,
    'مبلغ با واحد (تومان)': `${totalExpense.toLocaleString('fa-IR')} تومان`,
    'توضیحات': 'مجموع کل خروجی‌های مالی',
    'تاریخ': '-',
  });
  mainSheetRows.push({
    'ردیف': 'تراز',
    'شناسه تراکنش': 'مانده خالص (تراز مالی)',
    'نوع': totalIncome >= totalExpense ? 'مثبت (مازاد)' : 'منفی (کسری)',
    'دسته‌بندی': '-',
    'حساب/کارت': '-',
    'برچسب‌ها (Tags)': '-',
    'مبلغ عددی': totalIncome - totalExpense,
    'مبلغ با واحد (تومان)': `${(totalIncome - totalExpense).toLocaleString('fa-IR')} تومان`,
    'توضیحات': 'تراز نهایی حساب و پس‌انداز',
    'تاریخ': '-',
  });

  // 2. Prepare Summary Sheet Data (خلاصه و تحلیل دسته‌بندی‌ها)
  const categorySummaryMap: Record<
    string,
    { type: 'income' | 'expense'; total: number; count: number }
  > = {};

  transactions.forEach((tx) => {
    const key = `${tx.category}_${tx.type}`;
    if (!categorySummaryMap[key]) {
      categorySummaryMap[key] = { type: tx.type, total: 0, count: 0 };
    }
    categorySummaryMap[key].total += tx.amount;
    categorySummaryMap[key].count += 1;
  });

  const summarySheetRows: any[] = [];
  Object.entries(categorySummaryMap).forEach(([key, val], idx) => {
    const catName = key.split('_')[0];
    const isIncome = val.type === 'income';
    const percent =
      isIncome
        ? totalIncome > 0 ? ((val.total / totalIncome) * 100).toFixed(1) + '٪' : '0٪'
        : totalExpense > 0 ? ((val.total / totalExpense) * 100).toFixed(1) + '٪' : '0٪';

    summarySheetRows.push({
      'ردیف': idx + 1,
      'دسته‌بندی': catName,
      'نوع تراکنش': isIncome ? 'درآمد' : 'هزینه',
      'تعداد تراکنش': val.count,
      'مبلغ کل (عدد)': val.total,
      'مبلغ کل (تومان)': `${val.total.toLocaleString('fa-IR')} تومان`,
      'سهم از کل نوع': percent,
    });
  });

  // Sort summary by amount descending
  summarySheetRows.sort((a, b) => (b['مبلغ کل (عدد)'] || 0) - (a['مبلغ کل (عدد)'] || 0));

  // 3. Create Workbook & Add Sheets
  const wb = XLSX.utils.book_new();

  const wsMain = XLSX.utils.json_to_sheet(mainSheetRows);
  // Set Column Widths for readability
  wsMain['!cols'] = [
    { wch: 8 },  // ردیف
    { wch: 22 }, // شناسه
    { wch: 12 }, // نوع
    { wch: 18 }, // دسته‌بندی
    { wch: 16 }, // حساب/کارت
    { wch: 16 }, // برچسب‌ها
    { wch: 14 }, // مبلغ عددی
    { wch: 20 }, // مبلغ با واحد
    { wch: 28 }, // توضیحات
    { wch: 14 }, // تاریخ
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summarySheetRows);
  wsSummary['!cols'] = [
    { wch: 8 },  // ردیف
    { wch: 20 }, // دسته‌بندی
    { wch: 14 }, // نوع
    { wch: 14 }, // تعداد
    { wch: 16 }, // مبلغ عددی
    { wch: 22 }, // مبلغ با واحد
    { wch: 14 }, // سهم از کل
  ];

  // Append Sheets to Workbook
  XLSX.utils.book_append_sheet(wb, wsMain, 'تراکنش‌های چندبوم');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'خلاصه و تحلیل دسته‌بندی‌ها');

  // 4. Trigger Direct File Download
  XLSX.writeFile(wb, fileName);
}
