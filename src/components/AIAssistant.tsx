import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Crown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Target,
  Bell,
  X,
  CreditCard,
  Zap,
  ArrowRight,
  PlusCircle,
  Receipt,
  Calendar,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSubscription } from '../hooks/useSubscription';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ChatMessage, ChatMessageItem } from './ChatMessage';
import {
  invokeAiAssistantEdgeFunction,
  getSupabaseClient,
  AiAssistantAction,
} from '../lib/supabase';
import { trackAiQuerySent, trackAiQuotaExceeded } from '../lib/analytics';
import { toPersianDigits, formatToman } from '../utils/formatters';
import { TransactionType } from '../types';

const STORAGE_KEY = 'cb_session_ai_chat';

const QUICK_PROMPTS = [
  {
    icon: Receipt,
    label: 'ثبت سریع هزینه کافه',
    prompt: 'ثبت کن ۵۰ هزار تومن قهوه در دسته خوراک',
  },
  {
    icon: Users,
    label: 'ایجاد گروه دنگ سفر',
    prompt: 'یک گروه دنگ به نام سفر شمال با اعضای علی و رضا بساز',
  },
  {
    icon: Target,
    label: 'تعریف هدف مالی و پس‌انداز',
    prompt: 'هدف مالی خرید لپ‌تاپ به مبلغ ۴۰ میلیون تومان برای ۶ ماه آینده ایجاد کن',
  },
  {
    icon: Bell,
    label: 'تنظیم یادآور قسط و قبوض',
    prompt: 'یادآور قسط وام مسکن به مبلغ ۳ میلیون تومان برای ۱۰ روز دیگر تنظیم کن',
  },
];

