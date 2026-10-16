import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Sparkles, Building2, Calendar, ArrowDownLeft, ArrowUpRight, Tag, FileText, Loader2, Crown } from 'lucide-react';
import { TransactionCategory, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface BankSmsModalProps { isOpen: boolean; onClose: () => void; onSaveTransaction: (tx: { type: TransactionType; amount: number; category: TransactionCategory; description: string; account?: string; date: string; }) => void; }

export const BankSmsModal: React.FC<BankSmsModalProps> = ({ isOpen, onClose, onSaveTransaction }) => {
  const { hasAIAccess, isProUser, openSubscriptionModal, setActiveTab } = useApp();
  const [rawText, setRawText] = useState('');
  const [isParsed, setIsParsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedAmount, setExtractedAmount] = useState<number>(0);
  const [extractedType, setExtractedType] = useState<TransactionType>('expense');
  const [extractedBank, setExtractedBank] = useState<string>('کارت بانکی');
  const [extractedDate, setExtractedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [extractedTitle, setExtractedTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('خوراک و رستوران');
  const [customDescription, setCustomDescription] = useState('');

  if (!isOpen) return null;

  const handleParseSms = async () => {
    setParseError(null);
    if (!hasAIAccess || !isProUser) { setParseError('استخراج هوشمند پیامک بانکی نیازمند اشتراک است.'); return; }
    const text = rawText.trim();
    if (!text) { setParseError('لطفاً متن پیامک بانکی را وارد فرمایید.'); return; }
    setIsProcessing(true);
    try {
      const historyPayload = [{ role: 'user' as const, content: text }];
      const response = await invokeAiAssistantEdgeFunction(text, historyPayload);
      if (!response.success) { setParseError(response.error || 'خطا در ارتباط با هوش مصنوعی'); setIsProcessing(false); return; }
      if (response.requires_confirmation && response.action && response.action.type === 'create_transaction') {
        const tx = response.action.params;
        const amount = Number(tx.amount) || 0;
        if (amount <= 0) { setParseError('مبلغ معتبری در متن شناسایی نشد.'); setIsProcessing(false); return; }
        setExtractedAmount(amount);
        setExtractedType(tx.type === 'income' ? 'income' : 'expense');
        setExtractedBank(tx.account || tx.bank || 'کارت بانکی شتاب');
        setExtractedTitle(tx.description || tx.title || '');
        setExtractedDate(tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        const cleanDesc = tx.description && tx.description !== text ? tx.description : `${tx.type === 'income' ? 'واریزی' : 'برداشت'} ${tx.bank || tx.account || 'بانک'}`;
        setCustomDescription(cleanDesc);
        setSelectedCategory(tx.category || (tx.type === 'income' ? 'حقوق و دستمزد' : 'خوراک و رستوران'));
        setIsParsed(true);
      } else { setParseError(response.reply || 'متن وارد شده شامل اطلاعات تراکنش مالی معتبر نمی‌باشد.'); }
    } catch (err: any) { console.error('Error parsing transaction text:', err); setParseError(err?.message || 'خطا در برقراری ارتباط با هوش مصنوعی'); }
    finally { setIsProcessing(false); }
  };

  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedAmount <= 0) return;
    onSaveTransaction({ type: extractedType, amount: extractedAmount, category: selectedCategory, description: customDescription.trim() || extractedTitle || `${extractedType === 'income' ? 'واریز' : 'برداشت'} - ${extractedBank}`, account: extractedBank, date: new Date(extractedDate).toISOString() });
    setRawText(''); setIsParsed(false); setExtractedAmount(0); setExtractedTitle(''); setCustomDescription(''); setParseError(null);
    onClose();
  };

  const handleReset = () => { setRawText(''); setIsParsed(false); setExtractedAmount(0); setExtractedTitle(''); setCustomDescription(''); setParseError(null); };
  const categories = extractedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-cairo">
      <div id="bank-sms-modal" className="w-full max-w-lg bg-white dark:bg-[#0E1511] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1F2E27] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300"><Sparkles className="w-5 h-5" /></div>
            <div><h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">پردازش هوشمند پیامک بانکی و فیش</h3><p className="text-xs text-zinc-500">استخراج قطعی داده‌ها با تایید و انتخاب دستی دسته‌بندی توسط شما</p></div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {!hasAIAccess || !isProUser ? (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border-2 border-amber-300 dark:border-amber-700 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto"><Crown className="w-7 h-7" /></div>
            <h4 className="font-cairo text-sm font-bold text-amber-900 dark:text-amber-200">ویژه مشترکین طلایی (پرو)</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">قابلیت استخراج هوشمند پیامک بانکی فقط برای کاربران دارای اشتراک فعال است.</p>
            <button type="button" onClick={() => { onClose(); if (openSubscriptionModal) openSubscriptionModal(); else setActiveTab('subscription'); }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"><Crown className="w-3.5 h-3.5" /><span>مشاهده و خرید اشتراک طلایی</span></button>
          </div>
        ) : parseError ? (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-2"><div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{parseError}</span></div>{parseError.includes('اشتراک') && (<button type="button" onClick={() => { onClose(); if (openSubscriptionModal) openSubscriptionModal(); }} className="shrink-0 px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[11px] hover:bg-amber-400 transition cursor-pointer">مشاهده و خرید اشتراک</button>)}</div>
        ) : !isParsed ? (
          <div className="space-y-4">
            <div><label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">متن پیامک یا رسید پرداخت را اینجا جای‌گذاری (Paste) کنید:</label><textarea rows={5} value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="مثال: برداشت از کارت سامان به مبلغ ۵۸۰,۰۰۰ ریال به حساب ... تاریخ ۱۴۰۵/۰۷/۱۸ ساعت ۱۲:۳۰" className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-2xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono resize-none leading-relaxed text-right" /></div>
            <div className="flex items-center justify-between pt-1"><span className="text-[11px] text-zinc-400">پشتیبانی از تمامی بانک‌های عضو شتاب</span><button type="button" onClick={handleParseSms} disabled={isProcessing} className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">{isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>در حال پردازش هوشمند...</span></>) : (<><Sparkles className="w-4 h-4" /><span>استخراج و مرحله بعد</span></>)}</button></div>
          </div>
        ) : (
          <form onSubmit={handleConfirmAndSave} className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#1F2E27]"><span className="text-xs text-zinc-500 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-emerald-600" />بانک شناسایی‌شده:</span><span className="font-bold text-xs text-zinc-900 dark:text-white">{extractedBank}</span></div>
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#1F2E27]"><span className="text-xs text-zinc-500 flex items-center gap-1.5">{extractedType === 'income' ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />}نوع و مبلغ استخراج‌شده:</span><div className="text-left"><span className={`font-cairo font-black text-base ${extractedType === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{extractedType === 'income' ? '+' : '-'} {formatToman(extractedAmount)}</span><span className="text-[10px] text-zinc-400 block">({extractedType === 'income' ? 'واریز' : 'برداشت'})</span></div></div>
              {extractedTitle && (<div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#1F2E27]"><span className="text-xs text-zinc-500 flex items-center gap-1.5"><FileText className="w-4 h-4 text-zinc-400" />عنوان استخراج‌شده:</span><span className="font-bold text-xs text-zinc-900 dark:text-white">{extractedTitle}</span></div>)}
              <div className="flex items-center justify-between text-xs"><span className="text-zinc-500 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-zinc-400" />تاریخ ثبت:</span><span className="font-mono text-zinc-700 dark:text-zinc-300">{extractedDate}</span></div>
            </div>
            <div className="space-y-2"><label className="block text-xs font-cairo font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"><Tag className="w-4 h-4 text-emerald-600" /><span>لطفاً دسته‌بندی این تراکنش را مشخص فرمایید *</span></label><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{categories.map((cat) => { const isSelected = selectedCategory === cat; return (<button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`p-2 rounded-xl text-xs font-cairo font-bold transition cursor-pointer border ${isSelected ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500' : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1A2620]'}`}>{cat}</button>); })}</div></div>
            <div><label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4 text-zinc-400" /><span>توضیحات تکمیلی (اختیاری):</span></label><input type="text" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="مثلاً: خرید نان و اقلام سوپرمارکت" className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-600 font-cairo" /></div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E27]"><button type="button" onClick={handleReset} className="px-4 py-2 rounded-xl text-xs font-cairo font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer">اصلاح متن پیامک</button><button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /><span>ثبت نهایی تراکنش در چندبوم</span></button></div>
          </form>
        )}
      </div>
    </div>
  );
};