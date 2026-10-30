import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { invokeAiAssistantEdgeFunction } from '../lib/supabase';
import { formatToman, toPersianDigits } from '../utils/formatters';

interface DongGroupAIProps {
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

export const DongGroupAI: React.FC<DongGroupAIProps> = ({ group }) => {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ChatLine[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Each group has a separate conversation; switching groups never carries another group's chat.
  useEffect(() => {
    setHistory([]);
    setInput('');
    setError('');
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
      setHistory(prev => [...prev, { role: 'assistant', content: result.reply! }].slice(-8));
    } catch (e: any) {
      setError(e?.message || 'ارتباط با هوش مصنوعی برقرار نشد.');
      setHistory(prev => prev.filter((m, i) => !(i === prev.length - 1 && m.role === 'user' && m.content === question)));
      setInput(question);
    } finally { setLoading(false); }
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
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="مثلاً سهم هر نفر چقدر است؟" className="min-w-0 flex-1 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-white dark:bg-[#0D120F] px-3 py-2.5 text-sm font-cairo text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/30" maxLength={700} />
          <button type="submit" disabled={!input.trim() || loading} aria-label="ارسال پیام" className="px-3 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white"><Send className="w-4 h-4" /></button>
          {history.length > 0 && <button type="button" aria-label="پاک کردن گفتگو" onClick={() => { setHistory([]); setError(''); }} className="px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500"><RotateCcw className="w-4 h-4" /></button>}
        </form>
      </div>}
    </section>
  );
};
