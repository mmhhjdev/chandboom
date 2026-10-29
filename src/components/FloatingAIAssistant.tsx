import React, { useState, useRef } from 'react';
import {
  Bot,
  Zap,
  Send,
  X,
  Lock,
  Crown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  User,
  ShieldAlert,
  Mic,
  MicOff,
  Loader2,
  Calendar,
  Target,
  Users,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSubscription } from '../hooks/useSubscription';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { formatToman } from '../utils/formatters';
import { processFinancialAI } from '../services/aiService';
import { TransactionCategory, TransactionType } from '../types';
import { getCachedAIChat, setCachedAIChat } from '../utils/aiCache';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { getSupabaseClient, AiAssistantAction } from '../lib/supabase';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
}

interface TransactionDraft {
  amount: number;
  type: TransactionType;
  clean_title: string;
  bank?: string | null;
  category: TransactionCategory;
}

export const FloatingAIAssistant: React.FC = () => {
  const {
    isAuthenticated,
    isProUser,
    hasAIAccess,
    addTransaction,
    addGoal,
    addReminder,
    metrics,
    user,
    transactions,
    setActiveTab,
    setIsAuthModalOpen,
    openSubscriptionModal,
  } = useApp();

  const { checkCanMakeAiRequest, consumeAiRequest } = useSubscription();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'agent' | 'advisor'>('agent');
  const [pendingAction, setPendingAction] = useState<AiAssistantAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<TransactionDraft | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = getCachedAIChat();
    if (cached && cached.length > 0) return cached;
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: `سلام! من «دستیار هوشمند چندبوم» هستم، مشاور اختصاصی مدیریت مالی و تحلیل بودجه شما.
می‌توانید پیام صوتی یا متنی دهید تا تراکنش‌هایتان را تحلیل و ثبت کنم (مثلاً: «حقوق پروژه ۲۵ میلیونی در تاریخ...» یا «خرید قهوه ۵۰ تومن») یا سوالات بودجه‌ای خود را بپرسید.`,
        time: 'لحظاتی پیش',
      },
    ];
  });

  React.useEffect(() => {
    setCachedAIChat(messages);
  }, [messages]);

  const presetQuestions = [
    'ثبت کن ۵۰ هزار تومن قهوه',
    'حقوق پروژه ۲۵ میلیونی در تاریخ ۲۵ مهر',
    'برام تحلیل کن که تا چند ماه آینده میتونم چیکار بکنم',
    'وضعیت مصرف سقف بودجه چطوره؟',
  ];

  const {
    isListening,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceRecognition,
    stopListening,
  } = useSpeechRecognition({
    lang: 'fa-IR',
    continuous: false,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      setInput(transcript);
      if (isFinal) {
        setNotice(`✅ دریافت شد: «${transcript}»`);
        setTimeout(() => {
          setNotice(null);
          handleSendMessage(transcript);
        }, 500);
      }
    },
    onError: (err) => {
      setNotice(err);
      setTimeout(() => setNotice(null), 4000);
    },
  });

  const handleConfirmDraft = async () => {
    if (!pendingDraft) return;
    await addTransaction({
      type: pendingDraft.type,
      amount: pendingDraft.amount,
      category: pendingDraft.category,
      description: pendingDraft.clean_title,
      account: pendingDraft.bank || 'کارت اصلی',
      date: new Date().toISOString(),
    });

    const reply = `✅ تراکنش توسط «دستیار هوشمند چندبوم» با موفقیت ثبت شد:
• نوع: ${pendingDraft.type === 'expense' ? 'هزینه' : 'درآمد'}
• مبلغ: ${formatToman(pendingDraft.amount)}
• دسته‌بندی انتخابی: ${pendingDraft.category}
• شرح: ${pendingDraft.clean_title}

این رکورد در جدول تراکنش‌های شما ثبت شد و مانده حساب فوراً به‌روزرسانی گردید.`;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'assistant',
        text: reply,
        time: 'هم‌اکنون',
      },
    ]);

    setPendingDraft(null);
  };

  const handleConfirmProposedAction = async () => {
    if (!pendingAction) return;
    setIsExecutingAction(true);
    try {
      const { type } = pendingAction;
      const params = pendingAction.data || pendingAction.params || {};

      if (type === 'create_transaction' || type === 'add_transaction') {
        const txType: TransactionType = String(params.type || '').toLowerCase().includes('income') ? 'income' : 'expense';
        const amount = Math.round(Number(params.amount) || 0);
        await addTransaction({
          type: txType,
          amount,
          category: params.category || (txType === 'income' ? 'حقوق و دستمزد' : 'خوراک و غذا'),
          description: params.description || (txType === 'income' ? 'درآمد ثبت شده توسط هوش مصنوعی' : 'هزینه ثبت شده توسط هوش مصنوعی'),
          account: 'کارت اصلی',
          date: params.date || new Date().toISOString(),
        });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: `✅ تراکنش «${params.description || (txType === 'income' ? 'درآمد' : 'هزینه')}» به مبلغ ${formatToman(amount)} با موفقیت در دیتابیس چندبوم ثبت شد.`,
            time: 'هم‌اکنون',
          },
        ]);
      } else if (type === 'create_dong_group' || type === 'create_group') {
        const supabase = getSupabaseClient();
        const membersList: string[] = Array.isArray(params.members) && params.members.length > 0 ? [...params.members] : ['من'];
        if (!membersList.includes('من') && user?.full_name && !membersList.includes(user.full_name)) {
          membersList.unshift(user.full_name);
        }
        if (!supabase || !user?.id || user.id === 'guest') throw new Error('برای ساخت گروه دنگ باید وارد حساب کاربری باشید.');
        const groupName = String(params.name || '').trim();
        if (!groupName) throw new Error('نام گروه دنگ مشخص نشده است.');
        const { data: createdGroup, error: groupErr } = await supabase.from('dong_groups').insert({
          user_id: user.id,
          name: groupName,
          members: membersList,
          is_family_mode: false,
          families: [],
        }).select('id,name,members').single();
        if (groupErr) throw groupErr;
        if (!createdGroup?.id) throw new Error('ساخت گروه در پایگاه داده تأیید نشد.');
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'assistant', text: `✅ گروه دنگ «${createdGroup.name}» با اعضای (${(createdGroup.members || membersList).join('، ')}) در پایگاه داده ساخته شد.`, time: 'هم‌اکنون' },
        ]);
      } else if (type === 'add_deng_expense') {
        const supabase = getSupabaseClient();
        const amount = Math.round(Number(params.amount) || 0);
        const groupName = params.group_name || 'سفر دوستانه';
        const title = params.title || 'خرج مشترک دنگ';
        const payer = params.payer || 'من';
        const participants = Array.isArray(params.participants) && params.participants.length > 0 ? params.participants : ['من', 'علی', 'رضا'];

        if (!supabase || !user?.id || user.id === 'guest') throw new Error('برای ثبت خرج دنگ باید وارد حساب کاربری باشید.');
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('مبلغ خرج دنگ باید بیشتر از صفر باشد.');
        let groupId: string | null = null;
        const { data: g, error: findErr } = await supabase.from('dong_groups').select('id').eq('name', groupName).maybeSingle();
        if (findErr) throw findErr;
        if (g) groupId = g.id;
        else {
          const { data: newG, error: groupErr } = await supabase.from('dong_groups').insert({
            user_id: user.id, name: groupName, members: participants, is_family_mode: false, families: [],
          }).select('id').single();
          if (groupErr) throw groupErr;
          groupId = newG?.id || null;
        }
        if (!groupId) throw new Error('گروه دنگ پیدا یا ساخته نشد.');
        const { error: expenseErr } = await supabase.from('dong_expenses').insert({
          group_id: groupId, title, payer, amount, participants, is_itemized: false, bill_items: [],
        });
        if (expenseErr) throw expenseErr;
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'assistant', text: `✅ خرج دنگ «${title}» به مبلغ ${formatToman(amount)} پرداخت شده توسط ${payer} در پایگاه داده ثبت شد.`, time: 'هم‌اکنون' },
        ]);
      } else if (type === 'create_goal') {
        const targetAmount = Math.round(Number(params.target_amount) || 0);
        await addGoal({
          title: params.title || 'هدف مالی هوشمند',
          target_amount: targetAmount,
          current_amount: 0,
          deadline: params.deadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          category: params.category || 'سایر',
          status: 'in_progress',
        });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: `✅ هدف مالی «${params.title}» با سقف ${formatToman(targetAmount)} با موفقیت به اهداف مالی شما افزوده شد.`,
            time: 'هم‌اکنون',
          },
        ]);
      } else if (type === 'create_reminder') {
        const remAmount = Math.round(Number(params.amount) || 0);
        await addReminder({
          title: params.title || 'یادآور مالی هوشمند',
          amount: remAmount,
          due_date: params.due_date || new Date().toISOString().split('T')[0],
          recurrence: params.recurrence || 'once',
          category: params.category || 'قبوض',
          is_paid: false,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: `✅ سررسید «${params.title}» به مبلغ ${formatToman(remAmount)} برای موعد ${params.due_date || 'تعیین‌شده'} در تقویم سررسیدها ثبت گردید.`,
            time: 'هم‌اکنون',
          },
        ]);
      } else if (type === 'financial_analysis' || type === 'analysis_report') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: '✅ شاخص‌های تحلیل مالی به‌روزرسانی و در دسترس شما قرار گرفت.',
            time: 'هم‌اکنون',
          },
        ]);
      }
      setPendingAction(null);
    } catch (err: any) {
      setNotice(err?.message || 'خطا در ثبت اقدام در دیتابیس');
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (isListening) {
      stopListening();
    }

    const userText = (textToSend || input).trim();
    if (!userText) return;

    // 1. Must be authenticated first
    if (!isAuthenticated) {
      setNotice('⚠️ استفاده از هوش مصنوعی نیازمند ورود به حساب کاربری است. لطفاً ابتدا وارد شوید.');
      setTimeout(() => {
        setIsAuthModalOpen(true);
        setNotice(null);
      }, 1200);
      return;
    }

    // 2. Check quota guard
    const quotaCheck = checkCanMakeAiRequest();
    if (!quotaCheck.allowed) {
      setNotice(quotaCheck.reason || '🔒 سهمیه هوش مصنوعی شما به اتمام رسیده است.');
      if (openSubscriptionModal) openSubscriptionModal();
      return;
    }

    // Persisted quota is enforced exactly once by the ai-assistant Edge Function.
    // The client mirrors usage only after a successful response.

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: 'هم‌اکنون',
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setNotice(null);

    processFinancialAI(userText, {
      metrics,
      monthlyCap: user.monthly_budget_cap,
      fullName: user.full_name,
      mode: aiMode,
      chatHistory: updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      })),
    })
      .then(async (result) => {
        if (result.action) {
          // Action proposed by AI -> Require explicit user confirmation card
          setPendingAction(result.action);
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: result.conversational_reply || 'پیشنهاد عملیات زیر برای شما آماده شده است. لطفاً جهت ثبت نهایی آن را تایید فرمایید.',
              time: 'هم‌اکنون',
            },
          ]);
        } else if (result.is_ambiguous) {
          // Ambiguity Handling
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: result.clarification_message || 'مبلغ دقیق یا نوع تراکنش مشخص نیست، لطفاً بفرمایید درآمد است یا هزینه؟',
              time: 'هم‌اکنون',
            },
          ]);
        } else {
          // Conversational Advisor / Deep financial analysis
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: result.conversational_reply || 'در صورت نیاز به ثبت تراکنش، یادآور، هدف یا سوال مالی در خدمتم.',
              time: 'هم‌اکنون',
            },
          ]);
        }
      })
      .catch((err) => {
        console.error('AI chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: err?.message || 'خطا در برقراری ارتباط با هوش مصنوعی چندبوم',
            time: 'هم‌اکنون',
          },
        ]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  return (
    <>
      {/* Floating launcher button at bottom-left with 'AI' English lettering */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 font-cairo">
        <button
          id="floating-ai-launcher-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#064E3B] via-[#047857] to-[#0D1512] text-white shadow-2xl hover:shadow-emerald-500/30 border-2 border-emerald-400/50 hover:border-amber-400 transition-all duration-300 cursor-pointer active:scale-95"
          title="هوش مصنوعی چندبوم (Chandboom AI)"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-[#0E1512]" />
          </span>

          {/* AI Creative Lettering */}
          <div className="flex flex-col items-center justify-center select-none leading-none">
            <span className="font-mono text-base font-black tracking-tighter text-amber-300 group-hover:scale-110 transition drop-shadow-md">
              AI
            </span>
            <span className="text-[8px] font-brand font-bold text-emerald-200 opacity-80 -mt-0.5">
              چندبوم
            </span>
          </div>
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          id="floating-ai-drawer"
          className="fixed bottom-36 left-4 md:bottom-22 md:left-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] bg-[#0C1512] rounded-3xl shadow-2xl border-2 border-emerald-600/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-cairo text-white"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1A2822] bg-gradient-to-r from-[#064E3B] to-[#0F1B16] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 flex items-center justify-center font-mono font-black text-sm shadow-md">
                AI
              </div>
              <div>
                <h3 className="font-cairo text-sm font-bold flex items-center gap-1.5 text-white">
                  <span>دستیار هوشمند چندبوم</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-400/40">
                    Chandboom AI
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-200">
                  دستیار اختصاصی ثبت تراکنش و مشاوره مالی
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08100D] border-b border-[#1A2822] text-[11px] font-cairo">
            <span className="text-zinc-400 text-[10px] shrink-0">حالت:</span>
            <button
              type="button"
              onClick={() => setAiMode('agent')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[10px] ${
                aiMode === 'agent'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-[#121E19] text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>دستیار اجرایی (ثبت سریع)</span>
            </button>
            <button
              type="button"
              onClick={() => setAiMode('advisor')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[10px] ${
                aiMode === 'advisor'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#121E19] text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-amber-300" />
              <span>مشاور جامع مالی (تحلیل ۶ ماهه)</span>
            </button>
          </div>

          {/* Gate 1: Not Authenticated */}
          {!isAuthenticated ? (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-b border-amber-400/30 text-right space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-cairo font-bold">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>برای استفاده از هوش مصنوعی چندبوم، ابتدا باید وارد شوید</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                لطفاً برای ثبت هوشمند تراکنش‌ها و گفتگو با هوش مصنوعی، وارد حساب کاربری خود شوید یا حساب جدید بسازید.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-cairo font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span>ورود به حساب کاربری / ثبت‌نام</span>
              </button>
            </div>
          ) : !hasAIAccess ? (
            /* Gate 2: Authenticated but No AI Access (Free Tier) */
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-yellow-500/15 border-b border-amber-400/40 text-right space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-cairo font-bold">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>دسترسی به هوش مصنوعی نیازمند پلن ۱ ماهه طلایی یا ۳ ماهه VIP است</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                طرح پایه (رایگان) فاقد هوش مصنوعی است. برای فعال‌سازی ثبت خودکار تراکنش‌ها و مشاوره بودجه، حساب خود را ارتقا دهید.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (openSubscriptionModal) openSubscriptionModal();
                  else setActiveTab('subscription');
                }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-zinc-950" />
                <span>مشاهده پلن‌ها و فعال‌سازی هوش مصنوعی</span>
              </button>
            </div>
          ) : null}

          {/* Feedback Notice */}
          {notice && (
            <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-500/30 text-amber-300 text-xs font-cairo font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Messages Log */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 text-xs leading-relaxed ${
                  m.sender === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    m.sender === 'assistant'
                      ? 'bg-emerald-700 text-white font-mono font-bold'
                      : 'bg-zinc-800 text-white'
                  }`}
                >
                  {m.sender === 'assistant' ? 'AI' : <User className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    m.sender === 'assistant'
                      ? 'bg-[#14231D] text-zinc-100 rounded-tr-xs border border-[#1F352C]'
                      : 'bg-emerald-700 text-white rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-cairo text-xs leading-relaxed">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-left ${
                      m.sender === 'assistant' ? 'text-zinc-400' : 'text-emerald-200'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" />
                <span>دستیار هوشمند چندبوم در حال پردازش است...</span>
              </div>
            )}

            {/* Smart Interactive Draft Modal / Card (Category MUST be manually chosen!) */}
            {pendingDraft && (
              <div className="p-3.5 rounded-2xl bg-[#14231D] border-2 border-amber-400/70 shadow-xl space-y-3 animate-in fade-in zoom-in-95 font-cairo">
                <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>پیش‌نویس تراکنش هوشمند</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    {pendingDraft.type === 'expense' ? 'هزینه' : 'درآمد'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] block">عنوان:</span>
                    <span className="font-bold text-white truncate block">{pendingDraft.clean_title}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">مبلغ دقیق:</span>
                    <span className="font-bold text-emerald-400 font-mono">{formatToman(pendingDraft.amount)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-300 font-bold block">
                    دسته‌بندی را تایید یا انتخاب کنید:
                  </label>
                  <select
                    value={pendingDraft.category}
                    onChange={(e) =>
                      setPendingDraft({
                        ...pendingDraft,
                        category: e.target.value as TransactionCategory,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0B1511] border border-emerald-700/60 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 font-cairo"
                  >
                    {(pendingDraft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmDraft}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تایید و ثبت در حسابداری</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDraft(null)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {/* Smart Interactive Action Proposal Card */}
            {pendingAction && (
              <div className="p-3.5 rounded-2xl bg-[#14231D] border-2 border-amber-400/80 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 font-cairo">
                <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>پیشنهاد اقدام هوشمند</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    نیازمند تایید شما
                  </span>
                </div>

                {pendingAction.description && (
                  <p className="text-xs text-zinc-200 leading-relaxed font-bold">
                    {pendingAction.description}
                  </p>
                )}

                {/* Details depending on action type */}
                {pendingAction.type === 'create_transaction' && (
                  <div className="bg-[#0D1814] p-2.5 rounded-xl border border-emerald-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">نوع تراکنش:</span>
                      <span className="font-bold text-white">
                        {String(pendingAction.params.type).includes('income') ? '🟢 درآمد (واریز)' : '🔴 هزینه (پرداخت)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">مبلغ:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatToman(Number(pendingAction.params.amount) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">دسته‌بندی:</span>
                      <span className="font-bold text-white">{pendingAction.params.category || 'سایر'}</span>
                    </div>
                    {pendingAction.params.description && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">شرح:</span>
                        <span className="font-bold text-white">{pendingAction.params.description}</span>
                      </div>
                    )}
                  </div>
                )}

                {pendingAction.type === 'create_dong_group' && (
                  <div className="bg-[#0D1814] p-2.5 rounded-xl border border-emerald-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">نام گروه دنگ:</span>
                      <span className="font-bold text-white">{pendingAction.params.name || 'گروه جدید'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">اعضای گروه:</span>
                      <span className="font-bold text-white">
                        {Array.isArray(pendingAction.params.members)
                          ? pendingAction.params.members.join('، ')
                          : 'شامل شما'}
                      </span>
                    </div>
                  </div>
                )}

                {pendingAction.type === 'create_goal' && (
                  <div className="bg-[#0D1814] p-2.5 rounded-xl border border-emerald-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">عنوان هدف:</span>
                      <span className="font-bold text-white">{pendingAction.params.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">مبلغ هدف:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatToman(Number(pendingAction.params.target_amount) || 0)}
                      </span>
                    </div>
                    {pendingAction.params.deadline && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">مهلت زمانی:</span>
                        <span className="font-bold text-white font-mono">{pendingAction.params.deadline}</span>
                      </div>
                    )}
                  </div>
                )}

                {pendingAction.type === 'create_reminder' && (
                  <div className="bg-[#0D1814] p-2.5 rounded-xl border border-emerald-800/50 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">عنوان یادآور:</span>
                      <span className="font-bold text-white">{pendingAction.params.title}</span>
                    </div>
                    {pendingAction.params.amount ? (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">مبلغ:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatToman(Number(pendingAction.params.amount))}
                        </span>
                      </div>
                    ) : null}
                    {pendingAction.params.due_date && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">تاریخ سررسید:</span>
                        <span className="font-bold text-white font-mono">{pendingAction.params.due_date}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmProposedAction}
                    disabled={isExecutingAction}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {isExecutingAction ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ثبت...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تایید و ثبت در سیستم</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isExecutingAction}
                    onClick={() => {
                      setPendingAction(null);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          sender: 'assistant',
                          text: 'عملیات پیشنهادی لغو شد. هر زمان بخواهید می‌توانید دستور جدیدی صادر فرمایید.',
                          time: 'هم‌اکنون',
                        },
                      ]);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="px-3 py-2 bg-[#0E1714] border-t border-[#1A2822] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-zinc-400 shrink-0 font-cairo">پیشنهاد:</span>
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-[#14221C] border border-[#1F342B] hover:border-amber-400 text-zinc-300 hover:text-amber-300 transition cursor-pointer text-xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0B1310] border-t border-[#1A2822] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isAuthenticated
                  ? 'ابتدا وارد حساب کاربری خود شوید...'
                  : !isProUser
                  ? 'ویژه مشترکین طلایی پرو...'
                  : isListening
                  ? 'در حال شنیدن صدای شما... صحبت کنید'
                  : 'پیام متنی یا صوتی دهید: «حقوق پروژه ۲۵ میلیونی...»'
              }
              className="flex-1 px-3.5 py-2.5 bg-[#122019] border border-[#1E3328] rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-cairo"
            />
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`p-2.5 rounded-xl border transition cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-[#15241D] hover:bg-[#1E342B] text-emerald-400 border-[#243D32]'
              }`}
              title={isListening ? 'توقف ضبط صدا' : 'ارسال پیام صوتی به هوش مصنوعی'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={isTyping}
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition cursor-pointer shadow-xs disabled:opacity-50"
              title="ارسال پیام"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
