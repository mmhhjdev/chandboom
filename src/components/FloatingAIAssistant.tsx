import React, { useState, useRef } from 'react';
import { Bot, Sparkles, Send, X, Lock, Crown, CheckCircle2, AlertCircle, User, Mic, MicOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { TransactionCategory, TransactionType } from '../types';
import { getCachedAIChat, setCachedAIChat } from '../utils/aiCache';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';

interface ChatMessage { id: string; sender: 'assistant' | 'user'; text: string; time: string; }
interface TransactionDraft { amount: number; type: TransactionType; clean_title: string; bank?: string | null; category: TransactionCategory; }
interface PendingAction { type: string; params: any; description: string; }

export const FloatingAIAssistant: React.FC = () => {
  const { isAuthenticated, isProUser, hasAIAccess, addTransaction, metrics, user, transactions, setActiveTab, setIsAuthModalOpen, createDongGroup, addGoal, addReminder } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<TransactionDraft | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingReply, setPendingReply] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => { const cached = getCachedAIChat(); if (cached && cached.length > 0) return cached; return [{ id: 'welcome-1', sender: 'assistant', text: 'سلام! من «دستیار هوشمند چندبوم» هستم. می‌توانید تراکنش‌هایتان را ثبت کنید، گروه دنگ بسازید، هدف مالی تعریف کنید یا یادآور تنظیم کنید.', time: 'لحظاتی پیش' }]; });

  React.useEffect(() => { setCachedAIChat(messages); }, [messages]);
  const presetQuestions = ['ثبت کن ۰ هزار تومن قهوه', 'یه گروه دنگ به اسم سفر شمال با اعضای علی و رضا بساز', 'هدف مالی خرید لپ‌تاپ ۵۰ میلیون', 'یادآور قسط وام ۲ میلیون'];

  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotice('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.'); setTimeout(() => setNotice(null), 3000); return; }
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    try {
      const recognition = new SpeechRecognition(); recognitionRef.current = recognition; recognition.lang = 'fa-IR'; recognition.continuous = false; recognition.interimResults = false;
      recognition.onstart = () => { setIsListening(true); setNotice('🎙️ در حال گوش دادن...'); };
      recognition.onresult = (event: any) => { const transcript = event.results?.[0]?.[0]?.transcript; if (transcript) { setInput(transcript); setNotice(`✅ «${transcript}»`); setTimeout(() => { setNotice(null); handleSendMessage(transcript); }, 500); } setIsListening(false); };
      recognition.onerror = () => { setIsListening(false); setNotice('متوجه صدا نشدم.'); setTimeout(() => setNotice(null), 3000); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch { setIsListening(false); setNotice('خطا در دسترسی به میکروفون.'); setTimeout(() => setNotice(null), 3000); }
  };

  const handleConfirmDraft = async () => { if (!pendingDraft) return; await addTransaction({ type: pendingDraft.type, amount: pendingDraft.amount, category: pendingDraft.category, description: pendingDraft.clean_title, account: pendingDraft.bank || 'کارت اصلی', date: new Date().toISOString() }); setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `✅ تراکنش «${pendingDraft.clean_title}» به مبلغ ${formatToman(pendingDraft.amount)} ثبت شد.`, time: 'هم‌اکنون' }]); setPendingDraft(null); };

  const handleConfirmAction = async () => {
    if (!pendingAction) return; setIsTyping(true);
    try {
      let success = false; let successMessage = '';
      switch (pendingAction.type) {
        case 'create_transaction': { const { amount, category, type, description } = pendingAction.params; await addTransaction({ amount: Number(amount), category: category || 'سایر و متفرقه', type: type || 'expense', description: description || pendingAction.description, date: new Date().toISOString(), account: 'ثبت توسط AI' }); success = true; successMessage = `✅ تراکنش ثبت شد.`; break; }
        case 'create_dong_group': { const { name, members } = pendingAction.params; const result = await createDongGroup(name, members || [], false); if (result.success) { success = true; successMessage = `✅ گروه دنگ «${name}» ساخته شد.`; } else throw new Error(result.error); break; }
        case 'create_goal': { const { title, target_amount, deadline, category } = pendingAction.params; await addGoal({ title: title || pendingAction.description, target_amount: Number(target_amount) || 0, current_amount: 0, deadline: deadline || null, category: category || 'سایر', status: 'in_progress', notes: '' }); success = true; successMessage = `✅ هدف مالی «${title}» ساخته شد.`; break; }
        case 'create_reminder': { const { title, amount, due_date, recurrence } = pendingAction.params; await addReminder({ title: title || pendingAction.description, amount: Number(amount) || 0, due_date: due_date || new Date().toISOString(), category: 'قبوض و شارژ', is_paid: false, recurrence: recurrence || 'once' }); success = true; successMessage = `✅ یادآور «${title}» تنظیم شد.`; break; }
        default: throw new Error(`نوع action ناشناخته: ${pendingAction.type}`);
      }
      if (success) { setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `${pendingReply}\n\n${successMessage}`, time: 'هم‌اکنون' }]); setPendingAction(null); setPendingReply(''); }
    } catch (err: any) { setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: `❌ خطا: ${err.message}`, time: 'هم‌اکنون' }]); setPendingAction(null); }
    finally { setIsTyping(false); }
  };

  const handleRejectAction = () => { setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: '❌ عملیات لغو شد.', time: 'هم‌اکنون' }]); setPendingAction(null); setPendingReply(''); };

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText) return;
    if (!isAuthenticated) { setNotice('⚠️ لطفاً ابتدا وارد شوید.'); setTimeout(() => { setIsAuthModalOpen(true); setNotice(null); }, 1200); return; }
    if (!hasAIAccess) { setNotice(' پلن پایه فاقد دسترسی به هوش مصنوعی است.'); return; }
    const newMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userText, time: 'هم‌اکنون' };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages); setInput(''); setIsTyping(true); setNotice(null); setPendingAction(null); setPendingDraft(null);
    try {
      const historyPayload = updatedMessages.map((m): { role: 'user' | 'assistant'; content: string } => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
      const response = await invokeAiAssistantEdgeFunction(userText, historyPayload);
      if (response.success && response.reply) {
        if (response.action && response.requires_confirmation) {
          setPendingReply(response.reply);
          if (response.action.type === 'create_transaction') { setPendingDraft({ amount: response.action.params?.amount || 0, type: response.action.params?.type || 'expense', clean_title: response.action.params?.description || userText, category: response.action.params?.category || 'سایر و متفرقه' }); }
          else { setPendingAction({ type: response.action.type, params: response.action.params, description: response.action.description }); }
        } else { setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: response.reply, time: 'هم‌اکنون' }]); }
      } else { setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: response.error || 'خطا در ارتباط با هوش مصنوعی', time: 'هم‌اکنون' }]); }
    } catch (err: any) { setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: err?.message || 'خطا در پردازش', time: 'هم‌اکنون' }]); }
    finally { setIsTyping(false); }
  };

  const getActionIcon = (type: string) => { switch (type) { case 'create_transaction': return '💳'; case 'create_dong_group': return '👥'; case 'create_goal': return '🎯'; case 'create_reminder': return '🔔'; default: return '✨'; } };
  const getActionTitle = (type: string) => { switch (type) { case 'create_transaction': return 'ثبت تراکنش'; case 'create_dong_group': return 'ساخت گروه دنگ'; case 'create_goal': return 'تعریف هدف مالی'; case 'create_reminder': return 'تنظیم یادآور'; default: return 'انجام عملیات'; } };

  return (
    <>
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 font-cairo">
        <button id="floating-ai-launcher-btn" onClick={() => setIsOpen((prev) => !prev)} className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#064E3B] via-[#047857] to-[#0D1512] text-white shadow-2xl hover:shadow-emerald-500/30 border-2 border-emerald-400/50 hover:border-amber-400 transition-all duration-300 cursor-pointer active:scale-95" title="هوش مصنوعی چندبوم">
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-[#0E1512]" /></span>
          <div className="flex flex-col items-center justify-center select-none leading-none"><span className="font-mono text-base font-black tracking-tighter text-amber-300 group-hover:scale-110 transition drop-shadow-md">AI</span><span className="text-[8px] font-brand font-bold text-emerald-200 opacity-80 -mt-0.5">چندبوم</span></div>
        </button>
      </div>
      {isOpen && (
        <div id="floating-ai-drawer" className="fixed bottom-36 left-4 md:bottom-22 md:left-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] bg-[#0C1512] rounded-3xl shadow-2xl border-2 border-emerald-600/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-cairo text-white" dir="rtl">
          <div className="p-4 border-b border-[#1A2822] bg-gradient-to-r from-[#064E3B] to-[#0F1B16] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 flex items-center justify-center font-mono font-black text-sm shadow-md">AI</div>
              <div><h3 className="font-cairo text-sm font-bold flex items-center gap-1.5 text-white"><span>دستیار هوشمند چندبوم</span><span className="px-1.5 py-0.2 rounded-md text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-400/40">Chandboom AI</span></h3><p className="text-[10px] text-emerald-200">دستیار اختصاصی ثبت تراکنش، دنگ، اهداف و یادآور</p></div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          {!isAuthenticated ? (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-b border-amber-400/30 text-right space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-cairo font-bold"><Lock className="w-4 h-4 text-amber-400 shrink-0" /><span>برای استفاده از هوش مصنوعی چندبوم، ابتدا باید وارد شوید</span></div>
              <button onClick={() => { setIsOpen(false); setIsAuthModalOpen(true); }} className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-cairo font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"><span>ورود به حساب کاربری / ثبت‌نام</span></button>
            </div>
          ) : !hasAIAccess ? (
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-yellow-500/15 border-b border-amber-400/40 text-right space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-cairo font-bold"><Crown className="w-4 h-4 text-amber-400 shrink-0" /><span>دسترسی به هوش مصنوعی نیازمند اشتراک برنزی، طلایی یا VIP است</span></div>
              <button onClick={() => { setIsOpen(false); setActiveTab('subscription'); }} className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"><Crown className="w-3.5 h-3.5 text-zinc-950" /><span>خرید اشتراک</span></button>
            </div>
          ) : null}
          {notice && (<div className="px-4 py-2 bg-amber-950/60 border-b border-amber-500/30 text-amber-300 text-xs font-cairo font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{notice}</span></div>)}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px]">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 text-xs leading-relaxed ${m.sender === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 ${m.sender === 'assistant' ? 'bg-emerald-700 text-white font-mono font-bold' : 'bg-zinc-800 text-white'}`}>{m.sender === 'assistant' ? 'AI' : <User className="w-3.5 h-3.5" />}</div>
                <div className={`max-w-[85%] p-3 rounded-2xl ${m.sender === 'assistant' ? 'bg-[#14231D] text-zinc-100 rounded-tr-xs border border-[#1F352C]' : 'bg-emerald-700 text-white rounded-tl-xs shadow-xs'}`}><p className="whitespace-pre-line font-cairo text-xs leading-relaxed">{m.text}</p><span className={`block text-[9px] mt-1 text-left ${m.sender === 'assistant' ? 'text-zinc-400' : 'text-emerald-200'}`}>{m.time}</span></div>
              </div>
            ))}
            {isTyping && !pendingAction && (<div className="flex items-center gap-2 text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" /><div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" /><div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" /><span>در حال پردازش...</span></div>)}
            
            {pendingDraft && (
               <div className="p-3.5 rounded-2xl bg-[#14231D] border-2 border-amber-400/70 shadow-xl space-y-3 animate-in fade-in zoom-in-95 font-cairo">
                 <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2"><div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs"><Sparkles className="w-4 h-4 text-amber-400" /><span>پیش‌نویس تراکنش هوشمند</span></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">{pendingDraft.type === 'expense' ? 'هزینه' : 'درآمد'}</span></div>
                 <div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-zinc-400 text-[10px] block">عنوان:</span><span className="font-bold text-white truncate block">{pendingDraft.clean_title}</span></div><div><span className="text-zinc-400 text-[10px] block">مبلغ دقیق:</span><span className="font-bold text-emerald-400 font-mono">{formatToman(pendingDraft.amount)}</span></div></div>
                 <div className="space-y-1"><label className="text-[11px] text-zinc-300 font-bold block">دسته‌بندی را تایید یا انتخاب کنید:</label><select value={pendingDraft.category} onChange={(e) => setPendingDraft({ ...pendingDraft, category: e.target.value as TransactionCategory })} className="w-full px-3 py-1.5 rounded-xl bg-[#0B1511] border border-emerald-700/60 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 font-cairo">{(pendingDraft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                 <div className="flex items-center gap-2 pt-1"><button type="button" onClick={handleConfirmDraft} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /><span>تایید و ثبت</span></button><button type="button" onClick={() => setPendingDraft(null)} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer">انصراف</button></div>
               </div>
             )}

            {pendingAction && (
              <div className="p-3.5 rounded-2xl bg-[#14231D] border-2 border-purple-400/70 shadow-xl space-y-3 animate-in fade-in zoom-in-95 font-cairo">
                <div className="flex items-center justify-between border-b border-purple-800/40 pb-2"><div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs"><Sparkles className="w-4 h-4 text-purple-400" /><span>{getActionTitle(pendingAction.type)} - نیاز به تأیید</span></div></div>
                <p className="text-xs text-zinc-300 leading-relaxed">{pendingReply}</p>
                <p className="text-[11px] font-bold text-zinc-400 bg-black/20 p-2 rounded-lg">📋 {pendingAction.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={handleConfirmAction} disabled={isTyping} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm">{isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} <span>{isTyping ? 'در حال انجام...' : 'بله، انجام بده'}</span></button>
                  <button type="button" onClick={handleRejectAction} disabled={isTyping} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"><X className="w-3.5 h-3.5" /><span>انصراف</span></button>
                </div>
              </div>
            )}
          </div>
          <div className="px-3 py-2 bg-[#0E1714] border-t border-[#1A2822] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-zinc-400 shrink-0 font-cairo">پیشنهاد:</span>
            {presetQuestions.map((q, idx) => (<button key={idx} type="button" onClick={() => handleSendMessage(q)} className="shrink-0 px-2.5 py-1 rounded-xl bg-[#14221C] border border-[#1F342B] hover:border-amber-400 text-zinc-300 hover:text-amber-300 transition cursor-pointer text-xs">{q}</button>))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-[#0B1310] border-t border-[#1A2822] flex items-center gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? 'در حال شنیدن...' : 'پیام متنی یا صوتی...'} className="flex-1 px-3.5 py-2.5 bg-[#122019] border border-[#1E3328] rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-cairo" />
            <button type="button" onClick={toggleVoiceRecognition} className={`p-2.5 rounded-xl border transition cursor-pointer shadow-xs ${isListening ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-[#15241D] hover:bg-[#1E342B] text-emerald-400 border-[#243D32]'}`} title={isListening ? 'توقف ضبط' : 'ورودی صوتی'}>{isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}</button>
            <button type="submit" disabled={isTyping} className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition cursor-pointer shadow-xs disabled:opacity-50" title="ارسال"><Send className="w-4 h-4 rotate-180" /></button>
          </form>
        </div>
      )}
    </>
  );
};