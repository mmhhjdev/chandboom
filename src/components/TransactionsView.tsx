import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, TrendingDown, TrendingUp, Sparkles, Calendar, CreditCard, FileSpreadsheet, Loader2, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { formatToman, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { exportTransactionsToExcel } from '../utils/excelExporter';

interface TransactionsViewProps { onOpenTransactionModal: (tx?: Transaction) => void; onOpenBankSmsModal?: () => void; }
type PeriodFilter = 'current_month' | 'last_month' | 'quarter' | 'all';
interface DayGroup { dateKey: string; displayDate: string; totalIncome: number; totalExpense: number; items: Transaction[]; }

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenTransactionModal, onOpenBankSmsModal }) => {
  const { transactions, deleteTransaction, addTransaction, isAuthenticated, hasAIAccess, setActiveTab, openSubscriptionModal, setIsAuthModalOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('current_month');
  const [quickAiText, setQuickAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{ amount: number; type: TransactionType; clean_title: string; category: TransactionCategory } | null>(null);
  const [pendingReply, setPendingReply] = useState('');

  const handleQuickAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickAiText.trim();
    if (!text || isAiLoading) return;
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    if (!hasAIAccess) { if (openSubscriptionModal) openSubscriptionModal(); else setActiveTab('subscription'); return; }
    setIsAiLoading(true); setAiError(null); setPendingDraft(null);
    try {
      const historyPayload = [{ role: 'user' as const, content: text }];
      const response = await invokeAiAssistantEdgeFunction(text, historyPayload);
      if (response.success && response.reply) {
        if (response.requires_confirmation && response.action && response.action.type === 'create_transaction') {
          setPendingReply(response.reply);
          setPendingDraft({ amount: response.action.params.amount, type: response.action.params.type, clean_title: response.action.params.description || 'تراکنش هوشمند', category: response.action.params.category });
        } else { setAiError(response.reply); }
      } else { setAiError(response.error || 'خطا در ارتباط با هوش مصنوعی'); }
    } catch (err: any) { setAiError(err?.message || 'خطا در برقراری ارتباط'); }
    finally { setIsAiLoading(false); }
  };

  const handleConfirmDraft = async () => {
    if (!pendingDraft) return;
    await addTransaction({ type: pendingDraft.type, amount: pendingDraft.amount, category: pendingDraft.category, description: pendingDraft.clean_title, account: 'کارت اصلی', date: new Date().toISOString() });
    setAiError(null);
    setMessages?.((prev: any[]) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `${pendingReply}\n\n✅ تراکنش ثبت شد.`, time: 'هم‌اکنون' }]);
    setPendingDraft(null); setPendingReply(''); setQuickAiText('');
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear(); const currentMonth = now.getMonth();
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const startOfQuarter = new Date(currentYear, currentMonth - 2, 1);
    return transactions.filter((tx) => {
      if (periodFilter === 'current_month') { const d = new Date(tx.date); if (d < startOfCurrentMonth) return false; }
      else if (periodFilter === 'last_month') { const d = new Date(tx.date); if (d < startOfLastMonth || d > endOfLastMonth) return false; }
      else if (periodFilter === 'quarter') { const d = new Date(tx.date); if (d < startOfQuarter) return false; }
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); return tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q) || tx.amount.toString().includes(q); }
      return true;
    });
  }, [transactions, periodFilter, typeFilter, categoryFilter, searchQuery]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, DayGroup>();
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach((tx) => {
      const dateKey = tx.date ? tx.date.split('T')[0] : 'نامشخص';
      const displayDate = formatShamsiDate(tx.date);
      if (!map.has(dateKey)) map.set(dateKey, { dateKey, displayDate, totalIncome: 0, totalExpense: 0, items: [] });
      const grp = map.get(dateKey)!; grp.items.push(tx);
      if (tx.type === 'income') grp.totalIncome += tx.amount; else grp.totalExpense += tx.amount;
    });
    return Array.from(map.values());
  }, [filtered]);

  const periodTotalIncome = useMemo(() => filtered.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filtered]);
  const periodTotalExpense = useMemo(() => filtered.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [filtered]);
  const handleExportExcel = () => { exportTransactionsToExcel(filtered, `chandboom_transactions_${periodFilter}_${Date.now()}.xlsx`); };
  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">تراکنش‌های مالی و تایم‌لاین هوشمند</h2><p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">مشاهده تراکنش‌ها به تفکیک روز، فیلترهای فصلی و ماهانه، ثبت با پیامک بانکی و خروجی اکسل</p></div>
        <div className="flex flex-wrap items-center gap-2 font-cairo">
          {onOpenBankSmsModal && (<button onClick={onOpenBankSmsModal} title="پردازش پیامک بانکی" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-[#131F2A] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 text-xs font-bold transition cursor-pointer shadow-xs"><CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" /><span>پردازش پیامک بانکی</span></button>)}
          <button onClick={handleExportExcel} title="خروجی اکسل" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#14231C] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer shadow-xs"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /><span>خروجی اکسل پیشرفته</span></button>
          <button id="open-add-transaction-modal-btn" onClick={() => onOpenTransactionModal()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"><Plus className="w-4 h-4" /><span>ثبت تراکنش جدید</span></button>
        </div>
      </div>

      <div className="space-y-2">
        <form onSubmit={handleQuickAiSubmit} className="p-3 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#121F19] text-emerald-700 dark:text-emerald-300 shrink-0"><Sparkles className="w-4 h-4" /></div>
          <input type="text" value={quickAiText} onChange={(e) => { setQuickAiText(e.target.value); if (aiError) setAiError(null); }} placeholder="ثبت هوشمند (مثلاً: واریز ۵ میلیون حقوق، خرید قهوه ۰ هزار)..." className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 font-cairo" disabled={isAiLoading} />
          <button type="submit" disabled={!quickAiText.trim() || isAiLoading} className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5">{isAiLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>در حال تحلیل...</span></>) : (<span>ثبت سریع</span>)}</button>
        </form>
        {aiError && (<div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-cairo flex items-center justify-between"><span>{aiError}</span><button onClick={() => setAiError(null)} className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 text-xs px-1 cursor-pointer">✕</button></div>)}
        {pendingDraft && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#16251E] border-2 border-amber-400/80 shadow-md space-y-3 animate-in fade-in zoom-in-95 font-cairo text-right">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-emerald-800/40 pb-2">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs"><Sparkles className="w-4 h-4 text-amber-500" /><span>پیش‌نویس تراکنش هوشمند</span></div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">{pendingDraft.type === 'expense' ? 'هزینه' : 'درآمد'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-zinc-500 text-[10px] block">عنوان:</span><span className="font-bold text-zinc-900 dark:text-white truncate block">{pendingDraft.clean_title}</span></div><div><span className="text-zinc-500 text-[10px] block">مبلغ:</span><span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatToman(pendingDraft.amount)}</span></div></div>
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">دسته‌بندی:</label><select value={pendingDraft.category} onChange={(e) => setPendingDraft({ ...pendingDraft, category: e.target.value as TransactionCategory })} className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1713] border border-zinc-300 dark:border-emerald-700/60 text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 font-cairo">{(pendingDraft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={handleConfirmDraft} className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"><CheckCircle2 className="w-3.5 h-3.5" /><span>تایید و ثبت</span></button>
              <button type="button" onClick={() => { setPendingDraft(null); setPendingReply(''); }} className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-[#1E2C25] text-zinc-600 dark:text-zinc-300 font-bold text-xs transition cursor-pointer">انصراف</button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-2xl text-xs font-bold">
            <button type="button" onClick={() => setPeriodFilter('current_month')} className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${periodFilter === 'current_month' ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}>ماه جاری</button>
            <button type="button" onClick={() => setPeriodFilter('last_month')} className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${periodFilter === 'last_month' ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}>ماه گذشته</button>
            <button type="button" onClick={() => setPeriodFilter('quarter')} className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${periodFilter === 'quarter' ? 'bg-white dark:bg-[#0F1512] text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}>۳ ماه اخیر</button>
            <button type="button" onClick={() => setPeriodFilter('all')} className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${periodFilter === 'all' ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}>همه ({toPersianDigits(transactions.length)})</button>
          </div>
          <div className="flex items-center gap-3 text-xs"><span className="text-zinc-500">درآمد دوره: <b className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">+{formatToman(periodTotalIncome)}</b></span><span className="text-zinc-300 dark:text-zinc-700">|</span><span className="text-zinc-500">هزینه دوره: <b className="text-rose-600 dark:text-rose-400 font-bold font-mono">-{formatToman(periodTotalExpense)}</b></span></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجو در عنوان، دسته‌بندی یا مبلغ..." className="w-full pr-9 pl-4 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo" /></div>
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-xl text-xs font-cairo font-bold">
            <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${typeFilter === 'all' ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}>همه انواع</button>
            <button onClick={() => setTypeFilter('expense')} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${typeFilter === 'expense' ? 'bg-white dark:bg-[#0F1512] text-rose-600 dark:text-rose-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}>هزینه‌ها</button>
            <button onClick={() => setTypeFilter('income')} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${typeFilter === 'income' ? 'bg-white dark:bg-[#0F1512] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}>درآمدها</button>
          </div>
          <div className="w-full sm:w-48"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"><option value="all">همه دسته‌ها</option>{allCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
        </div>
      </div>

      <div className="space-y-4">
        {groupedByDay.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-3 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621]"><Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" /><p className="text-xs sm:text-sm">هیچ تراکنشی در بازه انتخابی یافت نشد.</p><div className="flex items-center justify-center gap-2 pt-2"><button onClick={() => onOpenTransactionModal()} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs cursor-pointer shadow-xs transition">ثبت اولین تراکنش</button>{onOpenBankSmsModal && (<button onClick={onOpenBankSmsModal} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-cairo font-bold text-xs cursor-pointer shadow-xs transition">پردازش پیامک بانکی</button>)}</div></div>
        ) : (
          groupedByDay.map((group) => (
            <div key={group.dateKey} className="bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-[#121B17] border-b border-[#E2E8E4] dark:border-[#1A2621] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">{group.displayDate}</span><span className="text-[11px] text-zinc-400">({toPersianDigits(group.items.length)} تراکنش)</span></div>
                <div className="flex items-center gap-3 text-xs font-mono">{group.totalIncome > 0 && (<span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">درآمد: +{formatToman(group.totalIncome)}</span>)}{group.totalExpense > 0 && (<span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]">هزینه: -{formatToman(group.totalExpense)}</span>)}</div>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-[#1A2621]/80">
                {group.items.map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-[#121B17] transition">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-[#13251D] dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-[#251515] dark:text-rose-300'}`}>{tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}</div>
                      <div className="min-w-0"><h4 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{tx.description}</h4><div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500"><span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#15201A] text-[11px]">{tx.category}</span>{tx.account && (<><span>•</span><span className="text-[11px] text-zinc-400">{tx.account}</span></>)}</div></div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-left font-cairo"><span className={`text-base font-bold ${tx.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>{tx.type === 'income' ? '+ ' : '- '}{formatToman(tx.amount)}</span></div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onOpenTransactionModal(tx)} title="ویرایش" className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-[#16251E] transition cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) deleteTransaction(tx.id); }} title="حذف" className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#281515] transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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