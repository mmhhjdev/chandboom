/**
 * چندبوم (Chandboom) - Unified GapGPT AI Transaction & Financial Processing Engine
 */

import { TransactionCategory, TransactionType } from '../types';
import { sanitizeAIPrompt } from '../utils/security';
import {
  parsePersianSmartNLU,
  isGreetingOrSmallTalk,
  generateGreetingResponse,
  generateFinancialAdvice,
  parsePersianAmount,
  autoCategorize,
} from '../utils/aiParser';

export interface AiStructuredTransaction {
  type: TransactionType;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string;
}

export interface AiProcessResult {
  is_transaction: boolean;
  is_ambiguous: boolean;
  clarification_message?: string;
  transaction?: AiStructuredTransaction | null;
  conversational_reply?: string;
  raw_input?: string;
}

export interface AiParsedTransaction {
  clean_title: string;
  amount: number;
  type: TransactionType;
  bank?: string | null;
  date: string;
  category: TransactionCategory | null;
  confidence: number;
  raw_input: string;
}

export interface HistoryMessage {
  role?: 'assistant' | 'user' | 'system';
  sender?: 'assistant' | 'user';
  text?: string;
  content?: string;
}

/**
 * Standard Persian current date helper e.g. "1403/07/25"
 */
export function getCurrentShamsiDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(new Date()).split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
  } catch {}
  return new Date().toLocaleDateString('fa-IR');
}

/**
 * Helper to get GapGPT API Key from environment
 */
export function getGapGptApiKey(): string {
  const key =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_GAPGPT_API_KEY ||
        (import.meta as any).env?.VITE_DEEPSEEK_API_KEY ||
        (import.meta as any).env?.GEMINI_API_KEY)) ||
    (typeof process !== 'undefined' &&
      (process.env?.GAPGPT_API_KEY || process.env?.VITE_GAPGPT_API_KEY || process.env?.DEEPSEEK_API_KEY)) ||
    '';
  return key ? key.trim() : '';
}

export function getAiApiKey(): string {
  return getGapGptApiKey();
}

export function getAiBaseUrl(): string {
  const url =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAPGPT_BASE_URL) ||
    'https://api.gapgpt.app/v1';
  return url.replace(/\/$/, '');
}

export function isAiConfigured(): boolean {
  return Boolean(getGapGptApiKey());
}

const VALID_EXPENSE_CATEGORIES: TransactionCategory[] = [
  'خوراک و رستوران',
  'مسکن و اجاره',
  'حمل‌ونقل و خودرو',
  'خرید و پوشاک',
  'سرگرمی و تفریح',
  'سلامت و درمان',
  'قبوض و شارژ',
  'آموزش و کتاب',
  'سایر و متفرقه',
];

const VALID_INCOME_CATEGORIES: TransactionCategory[] = [
  'حقوق و دستمزد',
  'سرمایه‌گذاری و سود',
  'هدیه و پاداش',
  'فروش و کسب‌وکار',
  'سایر دریافتی‌ها',
];

function normalizeCategory(catStr: string | undefined, type: TransactionType): TransactionCategory {
  if (!catStr) {
    return type === 'income' ? 'حقوق و دستمزد' : 'خوراک و رستوران';
  }
  const clean = catStr.trim();
  const allValid = [...VALID_EXPENSE_CATEGORIES, ...VALID_INCOME_CATEGORIES];
  const exact = allValid.find((v) => v.toLowerCase() === clean.toLowerCase() || clean.includes(v) || v.includes(clean));
  if (exact) return exact;

  if (type === 'income') {
    if (clean.includes('حقوق') || clean.includes('دستمزد')) return 'حقوق و دستمزد';
    if (clean.includes('سود') || clean.includes('سرمایه')) return 'سرمایه‌گذاری و سود';
    if (clean.includes('هدیه') || clean.includes('جایزه')) return 'هدیه و پاداش';
    if (clean.includes('فروش') || clean.includes('کسب')) return 'فروش و کسب‌وکار';
    return 'سایر دریافتی‌ها';
  } else {
    if (clean.includes('خوراک') || clean.includes('غذا') || clean.includes('رستوران')) return 'خوراک و رستوران';
    if (clean.includes('مسکن') || clean.includes('اجاره')) return 'مسکن و اجاره';
    if (clean.includes('حمل') || clean.includes('بنزین') || clean.includes('اسنپ')) return 'حمل‌ونقل و خودرو';
    if (clean.includes('پوشاک') || clean.includes('لباس')) return 'خرید و پوشاک';
    if (clean.includes('تفریح') || clean.includes('سرگرمی')) return 'سرگرمی و تفریح';
    if (clean.includes('سلامت') || clean.includes('درمان') || clean.includes('دارو')) return 'سلامت و درمان';
    if (clean.includes('قبض') || clean.includes('شارژ')) return 'قبوض و شارژ';
    if (clean.includes('آموزش') || clean.includes('کتاب')) return 'آموزش و کتاب';
    return 'سایر و متفرقه';
  }
}

