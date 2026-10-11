import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Tag,
  Calendar,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { formatToman, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { parsePersianFinancialText } from '../utils/aiParser';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { exportTransactionsToExcel } from '../utils/excelExporter';

interface TransactionsViewProps {
  onOpenTransactionModal: (tx?: Transaction) => void;
  onOpenBankSmsModal?: () => void;
}

type PeriodFilter = 'current_month' | 'last_month' | 'quarter' | 'all';

interface DayGroup {
  dateKey: string;
  displayDate: string;
  totalIncome: number;
  totalExpense: number;
  items: Transaction[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenTransactionModal,
  onOpenBankSmsModal,
}) => {
  const { transactions, deleteTransaction, addTransaction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('current_month');
  const [quickAiText, setQuickAiText] = useState('');

  // Quick Natural Language Add
  const handleQuickAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiText.trim()) return;

    const parsed = parsePersianFinancialText(quickAiText);
    if (parsed.amount) {
      addTransaction({
        type: parsed.type || 'expense',
        amount: parsed.amount,
        category: (parsed.category as TransactionCategory) || 'خوراک و غذا',
        description: parsed.description || quickAiText.trim(),
        date: new Date().toISOString(),
      });
      setQuickAiText('');
    } else {
      alert('مبلغ قابل تشخیصی در متن یافت نشد. مثلاً بنویسید: «خرید نان ۲۰۰۰۰ تومان»');
    }
  };

  // Filter transactions with Default Current Month & Quarterly Selectors
  const filtered = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const startOfQuarter = new Date(currentYear, currentMonth - 2, 1); // 3 months active period

    return transactions.filter((tx) => {
      // 1. Period Filter
      if (periodFilter === 'current_month') {
        const d = new Date(tx.date);
        if (d < startOfCurrentMonth) return false;
      } else if (periodFilter === 'last_month') {
        const d = new Date(tx.date);
        if (d < startOfLastMonth || d > endOfLastMonth) return false;
      } else if (periodFilter === 'quarter') {
        const d = new Date(tx.date);
        if (d < startOfQuarter) return false;
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // 3. Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [transactions, periodFilter, typeFilter, categoryFilter, searchQuery]);

  // Group transactions by date with daily subtotals
  const groupedByDay = useMemo(() => {
    const map = new Map<string, DayGroup>();

    // Sort descending by date
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach((tx) => {
      const dateKey = tx.date ? tx.date.split('T')[0] : 'نامشخص';
      const displayDate = formatShamsiDate(tx.date);

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateKey,
          displayDate,
          totalIncome: 0,
          totalExpense: 0,
          items: [],
        });
      }

      const grp = map.get(dateKey)!;
      grp.items.push(tx);
      if (tx.type === 'income') {
        grp.totalIncome += tx.amount;
      } else {
        grp.totalExpense += tx.amount;
      }
    });

    return Array.from(map.values());
  }, [filtered]);

  // Summary Metrics of Filtered Period
  const periodTotalIncome = useMemo(
    () => filtered.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );
  const periodTotalExpense = useMemo(
    () => filtered.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  // Enhanced Excel Export
  const handleExportExcel = () => {
    exportTransactionsToExcel(
      filtered,
      `chandboon_transactions_${periodFilter}_${Date.now()}.xlsx`
    );
  };

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            تراکنش‌های مالی و تایم‌لاین هوشمند
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            مشاهده تراکنش‌ها به تفکیک روز، فیلترهای فصلی و ماهانه، ثبت با پیامک بانکی و خروجی اکسل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-cairo">
          {onOpenBankSmsModal && (
            <button
              onClick={onOpenBankSmsModal}
              title="پردازش و استخراج خودکار از متن پیامک یا فیش بانکی"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-[#131F2A] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>پردازش پیامک بانکی</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            title="دانلود فایل اکسل چندشیت با تفکیک دسته‌بندی و فرمت ارزی"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#14231C] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل پیشرفته (XLSX)</span>
          </button>

          <button
            id="open-add-transaction-modal-btn"
            onClick={() => onOpenTransactionModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش جدید</span>
          </button>
        </div>
      </div>

      {/* Natural Language Quick Input Bar */}
      <form
        onSubmit={handleQuickAiSubmit}
        className="p-3 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center gap-2"
      >
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#121F19] text-emerald-700 dark:text-emerald-300 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={quickAiText}
          onChange={(e) => setQuickAiText(e.target.value)}
          placeholder="ثبت سریع متنی با هوش مصنوعی (مثلاً: ۳۵ هزار تومن نان سنگک یا یک میلیون حقوق)..."
          className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 font-cairo"
        />
        <button
          type="submit"
          disabled={!quickAiText.trim()}
          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          ثبت سریع
        </button>
      </form>

      {/* Timeline Period Tabs & Filters Bar */}
      <div className="p-4 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
        {/* Row 1: Quick Timeline Period Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setPeriodFilter('current_month')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                periodFilter === 'current_month'
                  ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              ماه جاری
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('last_month')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                periodFilter === 'last_month'
                  ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              ماه گذشته
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('quarter')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                periodFilter === 'quarter'
                  ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              ۳ ماه اخیر (فصلی)
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              همه ({toPersianDigits(transactions.length)})
            </button>
          </div>

          {/* Period Summary Totals */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500">
              درآمد دوره: <b className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">+{formatToman(periodTotalIncome)}</b>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500">
              هزینه دوره: <b className="text-rose-600 dark:text-rose-400 font-bold font-mono">-{formatToman(periodTotalExpense)}</b>
            </span>
          </div>
        </div>

        {/* Row 2: Search, Type and Category Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، دسته‌بندی یا مبلغ..."
              className="w-full pr-9 pl-4 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-xl text-xs font-cairo font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              همه انواع
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-white dark:bg-[#0F1512] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              هزینه‌ها
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-white dark:bg-[#0F1512] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              درآمدها
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            >
              <option value="all">همه دسته‌ها</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List Grouped by Day */}
      <div className="space-y-4">
        {groupedByDay.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-3 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621]">
            <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <p className="text-xs sm:text-sm">
              هیچ تراکنشی در بازه انتخابی ({periodFilter === 'current_month' ? 'ماه جاری' : periodFilter === 'last_month' ? 'ماه گذشته' : '۳ ماه اخیر'}) یافت نشد.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onOpenTransactionModal()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs cursor-pointer shadow-xs transition"
              >
                ثبت اولین تراکنش
              </button>
              {onOpenBankSmsModal && (
                <button
                  onClick={onOpenBankSmsModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-cairo font-bold text-xs cursor-pointer shadow-xs transition"
                >
                  پردازش پیامک بانکی
                </button>
              )}
            </div>
          </div>
        ) : (
          groupedByDay.map((group) => (
            <div
              key={group.dateKey}
              className="bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs overflow-hidden"
            >
              {/* Daily Group Header with Subtotals */}
              <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-[#121B17] border-b border-[#E2E8E4] dark:border-[#1A2621] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {group.displayDate}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    ({toPersianDigits(group.items.length)} تراکنش)
                  </span>
                </div>

                {/* Daily Subtotal Badges */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  {group.totalIncome > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                      درآمد: +{formatToman(group.totalIncome)}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]">
                      هزینه: -{formatToman(group.totalExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in This Day */}
              <div className="divide-y divide-zinc-100 dark:divide-[#1A2621]/80">
                {group.items.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-[#121B17] transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-[#13251D] dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-[#251515] dark:text-rose-300'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.description}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#15201A] text-[11px]">
                            {tx.category}
                          </span>
                          {tx.account && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-zinc-400">{tx.account}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-left font-cairo">
                        <span
                          className={`text-base font-bold ${
                            tx.type === 'income'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-zinc-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'income' ? '+ ' : '- '}
                          {formatToman(tx.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenTransactionModal(tx)}
                          title="ویرایش تراکنش"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-[#16251E] transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          title="حذف تراکنش"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#281515] transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
