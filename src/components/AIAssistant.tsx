import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Crown, RotateCcw, CheckCircle2, AlertCircle, HelpCircle, Users, Target, Bell, X, MessageSquare, Loader2, Calendar, Mic, MicOff, Volume2, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { trackAiQuerySent, trackAiQuotaExceeded } from '../lib/analytics';
import { toPersianDigits, formatToman } from '../utils/formatters';
import { TransactionCategory, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';

interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; }
interface PendingAction { type: string; params: any; description: string; }

const STORAGE_KEY = 'cb_session_ai_chat';
const QUICK_PROMPTS = [
  { icon: Users, label: 'ساخت گروه دنگ', prompt: 'یه گروه دنگ به اسم سفر شمال با اعضای علی، رضا و محمد بساز' },
  { icon: Target, label: 'تعریف هدف مالی', prompt: 'یه هدف مالی برای خرید لپ‌تاپ به مبلغ ۵۰ میلیون تومان تا ۶ ماه آینده بساز' },
  { icon: Bell, label: 'تنظیم یادآور', prompt: 'یادآور پرداخت اجاره ماهانه ۱۵ میلیون تومان برای اول هر ماه' },
  { icon: HelpCircle, label: 'ثبت تراکنش', prompt: 'ثبت هزینه ۵۰ هزار تومان برای ناهار امروز' },
];