/**
 * Local Rule-Based Engine (Fallback)
 */
function analyzeLocally(input: string): AiProcessResult {
  const { safePrompt } = sanitizeAIPrompt(input);
  const p = safePrompt.trim();

  if (isGreetingOrSmallTalk(p)) {
    return {
      is_transaction: false,
      is_ambiguous: false,
      conversational_reply: generateGreetingResponse(p),
      raw_input: p,
    };
  }

  const hasTxKeyword = /(خرید|خریدم|خرج|واریز|واریزی|پرداخت|دستمزد|گرفتم|اسنپ|ساندویچ|قهوه|پیتزا|بنزین|اجاره|قسط|میوه|سوپرمارکت|درآمد|حقوق|پاداش)/i.test(p);
  const amount = parsePersianAmount(p);

  if (hasTxKeyword && amount <= 0) {
    const isIncome = /(واریز|حقوق|پاداش|درآمد|دستمزد|گرفتم)/i.test(p);
    const msg = isIncome
      ? `مبلغ دقیق دریافت یا واریز «${p}» را مشخص نکردید؛ لطفاً مبلغ را به تومان بفرمایید.`
      : `مبلغ دقیق هزینه «${p}» را مشخص نکردید؛ لطفاً مبلغ آن را به تومان مشخص نمایید.`;
    return {
      is_transaction: false,
      is_ambiguous: true,
      clarification_message: msg,
      raw_input: p,
    };
  }

  if (amount > 0) {
    const isIncome = /(واریز|حقوق|پاداش|درآمد|دستمزد|گرفتم|فروش|سود)/i.test(p);
    const type: TransactionType = isIncome ? 'income' : 'expense';
    const smartParsed = parsePersianSmartNLU(p);
    const category = normalizeCategory(autoCategorize(p), type);
    const title = smartParsed.cleanTitle || p.substring(0, 40);

    return {
      is_transaction: true,
      is_ambiguous: false,
      transaction: {
        type,
        title,
        amount,
        category,
        date: getCurrentShamsiDate(),
      },
      raw_input: p,
    };
  }

  return {
    is_transaction: false,
    is_ambiguous: false,
    conversational_reply: generateFinancialAdvice(p, { totalIncome: 0, totalExpense: 0, balance: 0 }, 20000000).text,
    raw_input: p,
  };
}

/**
 * Main AI Engine using GapGPT API (`/chat/completions`)
 */