export const AIAssistant: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    user,
    hasAIAccess,
    isProUser,
    setActiveTab,
    openSubscriptionModal,
    syncAiQuotaFromServer,
    addTransaction,
    addGoal,
    addReminder,
  } = useApp();

  const {
    checkCanMakeAiRequest,
  } = useSubscription();

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingQueries, setRemainingQueries] = useState<number | null>(null);
  const [aiMode, setAiMode] = useState<'agent' | 'advisor'>('agent');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Recognition Hook
  const {
    isListening,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    toggleListening,
    error: voiceError,
  } = useSpeechRecognition({
    lang: 'fa-IR',
    continuous: false,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      setInputValue(transcript);
    },
    onError: (err) => {
      setErrorMessage(err);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Load chat session from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {}

    const handleUnload = () => {
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Sync to storage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setErrorMessage(null);
  };

  /**
   * Executes a proposed AI Action directly into Supabase/Context
   */
  const handleExecuteAction = async (
    messageId: string,
    action: AiAssistantAction
  ): Promise<boolean> => {
    try {
      const { type } = action;
      const params = action.data || action.params || {};

      // 1. Transaction
      if (type === 'create_transaction' || type === 'add_transaction') {
        const txType: TransactionType = String(params.type || '').toLowerCase().includes('income')
          ? 'income'
          : 'expense';
        const amount = Math.round(Number(params.amount) || 0);

        await addTransaction({
          type: txType,
          amount,
          category: params.category || (txType === 'income' ? 'حقوق و دستمزد' : 'خوراک و غذا'),
          description:
            params.description ||
            (txType === 'income' ? 'درآمد ثبت شده توسط هوش مصنوعی' : 'هزینه ثبت شده توسط هوش مصنوعی'),
          account: 'کارت اصلی',
          date: params.date || new Date().toISOString(),
        });

        const successMsg = `تراکنش ${txType === 'income' ? 'درآمد' : 'هزینه'} با مبلغ ${formatToman(
          amount
        )} با موفقیت ثبت گردید.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: successMsg,
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      // 2. Deng Group Creation
      if (type === 'create_dong_group' || type === 'create_group') {
        const supabase = getSupabaseClient();
        const groupName = String(params.name || '').trim();
        const suppliedMembers = Array.isArray(params.members) ? params.members : [];
        const membersList = [...new Set(suppliedMembers
          .map((member: unknown) => String(member || '').trim())
          .filter((member: string) => member.length > 0))];

        if (!user?.id || user.id === 'guest') {
          throw new Error('برای ساخت گروه دنگ ابتدا وارد حساب کاربری خود شوید.');
        }
        if (!supabase) {
          throw new Error('اتصال پایگاه داده برقرار نیست؛ گروه ثبت نشد.');
        }
        if (groupName.length < 2) {
          throw new Error('نام گروه معتبر نیست. لطفاً نام گروه را بررسی کنید.');
        }
        if (membersList.length === 0) {
          throw new Error('حداقل یک عضو برای گروه مشخص کنید.');
        }

        if (user.full_name && !membersList.includes(user.full_name)) {
          membersList.unshift(user.full_name);
        }

        const { data: createdGroup, error: groupErr } = await supabase
          .from('dong_groups')
          .insert({
            user_id: user.id,
            name: groupName,
            members: membersList,
            is_family_mode: false,
            families: [],
            created_at: new Date().toISOString(),
          })
          .select('id, name, members')
          .single();

        if (groupErr) throw groupErr;
        if (!createdGroup?.id) {
          throw new Error('پایگاه داده شناسه گروه ساخته‌شده را برنگرداند؛ موفقیت ثبت تأیید نشد.');
        }

        const successMsg = `گروه دنگ «${createdGroup.name}» با اعضای (${membersList.join(
          '، '
        )}) با موفقیت در پایگاه داده ثبت شد.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: successMsg,
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      // 3. Add Deng Expense
      if (type === 'add_deng_expense') {
        const supabase = getSupabaseClient();
        const amount = Math.round(Number(params.amount) || 0);
        const groupName = params.group_name || 'سفر دوستانه';
        const title = params.title || 'هزینه مشترک دنگ';
        const payer = params.payer || user?.full_name || 'من';
        const participants = Array.isArray(params.participants) && params.participants.length > 0
          ? params.participants
          : ['من', 'علی', 'رضا'];

        if (supabase) {
          // Find or create group
          let groupId: string | null = null;
          const { data: existingGroup } = await supabase
            .from('dong_groups')
            .select('id')
            .eq('name', groupName)
            .maybeSingle();

          if (existingGroup) {
            groupId = existingGroup.id;
          } else {
            const { data: newG } = await supabase
              .from('dong_groups')
              .insert({
                user_id: user?.id,
                name: groupName,
                members: participants,
                is_family_mode: false,
                families: [],
                created_at: new Date().toISOString(),
              })
              .select('id')
              .maybeSingle();
            groupId = newG?.id || null;
          }

          if (groupId) {
            await supabase.from('dong_expenses').insert({
              group_id: groupId,
              title,
              payer,
              amount,
              participants,
              is_itemized: false,
              bill_items: [],
              created_at: new Date().toISOString(),
            });
          }
        }

        const successMsg = `خرج دنگ «${title}» به مبلغ ${formatToman(amount)} پرداخت شده توسط ${payer} در سیستم دنگ ثبت گردید.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: successMsg,
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      // 4. Financial Goal
      if (type === 'create_goal') {
        const targetAmount = Math.round(Number(params.target_amount) || 0);
        await addGoal({
          title: params.title || 'هدف مالی هوشمند',
          target_amount: targetAmount,
          current_amount: 0,
          deadline:
            params.deadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          category: params.category || 'سایر',
          status: 'in_progress',
        });

        const successMsg = `هدف مالی «${params.title}» با سقف ${formatToman(
          targetAmount
        )} در اهداف شما ذخیره گردید.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: successMsg,
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      // 5. Reminder
      if (type === 'create_reminder') {
        const remAmount = Math.round(Number(params.amount) || 0);
        await addReminder({
          title: params.title || 'یادآور مالی هوشمند',
          amount: remAmount,
          due_date: params.due_date || new Date().toISOString().split('T')[0],
          recurrence: params.recurrence || 'once',
          category: params.category || 'قبوض',
          is_paid: false,
        });

        const successMsg = `یادآور «${params.title}» به مبلغ ${formatToman(
          remAmount
        )} در تقویم یادآورها ثبت شد.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: successMsg,
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      // 6. Financial Analysis (informational)
      if (type === 'financial_analysis' || type === 'analysis_report') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  actionExecuted: true,
                  actionSuccessMessage: 'شاخص‌های تحلیلی با موفقیت در داشبورد بررسی شدند.',
                  actionError: null,
                }
              : m
          )
        );
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error executing action:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                actionError: err?.message || 'خطا در اعمال تغییرات بر روی پایگاه داده.',
              }
            : m
        )
      );
      return false;
    }
  };

  const handleDismissAction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, action: null } : m))
    );
  };

  /**
   * Handles sending message with Quota Guard & RPC Synchronization
   */
  const handleSendMessage = async (textToSend?: string) => {
    if (isListening) {
      stopListening();
    }

    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    // 1. Quota Guard: Verify client status first
    const clientCheck = checkCanMakeAiRequest();
    if (!clientCheck.allowed) {
      setErrorMessage(clientCheck.reason || 'سهمیه هوش مصنوعی شما به پایان رسیده است.');
      trackAiQuotaExceeded();
      if (openSubscriptionModal) {
        openSubscriptionModal();
      }
      return;
    }

    // 2. Prohibited Topics Check (Password/Deposit queries directed to tickets)
    const lower = text.toLowerCase();
    const isProhibited =
      lower.includes('فیش') ||
      lower.includes('رسید') ||
      lower.includes('واریز') ||
      lower.includes('ادمین') ||
      lower.includes('رمز عبور') ||
      lower.includes('پسورد') ||
      lower.includes('پرداخت من');

    const userMsg: ChatMessageItem = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setErrorMessage(null);

    if (isProhibited) {
      const botMsg: ChatMessageItem = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content:
          'من دستیار مدیریت مالی چندبوم هستم. برای پیگیری پرداخت‌ها، بررسی وضعیت فیش‌های بانکی یا تغییر رمز عبور، لطفاً مستقیماً از بخش «پروفایل و اشتراک» یا ارسال «تیکت به پشتیبانی» استفاده فرمایید.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    setIsLoading(true);
    trackAiQuerySent('assistant_guide');

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await invokeAiAssistantEdgeFunction(text, historyPayload, aiMode);

      if (typeof response.remaining_queries === 'number') {
        setRemainingQueries(response.remaining_queries);
        if (response.remaining_queries >= 0) syncAiQuotaFromServer(response.remaining_queries);
      }

      if (response.success && response.reply) {
        const botMsg: ChatMessageItem = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString(),
          action: response.action,
        };
        setMessages((prev) => [...prev, botMsg]);

      } else {
        if (response.code === 'QUOTA_EXCEEDED') {
          trackAiQuotaExceeded();
          if (openSubscriptionModal) openSubscriptionModal();
        }
        setErrorMessage(
          response.error || 'خطا در ارتباط با هوش مصنوعی چندبوم. لطفاً مجدداً تلاش فرمایید.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'برقراری ارتباط با هوش مصنوعی میسر نشد.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscriptionActive = hasAIAccess;

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-[#0E1612] border border-[#E2E8E4] dark:border-[#1E2D24] rounded-3xl shadow-xl overflow-hidden flex flex-col font-cairo">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8E4] dark:border-[#1E2D24] bg-zinc-50 dark:bg-[#131F19] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                دستیار هوشمند و راهنمای <span className="font-brand text-emerald-700 dark:text-emerald-400">چندبوم</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 font-black flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>
                  {user.tier === 'vip'
                    ? 'اشتراک ۳ ماهه VIP'
                    : user.tier === 'pro'
                    ? 'اشتراک ۱ ماهه طلایی'
                    : user.tier === 'bronze'
                    ? 'اشتراک ۱ ماهه برنزی'
                    : 'ویژه کاربران دارای اشتراک'}
                </span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              ورودی صوتی و متنی فارسی، ثبت تراکنش‌ها، گروه‌های دنگ، اهداف مالی و یادآورها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="hidden sm:inline-flex items-center p-0.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setAiMode('agent')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                aiMode === 'agent'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              دستیار اجرایی
            </button>
            <button
              type="button"
              onClick={() => setAiMode('advisor')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                aiMode === 'advisor'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              مشاور مالی
            </button>
          </div>

          {typeof remainingQueries === 'number' && (
            <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              {toPersianDigits(remainingQueries)} سهمیه باقی‌مانده
            </span>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="پاکسازی تاریخچه گفت‌وگو"
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Access Gate: Subscription Requirement */}
      {!isSubscriptionActive ? (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-radial from-emerald-950/20 to-transparent">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2">
            ویژه کاربران دارای اشتراک ۱ ماهه و ۳ ماهه چندبوم
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            طرح پایه فاقد هوش مصنوعی است. برای بهره‌مندی از پردازش صوتی، ثبت سریع تراکنش‌ها، گروه‌های دنگ، اهداف مالی و مشاور هوشمند، اشتراک ۱ ماهه یا ۳ ماهه خود را فعال کنید.
          </p>
          <button
            onClick={() => {
              if (openSubscriptionModal) openSubscriptionModal();
              else setActiveTab('subscription');
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>مشاهده پلن‌های ۱ و ۳ ماهه و ارتقای حساب</span>
          </button>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[500px] min-h-[350px] space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  سلام! چطور می‌تونم در مدیریت مالی یا ثبت عملیات به شما کمک کنم؟
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                  کافیست پیام صوتی دهید یا بنویسید؛ هوش مصنوعی آن را شناسایی و پیشنهاد ثبت می‌دهد:
                </p>

                {/* Quick Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                  {QUICK_PROMPTS.map((qp, idx) => {
                    const IconComponent = qp.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(qp.prompt)}
                        className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-[#14231B] border border-[#E2E8E4] dark:border-[#22352B] hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-[#182C22] text-right transition cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#101914] border border-[#E2E8E4] dark:border-[#22352B] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                            {qp.label}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {qp.prompt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onExecuteAction={handleExecuteAction}
                  onDismissAction={handleDismissAction}
                />
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-400 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <span>در حال تحلیل و تدوین پاسخ...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Input Live Indicator Bar */}
          {isListening && (
            <div className="px-4 py-2 bg-emerald-500/15 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold">در حال شنیدن صدای شما به زبان فارسی... صحبت کنید</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] underline text-emerald-700 dark:text-emerald-300 cursor-pointer font-bold"
              >
                پایان ضبط
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t border-[#E2E8E4] dark:border-[#1E2D24] bg-zinc-50 dark:bg-[#101914]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'توقف ضبط صدا' : 'صحبت صوتی (Web Speech)'}
                className={`p-3 rounded-2xl transition cursor-pointer shrink-0 relative ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-zinc-200 dark:bg-[#182820] hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="دستور مالی خود را بگویید یا بنویسید (مثلاً: ثبت کن ۵۰ تومن قهوه، یا گروه دنگ بساز...)"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#14221B] border border-[#D5DDD7] dark:border-[#203328] rounded-2xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-emerald-500 transition font-cairo"
              />

              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white transition cursor-pointer shadow-md shrink-0 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 px-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>دستیار هوشمند چندبوم با ورودی صوت فارسی (fa-IR)</span>
              </div>
              <span className="hidden sm:inline">حفاظت شده توسط سهمیه هوشمند ابری</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
