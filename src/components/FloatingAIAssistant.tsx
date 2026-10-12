import React, { useState, useRef } from 'react';
import {
  Bot,
  Sparkles,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';
import { processFinancialAI } from '../services/aiService';
import { TransactionCategory, TransactionType } from '../types';
import { getCachedAIChat, setCachedAIChat } from '../utils/aiCache';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';

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
    addTransaction,
    metrics,
    user,
    transactions,
    setActiveTab,
    setIsAuthModalOpen,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند. لطفاً متن را تایپ کنید.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setNotice('🎙️ در حال گوش دادن به پیام صوتی شما... بفرمایید');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          setNotice(`✅ دریافت شد: «${transcript}»`);
          setTimeout(() => {
            setNotice(null);
            handleSendMessage(transcript);
          }, 500);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setNotice('متوجه صدا نشدم، لطفاً مجدداً امتحان کنید یا تایپ نمایید.');
        setTimeout(() => setNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setNotice('خطا در دسترسی به میکروفون.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

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

  const handleSendMessage = (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText) return;

    // 1. Must be authenticated first
    if (!isAuthenticated) {
      setNotice('⚠️ هوش مصنوعی فقط برای کسانی که اشتراک پرو دارند فعال می‌شود. لطفاً ابتدا وارد شوید.');
      setTimeout(() => {
        setIsAuthModalOpen(true);
        setNotice(null);
      }, 1200);
      return;
    }

    // 2. Must have Pro subscription
    if (!isProUser) {
      setNotice('🔒 هوش مصنوعی فقط برای کسانی که اشتراک پرو دارند فعال می‌شود.');
      return;
    }

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
      chatHistory: updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      })),
    })
      .then(async (result) => {
        if (result.is_ambiguous) {
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
        } else if (result.is_transaction && result.transaction) {
          // Automatic Transaction Registration from AI Structured Output
          const tx = result.transaction;
          await addTransaction({
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            description: tx.title,
            account: 'کارت اصلی',
            date: new Date().toISOString(),
          });

          const replyText = `✅ تراکنش توسط «دستیار هوشمند چندبوم» تحلیل و به صورت خودکار در دیتابیس ثبت شد:
• نوع: ${tx.type === 'income' ? 'درآمد (واریز)' : 'هزینه (پرداخت)'}
• عنوان: ${tx.title}
• مبلغ: ${formatToman(tx.amount)}
• دسته‌بندی: ${tx.category}
• تاریخ: ${tx.date}

این رکورد در حسابداری شما ثبت شد و مانده حساب فوراً به‌روزرسانی گردید.`;

          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: replyText,
              time: 'هم‌اکنون',
            },
          ]);
        } else {
          // Conversational Advisor
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: result.conversational_reply || 'در صورت نیاز به ثبت تراکنش یا سوال مالی در خدمتم.',
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
            text: 'خطایی در پردازش رخ داد. لطفاً مجدداً امتحان نمایید.',
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
          ) : !isProUser ? (
            /* Gate 2: Authenticated but Not Pro */
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-600/25 to-yellow-500/15 border-b border-amber-400/40 text-right space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-cairo font-bold">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>دسترسی به هوش مصنوعی چندبوم نیازمند اشتراک طلایی (پرو) است</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                برای فعال‌سازی ثبت خودکار تراکنش‌ها، تحلیل ۳ ماه آینده و نظارت هوشمند بر بودجه، اشتراک طلایی را تهیه نمایید.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('subscription');
                }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-zinc-950" />
                <span>خرید اشتراک طلایی پرو (پلن‌های ۱، ۳ و ۶ ماهه)</span>
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
                    <Sparkles className="w-4 h-4 text-amber-400" />
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
