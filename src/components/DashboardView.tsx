import React, { useState, useRef } from 'react';
import { Wallet, TrendingDown, TrendingUp, Plus, Users, Bell, Sparkles, Send, Bot, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Crown, Lock, Trophy, Flame, CreditCard, Calendar, Mic, MicOff, Loader2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { TransactionCategory, TransactionType } from '../types';
import { getCachedDashboardChat, setCachedDashboardChat } from '../utils/aiCache';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { MONTHLY_QUESTS, getCompletedQuests, toggleQuestCompletion, calculateStreak } from '../utils/dailyQuests';

interface DashboardViewProps { onOpenTransactionModal: () => void; onOpenDongModal?: () => void; onOpenDailyQuestsModal?: () => void; onOpenBankSmsModal?: () => void; }
interface ChatMessage { id: string; sender: 'user' | 'assistant'; text: string; time: string; }
interface PendingAction { type: string; params: any; description: string; }
interface TransactionDraft { amount: number; type: TransactionType; clean_title: string; bank?: string | null; category: TransactionCategory; }

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenTransactionModal, onOpenDailyQuestsModal, onOpenBankSmsModal }) => {
  const { metrics, budgetInsight, transactions, user, setActiveTab, addTransaction, openSubscriptionModal, hasAIAccess, isProUser, isAuthenticated, setIsAuthModalOpen, createDongGroup, addGoal, addReminder } = useApp();
  
  const [aiInput, setAiInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedQuests, setCompletedQuests] = useState<number[]>(() => getCompletedQuests());
  const [questCelebration, setQuestCelebration] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<TransactionDraft | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingReply, setPendingReply] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isVipUser = user?.tier === 'vip';

  const todayDay = React.useMemo(() => { try { const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { day: 'numeric' }); const d = parseInt(formatter.format(new Date()), 10); return isNaN(d) ? new Date().getDate() : Math.min(Math.max(d, 1), 31); } catch { return new Date().getDate(); } }, []);
  const todayQuest = MONTHLY_QUESTS[todayDay - 1] || MONTHLY_QUESTS[0];
  const isTodayCompleted = completedQuests.includes(todayDay);
  const activeStreak = calculateStreak(completedQuests, todayDay);

  const handleToggleTodayQuest = () => { const res = toggleQuestCompletion(todayDay); setCompletedQuests(res.allDays); if (res.completed) { setQuestCelebration(true); setTimeout(() => setQuestCelebration(false), 3000); } };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => { const cached = getCachedDashboardChat(); if (cached && cached.length > 0) return cached; return [{ id: '1', sender: 'assistant', text: 'سلام! من «دستیار هوشمند چندبوم» هستم. می‌توانید هزینه‌ها را بنویسید، گروه دنگ بسازید، هدف مالی تعریف کنید یا یادآور تنظیم کنید.', time: 'هم‌اکنون' }]; });
  React.useEffect(() => { setCachedDashboardChat(chatMessages); }, [chatMessages]);

  const recentTransactions = transactions.slice(0, 5);
  const budgetUsagePercent = user.monthly_budget_cap > 0 ? Math.min(Math.round((metrics.totalExpense / user.monthly_budget_cap) * 100), 100) : 0;
  const quickPrompts = ['برام تحلیل کن که تا چند ماه آینده میتونم چیکار بکنم', 'ثبت هزینه ۵۰ هزار تومان سوپرمارکت', 'یه گروه دنگ به اسم سفر شمال با اعضای علی و رضا بساز', 'هدف مالی خرید لپ‌تاپ ۵۰ میلیون', 'یادآور قسط وام ۲ میلیون'];

  const handleConfirmDraft = async () => { if (!pendingDraft) return; await addTransaction({ type: pendingDraft.type, amount: pendingDraft.amount, category: pendingDraft.category, description: pendingDraft.clean_title, account: pendingDraft.bank || 'کارت اصلی', date: new Date().toISOString() }); setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `✅ تراکنش «${pendingDraft.clean_title}» به مبلغ ${formatToman(pendingDraft.amount)} ثبت شد.`, time: 'هم‌اکنون' }]); setPendingDraft(null); };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsTyping(true);
    try {
      let success = false; let successMessage = '';
      switch (pendingAction.type) {
        case 'create_dong_group': { const { name, members } = pendingAction.params; const result = await createDongGroup(name, members || [], false); if (result.success) { success = true; successMessage = `✅ گروه دنگ «${name}» با ${members?.length || 0} عضو ساخته شد.`; } else throw new Error(result.error); break; }
        case 'create_goal': { const { title, target_amount, deadline, category } = pendingAction.params; await addGoal({ title: title || pendingAction.description, target_amount: Number(target_amount) || 0, current_amount: 0, deadline: deadline || null, category: category || 'سایر', status: 'in_progress', notes: '' }); success = true; successMessage = `✅ هدف مالی «${title}» ساخته شد.`; break; }
        case 'create_reminder': { const { title, amount, due_date, recurrence } = pendingAction.params; await addReminder({ title: title || pendingAction.description, amount: Number(amount) || 0, due_date: due_date || new Date().toISOString(), category: 'قبوض و شارژ', is_paid: false, recurrence: recurrence || 'once' }); success = true; successMessage = `✅ یادآور «${title}» تنظیم شد.`; break; }
        default: throw new Error(`نوع action ناشناخته: ${pendingAction.type}`);
      }
      if (success) { setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `${pendingReply}\n\n${successMessage}`, time: 'هم‌اکنون' }]); setPendingAction(null); setPendingReply(''); }
    } catch (err: any) { setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `❌ خطا: ${err.message}`, time: 'هم‌اکنون' }]); setPendingAction(null); }
    finally { setIsTyping(false); }
  };

  const handleRejectAction = () => { setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: '❌ عملیات لغو شد.', time: 'هم‌اکنون' }]); setPendingAction(null); setPendingReply(''); };

  const toggleVoiceRecognition = () => {
    if (!isVipUser) { alert(' قابلیت ورودی صوتی فقط برای کاربران VIP فعال است.'); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.'); return; }
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    try {
      const recognition = new SpeechRecognition(); recognitionRef.current = recognition; recognition.lang = 'fa-IR'; recognition.continuous = false; recognition.interimResults = false;
      recognition.onstart = () => { setIsListening(true); };
      recognition.onresult = (event: any) => { const transcript = event.results?.[0]?.[0]?.transcript; if (transcript) { setAiInput(transcript); setTimeout(() => handleSendPrompt(transcript), 500); } setIsListening(false); };
      recognition.onerror = () => { setIsListening(false); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch { setIsListening(false); }
  };

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    if (!hasAIAccess) { if (openSubscriptionModal) openSubscriptionModal(); else setActiveTab('subscription'); return; }
    const userText = textToSend.trim();
    const newMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userText, time: 'لحظاتی پیش' };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages); setAiInput(''); setIsTyping(true); setPendingDraft(null); setPendingAction(null);
    try {
      const historyPayload = updatedMessages.map((m): { role: 'user' | 'assistant'; content: string } => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
      const response = await invokeAiAssistantEdgeFunction(userText, historyPayload);
      if (response.success && response.reply) {
        if (response.action && response.requires_confirmation) {
          setPendingReply(response.reply);
          if (response.action.type === 'create_transaction') { setPendingDraft({ amount: response.action.params?.amount || 0, type: response.action.params?.type || 'expense', clean_title: response.action.params?.description || userText, category: response.action.params?.category || 'سایر و متفرقه' }); }
          else { setPendingAction({ type: response.action.type, params: response.action.params, description: response.action.description }); }
        } else { setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: response.reply, time: 'هم‌اکنون' }]); }
      } else { setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: response.error || 'خطا در ارتباط با هوش مصنوعی', time: 'هم‌اکنون' }]); }
    } catch (err: any) { setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: err?.message || 'خطا در پردازش', time: 'هم‌اکنون' }]); }
    finally { setIsTyping(false); }
  };

  const handleChatSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSendPrompt(aiInput); };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">سلام، {user.full_name} خوش آمدید </h2><p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">خلاصه وضعیت مالی و فعالیت‌های اخیر شما</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBankSmsModal && (<button onClick={onOpenBankSmsModal} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-[#131F2A] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 font-cairo font-bold text-xs transition cursor-pointer shadow-xs"><CreditCard className="w-4 h-4" /><span>پردازش پیامک بانکی</span></button>)}
          {onOpenDailyQuestsModal && (<button onClick={onOpenDailyQuestsModal} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-[#221B0F] text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 hover:bg-amber-100 font-cairo font-bold text-xs transition cursor-pointer shadow-xs"><Trophy className="w-4 h-4" /><span>چالش ۳۰ روزه</span></button>)}
          <button onClick={() => setActiveTab('dong')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border border-[#E2E8E4] dark:border-[#1A2621] hover:bg-zinc-50 dark:hover:bg-[#16221D] font-cairo font-bold text-xs transition cursor-pointer shadow-xs"><Users className="w-4 h-4" /><span>محاسبه دنگ</span></button>
          <button onClick={onOpenTransactionModal} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"><Plus className="w-4 h-4" /><span>ثبت تراکنش سریع</span></button>
        </div>
      </div>

      <div id="todays-quest-widget" className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-xs ${isTodayCompleted ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-[#11221A] dark:via-[#0F1C16] dark:to-[#0C1511] border-emerald-300 dark:border-emerald-800/80' : 'bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white dark:from-[#1C160B] dark:via-[#161208] dark:to-[#0F1512] border-amber-200 dark:border-amber-900/60'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 transition-transform duration-300 ${isTodayCompleted ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'}`}>{isTodayCompleted ? <CheckCircle2 className="w-6 h-6 animate-in zoom-in" /> : <Trophy className="w-6 h-6" />}</div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1"><span>تسک امروز</span><span>(روز {toPersianDigits(todayDay)} از ۳۰)</span></span>{activeStreak > 0 && (<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /><span>{toPersianDigits(activeStreak)} روز استریک پیوسته</span></span>)}</div>
              <h4 className="font-cairo text-sm sm:text-base font-black text-zinc-900 dark:text-white">{todayQuest.title}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">{todayQuest.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button onClick={handleToggleTodayQuest} className={`px-4 py-2.5 rounded-2xl font-cairo font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs ${isTodayCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200' : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 shadow-md shadow-amber-500/20 active:scale-95'}`}>{isTodayCompleted ? (<><CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /><span>انجام شد ✓</span></>) : (<><Sparkles className="w-4 h-4 text-zinc-950" /><span>انجام دادم!</span></>)}</button>
            {onOpenDailyQuestsModal && (<button onClick={onOpenDailyQuestsModal} className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#15231C] border border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 text-xs font-bold font-cairo transition cursor-pointer">تقویم ۳۰ روزه</button>)}
          </div>
        </div>
        {questCelebration && (<div className="mt-3 p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-cairo font-bold flex items-center justify-between animate-in fade-in zoom-in-95"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-300" /><span>آفرین! تسک امروز شما با موفقیت ثبت شد! 🎉</span></div><span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">+ امتیاز مثبت</span></div>)}
      </div>

      {isProUser ? (
        <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 ${budgetInsight.isWarning ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200' : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'}`}>
          <div className="flex items-center gap-3"><div className={`p-2 rounded-xl shrink-0 ${budgetInsight.isWarning ? 'bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}><Sparkles className="w-5 h-5" /></div><div><h4 className="font-cairo font-bold text-xs sm:text-sm">پیش‌بینی هوشمند بودجه (هوش مصنوعی):</h4><p className="text-xs mt-0.5 leading-relaxed">{budgetInsight.message}</p></div></div>
          <button onClick={() => setActiveTab('analytics')} className="hidden sm:flex items-center gap-1 text-xs font-cairo font-bold shrink-0 hover:underline cursor-pointer"><span>مشاهده تحلیل‌ها</span><ArrowRight className="w-3.5 h-3.5 rotate-180" /></button>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-300/60 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-yellow-50/80 dark:from-[#17140B] dark:via-[#1D190D] dark:to-[#120F08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3"><div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 shrink-0"><Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div><div><div className="flex items-center gap-2"><h4 className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">پیش‌بینی هوشمند بودجه</h4><span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/40">ویژه کاربران پرو</span></div><p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">این فیلد تحلیلی فقط برای کاربران دارای اشتراک طلایی (پرو) فعال است.</p></div></div>
          <button onClick={() => setActiveTab('subscription')} className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-cairo font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"><Crown className="w-3.5 h-3.5 text-zinc-950" /><span>خرید اشتراک طلایی پرو</span></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-zinc-500">موجودی خالص حساب</span><div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15281F] dark:text-emerald-300"><Wallet className="w-4 h-4" /></div></div><div className={`font-cairo text-2xl sm:text-3xl font-black ${metrics.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatToman(metrics.balance)}</div><div className="text-[11px] text-zinc-400">تراز کل دریافتی‌ها منهای پرداختی‌ها</div></div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-zinc-500">درآمدهای ثبت‌شده ماه</span><div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#13251D] dark:text-emerald-300"><TrendingUp className="w-4 h-4" /></div></div><div className="font-cairo text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{formatToman(metrics.totalIncome)}</div><div className="text-[11px] text-zinc-400">حقوق، سود بانکی و واریزی‌ها</div></div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-zinc-500">هزینه‌ها و سقف بودجه</span><div className="p-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-[#251515] dark:text-rose-300"><TrendingDown className="w-4 h-4" /></div></div><div className="font-cairo text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{formatToman(metrics.totalExpense)}</div><div className="space-y-1"><div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${budgetUsagePercent > 85 ? 'bg-rose-600' : budgetUsagePercent > 65 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${budgetUsagePercent}%` }} /></div><div className="flex justify-between text-[10px] text-zinc-400"><span>مصرف بودجه: {toPersianDigits(budgetUsagePercent)}٪</span><span>سقف: {formatToman(user.monthly_budget_cap)}</span></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/50 dark:bg-[#121A16] flex items-center justify-between">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-xs"><Bot className="w-4 h-4" /></div><div><h3 className="font-cairo text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><span>دستیار هوشمند چندبوم</span><span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">دستیار اختصاصی مالی</span></h3><p className="text-[11px] text-zinc-400">ثبت خودکار تراکنش‌ها، تحلیل ۳ ماه آینده و نظارت بر سقف بودجه</p></div></div>
            {!hasAIAccess && (<button onClick={() => (openSubscriptionModal ? openSubscriptionModal() : setActiveTab('subscription'))} className="text-[11px] font-cairo font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /><span>ارتقا به پلن برنزی یا طلایی</span></button>)}
          </div>

          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[300px]">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 text-xs leading-relaxed ${msg.sender === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 ${msg.sender === 'assistant' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'}`}>{msg.sender === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}</div>
                <div className={`max-w-[85%] p-3.5 rounded-2xl ${msg.sender === 'assistant' ? 'bg-zinc-100 dark:bg-[#15231C] text-zinc-900 dark:text-zinc-100 rounded-tr-xs' : 'bg-emerald-700 text-white rounded-tl-xs shadow-xs'}`}><p className="whitespace-pre-line font-cairo">{msg.text}</p><span className={`block text-[9px] mt-1 text-left ${msg.sender === 'assistant' ? 'text-zinc-400' : 'text-emerald-200'}`}>{msg.time}</span></div>
              </div>
            ))}
            {isTyping && (<div className="flex items-center gap-2 text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" /><div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-100" /><div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-200" /><span>دستیار هوشمند چندبوم در حال پردازش است...</span></div>)}

            {pendingDraft && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#16251E] border-2 border-amber-400/80 shadow-md space-y-3 animate-in fade-in zoom-in-95 font-cairo text-right">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-emerald-800/40 pb-2"><div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs"><Sparkles className="w-4 h-4 text-amber-500" /><span>پیش‌نویس تراکنش هوشمند</span></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">{pendingDraft.type === 'expense' ? 'هزینه' : 'درآمد'}</span></div>
                <div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-zinc-500 text-[10px] block">عنوان استخراج‌شده:</span><span className="font-bold text-zinc-900 dark:text-white truncate block">{pendingDraft.clean_title}</span></div><div><span className="text-zinc-500 text-[10px] block">مبلغ دقیق:</span><span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatToman(pendingDraft.amount)}</span></div></div>
                <div className="space-y-1"><label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">دسته‌بندی تراکنش را تایید یا انتخاب کنید:</label><select value={pendingDraft.category} onChange={(e) => setPendingDraft({ ...pendingDraft, category: e.target.value as TransactionCategory })} className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1713] border border-zinc-300 dark:border-emerald-700/60 text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 font-cairo">{(pendingDraft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                <div className="flex items-center gap-2 pt-1"><button type="button" onClick={handleConfirmDraft} className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"><CheckCircle2 className="w-3.5 h-3.5" /><span>تایید و ثبت نهایی</span></button><button type="button" onClick={() => setPendingDraft(null)} className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-[#1E2C25] text-zinc-600 dark:text-zinc-300 font-bold text-xs transition cursor-pointer">انصراف</button></div>
              </div>
            )}

            {pendingAction && (
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-[#1a1525] border-2 border-purple-400/80 shadow-md space-y-3 animate-in fade-in zoom-in-95 font-cairo text-right">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/40 pb-2">
                  <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>{pendingAction.type === 'create_dong_group' ? 'پیشنهاد ساخت گروه دنگ' : pendingAction.type === 'create_goal' ? 'پیشنهاد تعریف هدف مالی' : pendingAction.type === 'create_reminder' ? 'پیشنهاد تنظیم یادآور' : 'انجام عملیات'}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-2 leading-relaxed">{pendingReply}</p>
                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-black/20 p-2 rounded-lg">📋 {pendingAction.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={handleConfirmAction} disabled={isTyping} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs">{isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} <span>{isTyping ? 'در حال انجام...' : 'بله، انجام بده'}</span></button>
                  <button type="button" onClick={handleRejectAction} disabled={isTyping} className="flex-1 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-[#1E2C25] text-zinc-600 dark:text-zinc-300 font-bold text-xs transition cursor-pointer"><X className="w-3.5 h-3.5 inline mr-1" /> انصراف</button>
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-2 bg-zinc-50/70 dark:bg-[#101814] border-t border-[#E2E8E4] dark:border-[#1A2621] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-zinc-400 shrink-0 font-cairo">سوالات مجاز:</span>
            {quickPrompts.map((prompt, idx) => (<button key={idx} type="button" onClick={() => handleSendPrompt(prompt)} className="shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-[#16221D] border border-[#E2E8E4] dark:border-[#1F2F28] hover:border-amber-400 text-zinc-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 transition cursor-pointer">{prompt}</button>))}
          </div>

          {!isAuthenticated ? (
            <div className="p-3.5 border-t border-amber-300/40 bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-yellow-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-right"><div className="flex items-center gap-2"><Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /><span className="text-xs text-amber-950 dark:text-amber-200 font-cairo font-bold">هوش مصنوعی فقط برای کسانی که اشتراک پرو دارند فعال می‌شود. لطفاً ابتدا وارد حساب کاربری خود شوید.</span></div><button type="button" onClick={() => setIsAuthModalOpen(true)} className="shrink-0 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-cairo font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"><span>ورود به حساب / ثبت‌نام</span></button></div>
          ) : !hasAIAccess ? (
            <div className="p-3.5 border-t border-amber-300/40 bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-yellow-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-right"><div className="flex items-center gap-2"><Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /><span className="text-xs text-amber-950 dark:text-amber-200 font-cairo font-bold">طرح پایه (رایگان) فاقد هوش مصنوعی است. برای استفاده، حساب خود را به برنزی یا پرو ارتقا دهید.</span></div><button type="button" onClick={() => (openSubscriptionModal ? openSubscriptionModal() : setActiveTab('subscription'))} className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-cairo font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /><span>مشاهده پلن‌ها و فعال‌سازی هوش مصنوعی</span></button></div>
          ) : (
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-[#E2E8E4] dark:border-[#1A2621] bg-white dark:bg-[#0E1511] flex items-center gap-2">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="پیام مالی خود را بنویسید (مثلاً: ثبت کن ۰ تومن بنزین)..." className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo" />
              {isVipUser ? (
                <button type="button" onClick={toggleVoiceRecognition} disabled={isTyping} className={`p-2.5 rounded-xl transition cursor-pointer disabled:opacity-50 ${isListening ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' : 'bg-purple-600 hover:bg-purple-700 text-white'}`} title={isListening ? 'توقف ضبط صدا' : 'ورودی صوتی (ویژه VIP)'}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
              ) : (
                <button type="button" onClick={() => alert(' قابلیت ورودی صوتی فقط برای کاربران VIP فعال است.')} className="p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed" title="ورودی صوتی (فقط VIP)"><Mic className="w-4 h-4" /></button>
              )}
              <button type="submit" disabled={!aiInput.trim()} className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-50"><Send className="w-4 h-4 rotate-180" /></button>
            </form>
          )}
          {isListening && (<div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 flex items-center gap-2"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /><div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse delay-100" /><div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse delay-200" /></div><span className="text-xs text-purple-700 dark:text-purple-300 font-cairo font-bold">در حال گوش دادن...</span><button type="button" onClick={toggleVoiceRecognition} className="ml-auto px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition cursor-pointer">توقف</button></div>)}
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div><div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1A2621]"><h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">آخرین تراکنش‌ها</h3><button onClick={() => setActiveTab('transactions')} className="text-xs font-cairo font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer">مشاهده همه</button></div><div className="divide-y divide-zinc-100 dark:divide-[#1A2621]/60 mt-2">{recentTransactions.length === 0 ? (<div className="py-8 text-center text-xs text-zinc-400">هنوز هیچ تراکنشی ثبت نشده است.</div>) : (recentTransactions.map((tx) => (<div key={tx.id} className="py-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">{tx.description}</p><div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5"><span>{tx.category}</span><span>•</span><span>{formatShamsiDate(tx.date)}</span></div></div><span className={`font-cairo font-bold text-xs sm:text-sm shrink-0 ${tx.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>{tx.type === 'income' ? '+ ' : '- '}{formatToman(tx.amount)}</span></div>)))}</div></div>
          <button onClick={onOpenTransactionModal} className="w-full py-2.5 rounded-xl border border-dashed border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-[#13221A] text-xs font-cairo font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"><Plus className="w-4 h-4" /><span>ثبت تراکنش تازه</span></button>
        </div>
      </div>
    </div>
  );
};