export async function processFinancialAI(
  userInput: string,
  userContext?: {
    metrics?: { totalIncome: number; totalExpense: number; balance: number };
    monthlyCap?: number;
    fullName?: string;
    chatHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  }
): Promise<AiProcessResult> {
  const { safePrompt } = sanitizeAIPrompt(userInput);
  const trimmed = safePrompt.trim();
  if (!trimmed) {
    return {
      is_transaction: false,
      is_ambiguous: true,
      clarification_message: 'لطفاً متن یا پیام صوتی تراکنش خود را وارد نمایید.',
      raw_input: '',
    };
  }

  const apiKey = getGapGptApiKey();
  const baseUrl = getAiBaseUrl();
  const currentShamsi = getCurrentShamsiDate();

  if (apiKey) {
    try {
      const systemPrompt = `شما موتور هوشمند تراکنش‌های مالی و مشاور مالی سامانه «چندبوم» (Chandboom) هستید.
تاریخ امروز: ${currentShamsi}
دسته‌بندی‌های هزینه‌ها: 'خوراک و رستوران', 'مسکن و اجاره', 'حمل‌ونقل و خودرو', 'خرید و پوشاک', 'سرگرمی و تفریح', 'سلامت و درمان', 'قبوض و شارژ', 'آموزش و کتاب', 'سایر و متفرقه'
دسته‌بندی‌های درآمدها: 'حقوق و دستمزد', 'سرمایه‌گذاری و سود', 'هدیه و پاداش', 'فروش و کسب‌وکار', 'سایر دریافتی‌ها'

پاسخ خود را دقیقاً در قالب یک شیء JSON معتبر بازگردانید:
۱. اگر تراکنش است و اطلاعات کامل است:
{
  "is_transaction": true,
  "is_ambiguous": false,
  "transaction": {
    "type": "income" یا "expense",
    "title": "عنوان کوتاه و تمیز",
    "amount": عدد صحیح به تومان,
    "category": "یکی از دسته‌بندی‌های دقیق بالا",
    "date": "${currentShamsi}"
  }
}
۲. اگر اطلاعات تراکنش مبهم یا ناقص است:
{
  "is_transaction": false,
  "is_ambiguous": true,
  "clarification_message": "متن درخواست شفاف‌سازی مؤدبانه به فارسی"
}
۳. اگر گفتگوی عادی یا مشاوره مالی است:
{
  "is_transaction": false,
  "is_ambiguous": false,
  "conversational_reply": "پاسخ مشاوره‌ای جذاب و دقیق به فارسی"
}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(userContext?.chatHistory?.map((m) => ({ role: m.role, content: m.text })) || []),
        { role: 'user', content: trimmed },
      ];

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gapgpt-gemma-26b-a4b',
          messages,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.is_transaction && parsed.transaction) {
            const tx = parsed.transaction;
            return {
              is_transaction: true,
              is_ambiguous: false,
              transaction: {
                type: tx.type === 'income' ? 'income' : 'expense',
                title: tx.title || trimmed,
                amount: Number(tx.amount) || 0,
                category: normalizeCategory(tx.category, tx.type),
                date: tx.date || currentShamsi,
              },
              raw_input: trimmed,
            };
          }
          if (parsed.is_ambiguous || parsed.clarification_message) {
            return {
              is_transaction: false,
              is_ambiguous: true,
              clarification_message: parsed.clarification_message || 'مبلغ یا نوع تراکنش نامشخص است.',
              raw_input: trimmed,
            };
          }
          if (parsed.conversational_reply) {
            return {
              is_transaction: false,
              is_ambiguous: false,
              conversational_reply: parsed.conversational_reply,
              raw_input: trimmed,
            };
          }
        }
      }
    } catch (err) {
      console.warn('GapGPT API request failed, falling back to local engine:', err);
    }
  }

  return analyzeLocally(trimmed);
}

export async function parseTransactionWithSystemOne(input: string): Promise<AiParsedTransaction> {
  const result = await processFinancialAI(input);
  if (result.is_transaction && result.transaction) {
    return {
      clean_title: result.transaction.title,
      amount: result.transaction.amount,
      type: result.transaction.type,
      bank: null,
      date: new Date().toISOString(),
      category: result.transaction.category,
      confidence: 0.99,
      raw_input: input,
    };
  }
  const local = parsePersianSmartNLU(input);
  return {
    clean_title: local.cleanTitle,
    amount: local.amount,
    type: local.type,
    bank: local.bank || null,
    date: new Date().toISOString(),
    category: null,
    confidence: local.amount > 0 ? 0.9 : 0.3,
    raw_input: input,
  };
}

export async function getConversationalAdvice(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string },
  chatHistory?: HistoryMessage[]
): Promise<string> {
  const result = await processFinancialAI(userQuery, {
    metrics,
    monthlyCap,
    fullName: demographics?.fullName,
    chatHistory: chatHistory?.map((h) => ({
      role: (h.role === 'user' || h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      text: h.text || h.content || '',
    })),
  });

  if (result.is_ambiguous && result.clarification_message) {
    return result.clarification_message;
  }
  if (result.is_transaction && result.transaction) {
    const tx = result.transaction;
    return `متوجه ثبت تراکنش «${tx.title}» به مبلغ ${tx.amount.toLocaleString('fa-IR')} تومان در دسته‌بندی ${tx.category} شدم.`;
  }
  return result.conversational_reply || 'چگونه می‌توانم در مدیریت مالی به شما کمک کنم؟';
}

export const aiService = {
  processFinancialAI,
  parseTransaction: parseTransactionWithSystemOne,
  getAdvice: getConversationalAdvice,
  isConfigured: isAiConfigured,
};

export default aiService;