export const AIAssistant: React.FC<{ isOpen?: boolean; onClose?: () => void; initialMode?: 'agent' | 'advisor' }> = ({ isOpen = true, onClose, initialMode = 'agent' }) => {
  const { user, hasAIAccess, isProUser, setActiveTab, openSubscriptionModal, addTransaction, createDongGroup, addGoal, addReminder } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<'agent' | 'advisor'>(initialMode);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQueries, setRemainingQueries] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingReply, setPendingReply] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const isVip = user?.tier === 'vip';

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) setMessages(parsed); } } catch {} const handleUnload = () => { localStorage.removeItem(STORAGE_KEY); }; window.addEventListener('beforeunload', handleUnload); return () => { window.removeEventListener('beforeunload', handleUnload); }; }, []);
  useEffect(() => { try { if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); else localStorage.removeItem(STORAGE_KEY); } catch {} messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, pendingAction]);

  const handleClearHistory = () => { setMessages([]); localStorage.removeItem(STORAGE_KEY); setErrorMessage(null); };

  const startVoiceInput = () => {
    if (!isVip) { setVoiceError('قابلیت گفت‌وگوی صوتی فقط برای اشتراک VIP فعال است.'); return; }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) { setVoiceError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفاً از نسخه به‌روز Chrome یا Edge استفاده کنید.'); return; }
    setVoiceError(null);
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'fa-IR'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => { setIsListening(false); setVoiceError(event?.error === 'not-allowed' ? 'برای استفاده از ویس، اجازه دسترسی به میکروفون را فعال کن.' : 'تشخیص صدا انجام نشد؛ دوباره تلاش کن.'); };
    recognition.onresult = (event: any) => { const transcript = event?.results?.[0]?.[0]?.transcript; if (transcript) setInputValue((prev) => prev ? `${prev} ${transcript}` : transcript); };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setIsListening(false); setVoiceError('میکروفون در حال استفاده است یا امکان شروع ضبط وجود ندارد.'); }
  };

  const speakLatestReply = () => {
    if (!isVip) { setVoiceError('پخش صوتی پاسخ‌ها فقط برای اشتراک VIP فعال است.'); return; }
    if (!(window as any).speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') { setVoiceError('مرورگر شما از پخش صوتی پشتیبانی نمی‌کند.'); return; }
    const latestReply = [...messages].reverse().find((m) => m.role === 'assistant')?.content;
    if (!latestReply) { setVoiceError('هنوز پاسخی برای پخش وجود ندارد.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestReply); utterance.lang = 'fa-IR'; utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance); setVoiceError(null);
  };

  useEffect(() => () => { try { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); } catch {} }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;
    const lower = text.toLowerCase();
    const isProhibited = lower.includes('فیش') || lower.includes('رسید') || lower.includes('واریز') || lower.includes('ادمین') || lower.includes('رمز عبور') || lower.includes('پسورد') || lower.includes('پرداخت من');
    const userMsg: ChatMessage = { id: `usr-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue(''); setErrorMessage(null);
    if (isProhibited) { const botMsg: ChatMessage = { id: `ast-${Date.now()}`, role: 'assistant', content: 'من دستیار راهنمای امکانات چندبوم (شامل دنگ گروهی، اهداف مالی، یادآورها و سوالات متداول) هستم. برای پیگیری پرداخت‌ها، بررسی فیش یا ورود به حساب، لطفاً از بخش پشتیبانی (ارسال تیکت) استفاده فرمایید.', timestamp: new Date().toISOString() }; setMessages((prev) => [...prev, botMsg]); return; }
    
    setIsLoading(true); trackAiQuerySent(mode === 'advisor' ? 'financial_advisor' : 'assistant_agent');
    try {
      const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await invokeAiAssistantEdgeFunction(text, historyPayload, mode);
      if (response.success && response.reply) {
        if (mode === 'agent' && response.action && response.requires_confirmation) { setPendingReply(response.reply); setPendingAction({ type: response.action.type, params: response.action.params, description: response.action.description }); }
        else { const botMsg: ChatMessage = { id: `ast-${Date.now()}`, role: 'assistant', content: response.reply, timestamp: new Date().toISOString() }; setMessages((prev) => [...prev, botMsg]); }
        if (typeof response.remaining_queries === 'number') setRemainingQueries(response.remaining_queries);
      } else { if (response.code === 'QUOTA_EXCEEDED') trackAiQuotaExceeded(); setErrorMessage(response.error || 'خطا در ارتباط با سرور هوش مصنوعی چندبوم.'); }
    } catch (err: any) { setErrorMessage(err?.message || 'برقراری ارتباط با هوش مصنوعی میسر نشد.'); }
    finally { setIsLoading(false); }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsLoading(true);
    try {
      let success = false; let successMessage = '';
      switch (pendingAction.type) {
        case 'create_transaction': { const { amount, category, type, description, date } = pendingAction.params; await addTransaction({ amount: Number(amount), category: category || 'سایر و متفرقه', type: type || 'expense', description: description || pendingAction.description, date: date || new Date().toISOString(), account: 'ثبت توسط AI' }); success = true; successMessage = `✅ تراکنش با موفقیت ثبت شد.`; break; }
        case 'create_dong_group': { const { name, members } = pendingAction.params; const result = await createDongGroup(name, members || [], false); if (result.success) { success = true; successMessage = `✅ گروه دنگ «${name}» با ${members?.length || 0} عضو ساخته شد.`; } else throw new Error(result.error || 'خطا در ساخت گروه'); break; }
        case 'create_goal': { const { title, target_amount, deadline, category, notes } = pendingAction.params; await addGoal({ title: title || pendingAction.description, target_amount: Number(target_amount) || 0, current_amount: 0, deadline: deadline || null, category: category || 'سایر', status: 'in_progress', notes: notes || '' }); success = true; successMessage = `✅ هدف مالی «${title}» ساخته شد.`; break; }
        case 'create_reminder': { const { title, amount, due_date, category, recurrence } = pendingAction.params; await addReminder({ title: title || pendingAction.description, amount: Number(amount) || 0, due_date: due_date || new Date().toISOString(), category: category || 'سایر', is_paid: false, recurrence: recurrence || 'once' }); success = true; successMessage = `✅ یادآور «${title}» تنظیم شد.`; break; }
        default: throw new Error(`نوع action ناشناخته: ${pendingAction.type}`);
      }
      if (success) { const successMsg: ChatMessage = { id: `msg-${Date.now()}-ok`, role: 'assistant', content: `${pendingReply}\n\n${successMessage}`, timestamp: new Date().toISOString() }; setMessages((prev) => [...prev, successMsg]); setPendingAction(null); setPendingReply(''); }
    } catch (err: any) { const errorMsg: ChatMessage = { id: `msg-${Date.now()}-fail`, role: 'assistant', content: `❌ خطا در انجام عملیات: ${err.message}`, timestamp: new Date().toISOString() }; setMessages((prev) => [...prev, errorMsg]); setPendingAction(null); }
    finally { setIsLoading(false); }
  };

  const handleRejectAction = () => { const rejectMsg: ChatMessage = { id: `msg-${Date.now()}-rej`, role: 'assistant', content: ' عملیات لغو شد. اگر سوال دیگری دارید، در خدمتم.', timestamp: new Date().toISOString() }; setMessages((prev) => [...prev, rejectMsg]); setPendingAction(null); setPendingReply(''); };
  const getActionIcon = (type: string) => { switch (type) { case 'create_transaction': return MessageSquare; case 'create_dong_group': return Users; case 'create_goal': return Target; case 'create_reminder': return Bell; default: return Sparkles; } };
  const getActionTitle = (type: string) => { switch (type) { case 'create_transaction': return 'ثبت تراکنش'; case 'create_dong_group': return 'ساخت گروه دنگ'; case 'create_goal': return 'تعریف هدف مالی'; case 'create_reminder': return 'تنظیم یادآور'; default: return 'انجام عملیات'; } };
  const isSubscriptionActive = hasAIAccess;
  if (!isOpen) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-[#0E1612] border border-[#E2E8E4] dark:border-[#1E2D24] rounded-3xl shadow-xl overflow-hidden flex flex-col font-cairo">
      <div className="p-4 sm:p-5 border-b border-[#E2E8E4] dark:border-[#1E2D24] bg-zinc-50 dark:bg-[#131F19] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Bot className="w-5 h-5" /></div>
          <div><div className="flex items-center gap-2"><h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">{mode === 'advisor' ? 'مشاور مالی هوشمند چندبوم' : 'دستیار اجرایی چندبوم'}</h2><span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 font-black flex items-center gap-1"><Crown className="w-3 h-3" /><span>{user.tier === 'vip' ? 'اشتراک VIP' : user.tier === 'pro' ? 'اشتراک طلایی (Pro)' : user.tier === 'bronze' ? 'اشتراک برنزی' : 'ویژه کاربران اشتراکی'}</span></span></div><p className="text-[11px] text-zinc-500 dark:text-zinc-400">{mode === 'advisor' ? 'تحلیل شخصی‌سازی‌شده درآمد، هزینه، بودجه و اهداف آینده' : 'دنگ گروهی، ثبت تراکنش، اهداف مالی و یادآورها'}</p></div>
        </div>
        <div className="flex items-center gap-2">{remainingQueries !== null && (<span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">{toPersianDigits(remainingQueries)} پرسش باقی‌مانده</span>)}{messages.length > 0 && (<button onClick={handleClearHistory} title="پاکسازی تاریخچه گفت‌وگو" className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"><RotateCcw className="w-4 h-4" /></button>)}{onClose && (<button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"><X className="w-4 h-4" /></button>)}</div>
      </div>

      {isSubscriptionActive && (
        <div className="px-4 sm:px-5 pt-4 bg-white dark:bg-[#0E1612]">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 dark:bg-[#101914] p-1.5 border border-[#E2E8E4] dark:border-[#1E2D24]" role="tablist" aria-label="حالت دستیار هوشمند">
            <button type="button" role="tab" aria-selected={mode === 'agent'} onClick={() => { setMode('agent'); setMessages([]); setPendingAction(null); setPendingReply(''); setErrorMessage(null); localStorage.removeItem(STORAGE_KEY); }} className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'agent' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-white/5'}`}>
              <Bot className="w-4 h-4" /> دستیار اجرایی
            </button>
            <button type="button" role="tab" aria-selected={mode === 'advisor'} onClick={() => { setMode('advisor'); setMessages([]); setPendingAction(null); setPendingReply(''); setErrorMessage(null); localStorage.removeItem(STORAGE_KEY); }} className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'advisor' ? 'bg-amber-500 text-zinc-950 shadow-sm' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-white/5'}`}>
              <Sparkles className="w-4 h-4" /> مشاور مالی هوشمند
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            {mode === 'advisor' ? 'تحلیل بر اساس تراکنش‌ها، اهداف و یادآورهای واقعی حساب شما؛ در این حالت هیچ عملیاتی ثبت نمی‌شود.' : 'برای ثبت تراکنش، ساخت گروه دنگ، تعریف هدف یا تنظیم یادآور؛ عملیات فقط با تأیید شما انجام می‌شود.'}
          </p>
        </div>
      )}

      {!isSubscriptionActive ? (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-radial from-emerald-950/20 to-transparent">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-4"><Crown className="w-8 h-8" /></div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2">ویژه کاربران دارای اشتراک برنزی، طلایی و VIP چندبوم</h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">پلن پایه (رایگان) فاقد هوش مصنوعی است. برای بهره‌مندی از دستیار هوشمند اختصاصی، ثبت سریع پیامک‌ها و تحلیل تراز مالی، لطفاً اشتراک خود را به یکی از پلن‌های برنزی، طلایی (Pro) یا VIP ارتقا دهید.</p>
          <button onClick={() => { if (openSubscriptionModal) openSubscriptionModal(); else setActiveTab('subscription'); }} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"><Crown className="w-4 h-4" /><span>مشاهده پلن‌ها و فعال‌سازی اشتراک هوش مصنوعی</span></button>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[500px] min-h-[350px] space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3"><Sparkles className="w-6 h-6" /></div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">چه کمکی از دست من برای شما برمی‌آید؟</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">یکی از موضوعات پرکاربرد زیر را انتخاب کنید یا سوال خود را در کادر زیر بپرسید:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-right">
                  {(mode === 'advisor' ? [{ icon: Sparkles, label: 'برنامه سه‌ماهه', prompt: 'با توجه به اطلاعات مالی حسابم، یک برنامه واقع‌بینانه برای سه ماه آینده پیشنهاد بده.' }, { icon: HelpCircle, label: 'تحلیل هزینه‌ها', prompt: 'هزینه‌های من را بر اساس دسته‌بندی تحلیل کن و مهم‌ترین فرصت‌های کاهش هزینه را توضیح بده.' }, { icon: Target, label: 'بررسی اهداف', prompt: 'با توجه به اهداف مالی ثبت‌شده‌ام، وضعیت پیشرفت و موانع احتمالی را تحلیل کن.' }, { icon: Calendar, label: 'سناریوی پس‌انداز', prompt: 'اگر روند درآمد و هزینه‌ام ادامه پیدا کند، وضعیت مالی‌ام در شش ماه آینده چطور می‌شود؟ فرضیات را هم بگو.' }] : QUICK_PROMPTS).map((qp, idx) => { const Icon = qp.icon; return (<button key={idx} onClick={() => handleSendMessage(qp.prompt)} className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121E18] border border-[#E2E8E4] dark:border-[#1E2E25] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-right flex items-start gap-2.5 cursor-pointer group"><div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition"><Icon className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-500 transition">{qp.label}</p><p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{qp.prompt}</p></div></button>); })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => { const isUser = m.role === 'user'; return (<div key={m.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${isUser ? 'bg-zinc-800 text-white font-bold' : 'bg-emerald-600 text-white'}`}>{isUser ? 'شما' : <Bot className="w-4 h-4" />}</div><div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${isUser ? 'bg-emerald-600 text-white rounded-tl-xs' : 'bg-zinc-100 dark:bg-[#15231C] text-zinc-900 dark:text-zinc-100 border border-[#E2E8E4] dark:border-[#22352B] rounded-tr-xs'}`}><div className="whitespace-pre-wrap">{m.content}</div></div></div>); })}
                
                {pendingAction && (
                  <div className="flex items-start gap-2.5 flex-row">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 bg-amber-500 text-white">{React.createElement(getActionIcon(pendingAction.type), { className: 'w-4 h-4' })}</div>
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-400/60 dark:border-amber-500/40 shadow-lg">
                      <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" /><span className="text-xs font-bold text-amber-800 dark:text-amber-300">{getActionTitle(pendingAction.type)} - نیاز به تأیید شما</span></div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">{pendingReply}</p>
                      <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-black/20 p-2 rounded-lg mb-3">📋 {pendingAction.description}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={handleConfirmAction} disabled={isLoading} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer">{isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} <span>{isLoading ? 'در حال انجام...' : 'بله، انجام بده'}</span></button>
                        <button onClick={handleRejectAction} disabled={isLoading} className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"><X className="w-3.5 h-3.5" /><span>انصراف</span></button>
                      </div>
                    </div>
                  </div>
                )}
                {isLoading && !pendingAction && (<div className="flex items-center gap-2.5 text-xs text-zinc-400 animate-pulse"><div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /></div><span>در حال تفکر...</span></div>)}
                <div ref={messagesEndRef} />
              </>
            )}
            {errorMessage && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMessage}</span></div>)}
          </div>
          
          <div className="p-3 sm:p-4 border-t border-[#E2E8E4] dark:border-[#1E2D24] bg-zinc-50 dark:bg-[#101914]">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
              {isVip ? (
                <button type="button" onClick={startVoiceInput} title={isListening ? 'توقف ضبط صدا' : 'گفتن پیام با صدا (VIP)'} aria-label={isListening ? 'توقف ضبط صدا' : 'گفتن پیام با صدا'} className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${isListening ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
              ) : (
                <button type="button" onClick={() => { setVoiceError('گفت‌وگوی صوتی و پخش پاسخ‌ها مخصوص اشتراک VIP است.'); if (openSubscriptionModal) openSubscriptionModal(); else setActiveTab('subscription'); }} title="ویژه اشتراک VIP" aria-label="قابلیت ویس ویژه VIP" className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition cursor-pointer shrink-0"><Lock className="w-4 h-4" /></button>
              )}
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={mode === "advisor" ? "درباره وضعیت مالی، هزینه‌ها یا برنامه آینده‌ات بپرس..." : "درباره دنگ، اهداف مالی، یادآورها یا ثبت تراکنش بپرس..."} disabled={isLoading || !!pendingAction} className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-[#14221B] border border-[#D5DDD7] dark:border-[#203328] rounded-2xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-emerald-500 transition font-cairo" />
              {isVip && <button type="button" onClick={speakLatestReply} title="پخش آخرین پاسخ با صدا" aria-label="پخش آخرین پاسخ" className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer shrink-0"><Volume2 className="w-4 h-4" /></button>}
              <button type="submit" disabled={isLoading || !inputValue.trim() || !!pendingAction} className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition cursor-pointer shadow-md shrink-0"><Send className="w-4 h-4" /></button>
            </form>
            {voiceError && <div role="status" className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">{voiceError}</div>}
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 px-1"><span>{isVip ? (isListening ? 'در حال شنیدن... صحبت کن؛ متن تشخیص‌داده‌شده در کادر پیام قرار می‌گیرد.' : 'ویس VIP: پیام را با میکروفون بگو و سپس ارسال کن؛ با دکمه بلندگو آخرین پاسخ پخش می‌شود.') : 'قابلیت ویس و پخش صوتی پاسخ‌ها مخصوص کاربران VIP است.'}</span><span className="hidden sm:inline">حفاظت شده توسط سوپابیس و امنیت چندبوم</span></div>
          </div>
        </>
      )}
    </div>
  );
};