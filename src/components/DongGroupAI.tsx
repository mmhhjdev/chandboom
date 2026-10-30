import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Loader2, RotateCcw, ChevronDown, ChevronUp, Mic, Check, X, WandSparkles } from 'lucide-react';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { formatToman, toPersianDigits } from '../utils/formatters';

export interface ExpenseDraftItem { title: string; amount: number; participants: string[]; }
export interface ExpenseDraft { title: string; payer: string; items: ExpenseDraftItem[]; }
interface DongGroupAIProps {
  onRegisterExpense: (draft: ExpenseDraft) => Promise<void>;
  currentUserName?: string | null;
  group: {
    id: string;
    name: string;
    members: string[];
    isFamilyMode: boolean;
    families: { name: string; count: number }[];
    expenses: { id: string; title: string; payer: string; amount: number; participants: string[] }[];
  };
}
interface ChatLine { role: 'user' | 'assistant'; content: string; }

const starterPrompts = [
  'بدهی هر نفر را خلاصه کن',
  'چطور با کمترین انتقال تسویه کنیم؟',
  'هزینه‌های گروه را تحلیل کن',
];

export const DongGroupAI: React.FC<DongGroupAIProps> = ({ group, onRegisterExpense, currentUserName }) => {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Each group has a separate conversation; switching groups never carries another group's chat.
  useEffect(() => {
    setHistory([]);
    setInput('');
    setError('');
    setDraft(null);
    setDraftError('');
    setExpanded(false);
  }, [group.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [history, loading]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setExpanded(true);
    setInput('');
    setError('');
    const nextHistory: ChatLine[] = [...history, { role: 'user', content: question }].slice(-8);
    setHistory(nextHistory);
    setLoading(true);
    const context = {
      group_id: group.id,
      group_name: group.name,
      group_type: group.isFamilyMode ? 'family' : 'friends',
      members: group.members,
      families: group.families,
      expenses: group.expenses.map(e => ({ title: e.title, payer: e.payer, amount: e.amount, participants: e.participants })),
      total_expenses: group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
      expense_count: group.expenses.length,
    };
    const scopedQuestion = `این گفتگو فقط درباره تحلیل هزینه‌های گروه دنگ مشخص‌شده زیر است. فقط از داده‌های همین گروه استفاده کن؛ اگر داده برای محاسبه بدهی دقیق کافی نیست، این محدودیت را شفاف بگو. واحد مبلغ‌ها تومان است. هیچ هزینه یا تغییری ثبت نکن و ادعا نکن چیزی را تغییر داده‌ای.\nاطلاعات گروه: ${JSON.stringify(context)}\nسؤال کاربر: ${question}`;
    try {
      const result = await invokeAiAssistantEdgeFunction(scopedQuestion, nextHistory.slice(0, -1), 'advisor');
      if (!result.success || !result.reply) throw new Error(result.error || 'پاسخ هوش مصنوعی دریافت نشد.');
      setHistory(prev => [...prev, { role: 'assistant' as const, content: result.reply! }].slice(-8));
    } catch (e: any) {
      setError(e?.message || 'ارتباط با هوش مصنوعی برقرار نشد.');
      setHistory(prev => prev.filter((m, i) => !(i === prev.length - 1 && m.role === 'user' && m.content === question)));
      setInput(question);
    } finally { setLoading(false); }
  };

  const normalizeName = (value: string) => value.trim().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').toLowerCase();

  const startVoiceInput = () => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setDraftError('مرورگر شما تبدیل گفتار به متن را پشتیبانی نمی‌کند. از Chrome یا Edge استفاده کنید یا متن را تایپ کنید.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setDraftError(''); };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setInput((previous) => `${previous.trim()} ${transcript}`.trim());
    };
    recognition.onerror = () => setDraftError('صدای شما دریافت نشد. اجازه میکروفون را بررسی کنید و دوباره تلاش کنید.');
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const prepareExpense = async () => {
    const spoken = input.trim();
    if (!spoken || draftLoading) return;
    setDraftLoading(true);
    setDraftError('');
    setDraft(null);
    const prompt = `از متن زیر فقط یک پیش‌نویس هزینه برای گروه دنگ استخراج کن. هنوز چیزی ثبت نکن. نام اعضای معتبر گروه: ${JSON.stringify(group.members)}. نام نمایشی کاربر فعلی: ${JSON.stringify(currentUserName || null)}. گروه: ${group.name}. واحد پیش‌فرض تومان است؛ «هزار تومان» را در مبلغ عددی ضربدر ۱۰۰۰ کن. اگر کاربر گفت «من»، «خودم» یا «من حساب کردم»، payer را فقط در صورت تطبیق قطعی با عضو گروه برابر نام واقعی عضو کن؛ در غیر این صورت از مقدار «__CURRENT_USER__» استفاده کن تا برنامه بررسی کند. هر آیتم باید مصرف‌کننده‌های همان آیتم را داشته باشد. فقط JSON معتبر و بدون markdown برگردان با این ساختار: {"title":"نام کلی هزینه","payer":"نام پرداخت‌کننده یا __CURRENT_USER__","items":[{"title":"نام آیتم","amount":320000,"participants":["نام عضو"]}],"missing_information":[]} . اگر مبلغ، پرداخت‌کننده یا مصرف‌کننده‌ها قابل تشخیص نیستند، چیزی حدس نزن و آن را در missing_information بنویس. همه آیتم‌ها باید مبلغ مثبت داشته باشند. متن کاربر: ${spoken}`;
    try {
      const result = await invokeAiAssistantEdgeFunction(prompt, [], 'advisor');
      if (!result.success || !result.reply) throw new Error(result.error || 'پیش‌نویس هزینه ساخته نشد.');
      const replyText = result.reply.trim();
      const jsonStart = replyText.indexOf('{');
      const jsonEnd = replyText.lastIndexOf('}');
      if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error('پاسخ هوش مصنوعی ساختار قابل‌خواندن نداشت. دوباره تلاش کن.');
      const parsed = JSON.parse(replyText.slice(jsonStart, jsonEnd + 1));
      if (Array.isArray(parsed.missing_information) && parsed.missing_information.length) {
        throw new Error(`برای آماده‌سازی هزینه این موارد روشن نیست: ${parsed.missing_information.join('، ')}`);
      }
      if (!parsed.title || !parsed.payer || !Array.isArray(parsed.items) || parsed.items.length === 0) throw new Error('اطلاعات هزینه کامل استخراج نشد. متن را دقیق‌تر بنویس.');
      const members = group.members;
      const resolveMember = (name: string) => {
        if (name === '__CURRENT_USER__' || ['من', 'خودم', 'کاربر فعلی'].includes(normalizeName(name))) {
          const currentMatch = members.find(m => currentUserName && normalizeName(m) === normalizeName(currentUserName));
          if (currentMatch) return currentMatch;
          const aliasMatch = members.find(m => ['من', 'خودم'].includes(normalizeName(m)));
          return aliasMatch || '';
        }
        return members.find(m => normalizeName(m) === normalizeName(name)) || '';
      };
      const payer = resolveMember(String(parsed.payer));
      const items: ExpenseDraftItem[] = parsed.items.map((item: any) => ({
        title: String(item.title || '').trim(),
        amount: Number(item.amount),
        participants: Array.isArray(item.participants) ? item.participants.map((n: unknown) => resolveMember(String(n))).filter(Boolean) : [],
      }));
      const invalid = items.some(item => !item.title || !Number.isFinite(item.amount) || item.amount <= 0 || item.participants.length === 0);
      if (!payer || invalid) throw new Error('یک یا چند نام با اعضای گروه تطبیق نداشت یا اطلاعات ناقص بود. نام پرداخت‌کننده و مصرف‌کننده‌ها را واضح‌تر بگو؛ هنوز هیچ هزینه‌ای ثبت نشده است.');
      setDraft({ title: String(parsed.title), payer, items });
    } catch (e: any) {
      setDraftError(e?.message || 'ساخت پیش‌نویس ناموفق بود.');
    } finally { setDraftLoading(false); }
  };

  const confirmDraft = async () => {
    if (!draft || savingDraft) return;
    setSavingDraft(true);
    setDraftError('');
    try {
      await onRegisterExpense(draft);
      setDraft(null);
      setInput('');
      setDraftError('هزینه با موفقیت در گروه ثبت شد.');
    } catch (e: any) {
      setDraftError(e?.message || 'ثبت هزینه انجام نشد.');
    } finally { setSavingDraft(false); }
  };

  return (
    <section className="rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-[#171326] dark:via-[#101510] dark:to-[#151529] overflow-hidden shadow-xs">
      <button type="button" onClick={() => setExpanded(v => !v)} className="w-full p-4 flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center"><Bot className="w-5 h-5" /></div>
          <div>
            <h3 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">هوش مصنوعی این گروه <Sparkles className="w-4 h-4 text-violet-600" /></h3>
            <p className="font-cairo text-xs text-zinc-500 mt-1">تحلیل هزینه‌ها و تسویه مخصوص «{group.name}» · {toPersianDigits(group.expenses.length)} هزینه</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
      </button>
      {expanded && <div className="px-4 pb-4 space-y-3">
        <div className="rounded-xl bg-white/80 dark:bg-black/20 border border-violet-100 dark:border-violet-900/40 p-3 text-xs text-zinc-600 dark:text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
          <span>مجموع هزینه‌ها: <b className="text-violet-700 dark:text-violet-300">{formatToman(group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))}</b></span>
          <span>اعضا: <b>{toPersianDigits(group.members.length || group.families.length)}</b></span>
          <span className="text-zinc-400">فقط اطلاعات همین گروه به پرسش اضافه می‌شود.</span>
        </div>
        {history.length === 0 && <div className="flex flex-wrap gap-2">{starterPrompts.map(p => <button key={p} type="button" onClick={() => void send(p)} className="text-xs font-cairo px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-900/50 text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/30">{p}</button>)}</div>}
        {history.length > 0 && <div className="max-h-72 overflow-y-auto space-y-3 py-1">
          {history.map((m, i) => <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm whitespace-pre-wrap leading-7 font-cairo ${m.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100' : 'bg-violet-100 dark:bg-violet-950/60 text-zinc-800 dark:text-zinc-100'}`}>{m.content}</div></div>)}
          {loading && <div className="text-xs text-violet-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />در حال بررسی اطلاعات این گروه…</div>}
          <div ref={endRef} />
        </div>}
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="سؤال بپرس یا هزینه را محاوره‌ای تعریف کن…" className="min-w-0 flex-1 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-[#0D120F] px-3 py-2.5 text-sm font-cairo text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/30" maxLength={1200} />
          <button type="button" onClick={startVoiceInput} disabled={listening || draftLoading} aria-label="گفتن هزینه با صدا" title="گفتن با صدا" className={`px-3 rounded-xl border border-violet-200 dark:border-violet-900/60 ${listening ? 'bg-rose-100 text-rose-700' : 'text-violet-700 dark:text-violet-300'}`}><Mic className="w-4 h-4" /></button>
          <button type="submit" disabled={!input.trim() || loading} aria-label="ارسال پیام" className="px-3 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white"><Send className="w-4 h-4" /></button>
          {history.length > 0 && <button type="button" aria-label="پاک کردن گفتگو" onClick={() => { setHistory([]); setError(''); }} className="px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500"><RotateCcw className="w-4 h-4" /></button>}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void prepareExpense()} disabled={!input.trim() || draftLoading || savingDraft} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-3 py-2 text-xs font-cairo font-bold"><WandSparkles className="w-4 h-4" />{draftLoading ? 'در حال فهمیدن هزینه…' : 'آماده‌سازی برای ثبت هزینه'}</button>
          <span className="text-[11px] text-zinc-500 font-cairo">قبل از ثبت، جزئیات را تأیید می‌کنی.</span>
        </div>
        {draftError && <p role="status" className={`text-xs font-cairo ${draftError.includes('موفقیت') ? 'text-emerald-600' : 'text-rose-600'}`}>{draftError}</p>}
        {draft && <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 space-y-3">
          <div className="font-cairo font-bold text-sm">بررسی هزینه پیش از ثبت</div>
          <div className="text-xs font-cairo text-zinc-600 dark:text-zinc-300">عنوان: {draft.title} · پرداخت‌کننده: {draft.payer}</div>
          <div className="space-y-2">{draft.items.map((item, i) => <div key={`${item.title}-${i}`} className="flex items-start justify-between gap-3 rounded-xl bg-white/80 dark:bg-black/20 p-2.5 text-xs font-cairo"><div><div className="font-bold">{item.title}</div><div className="text-zinc-500 mt-1">مصرف‌کننده: {item.participants.join('، ')}</div></div><b className="whitespace-nowrap">{formatToman(item.amount)}</b></div>)}</div>
          <div className="flex items-center justify-between border-t border-emerald-200 dark:border-emerald-900/60 pt-2 text-sm font-cairo"><span>مجموع</span><b>{formatToman(draft.items.reduce((sum, item) => sum + item.amount, 0))}</b></div>
          <div className="flex gap-2"><button type="button" onClick={() => void confirmDraft()} disabled={savingDraft} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white px-3 py-2 text-xs font-cairo font-bold disabled:opacity-50"><Check className="w-4 h-4" />{savingDraft ? 'در حال ثبت…' : 'تأیید و ثبت هزینه'}</button><button type="button" onClick={() => setDraft(null)} disabled={savingDraft} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-cairo"><X className="w-4 h-4" />لغو</button></div>
        </div>}
      </div>}
    </section>
  );
};
