/**
 * چندبوم (Chandboom) - AI Transaction & Financial Processing Engine
 *
 * 1. Structured JSON Output for Transactions:
 *    {
 *      "type": "income" | "expense",
 *      "title": "عنوان کوتاه و تمیز تراکنش",
 *      "amount": number (تومان),
 *      "category": "دسته‌بندی مناسب",
 *      "date": "تاریخ استاندارد"
 *    }
 *
 * 2. Ambiguity Handling:
 *    If the user's input is incomplete or ambiguous (e.g. amount is missing or transaction type is unclear),
 *    the AI responds with a concise clarification request without guessing or fabricating fake data.
 */

import { GoogleGenAI } from '@google/genai';
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

// Legacy format compatibility
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
 * Helper to get the Gemini API Key
 */
export function getGeminiApiKey(): string {
  const envKey =
    (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || (process.env as any)?.VITE_GEMINI_API_KEY)) ||
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY)) ||
    '';
  return envKey ? envKey.trim() : '';
}

export function getAiApiKey(): string {
  return getGeminiApiKey() || getSecondaryApiKey();
}

export function getAiBaseUrl(): string {
  return 'https://api.gapgpt.app/v1';
}

/**
 * Helper to get GapGPT / Secondary API Key
 */
export function getSecondaryApiKey(): string {
  const key =
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_GAPGPT_API_KEY || (import.meta as any).env?.VITE_DEEPSEEK_API_KEY)) ||
    (typeof process !== 'undefined' && (process.env?.GAPGPT_API_KEY || process.env?.VITE_GAPGPT_API_KEY)) ||
    '';
  return key ? key.trim() : '';
}

export function isAiConfigured(): boolean {
  return Boolean(getGeminiApiKey() || getSecondaryApiKey());
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

/**
 * Normalizes category string to one of the approved system categories
 */
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
    if (clean.includes('هدیه') || clean.includes('جایزه') || clean.includes('عیدی')) return 'هدیه و پاداش';
    if (clean.includes('فروش') || clean.includes('کسب')) return 'فروش و کسب‌وکار';
    return 'سایر دریافتی‌ها';
  } else {
    if (clean.includes('خوراک') || clean.includes('غذا') || clean.includes('رستوران') || clean.includes('میوه')) return 'خوراک و رستوران';
    if (clean.includes('مسکن') || clean.includes('اجاره') || clean.includes('خانه')) return 'مسکن و اجاره';
    if (clean.includes('حمل') || clean.includes('ماشین') || clean.includes('بنزین') || clean.includes('اسنپ')) return 'حمل‌ونقل و خودرو';
    if (clean.includes('پوشاک') || clean.includes('لباس') || clean.includes('خرید')) return 'خرید و پوشاک';
    if (clean.includes('تفریح') || clean.includes('سرگرمی') || clean.includes('سینما')) return 'سرگرمی و تفریح';
    if (clean.includes('سلامت') || clean.includes('درمان') || clean.includes('دارو') || clean.includes('دکتر')) return 'سلامت و درمان';
    if (clean.includes('قبض') || clean.includes('شارژ') || clean.includes('برق') || clean.includes('آب')) return 'قبوض و شارژ';
    if (clean.includes('آموزش') || clean.includes('کتاب') || clean.includes('درس')) return 'آموزش و کتاب';
    return 'سایر و متفرقه';
  }
}

/**
 * Local Rule-Based Ambiguity and Extraction Engine (Fallback)
 */
function analyzeLocally(input: string): AiProcessResult {
  const { safePrompt } = sanitizeAIPrompt(input);
  const p = safePrompt.trim();

  // 1. Small talk or Greeting
  if (isGreetingOrSmallTalk(p)) {
    return {
      is_transaction: false,
      is_ambiguous: false,
      conversational_reply: generateGreetingResponse(p),
      raw_input: p,
    };
  }

  // Check transaction keywords
  const hasTxKeyword = /(خرید|خریدم|خریده|خرج|خرجی|واریز|واریزی|پرداخت|پرداختی|دستمزد|گرفتم|فاکتور|اسنپ|ساندویچ|قهوه|کارت|پیتزا|بنزین|اجاره|قسط|میوه|سوپرمارکت|دیجیکالا|درآمد|حقوق|پاداش)/i.test(p);
  const amount = parsePersianAmount(p);

  // Ambiguity Detection: If user expresses intent to record a transaction but no valid amount found
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

  // Ambiguity Detection: If user entered just a number without item or type
  const isPureNumber = /^[0-9۰-۹\s,،]+$/.test(p.replace(/(تومان|تومن|ریال|هزار|میلیون)/g, '').trim());
  if (isPureNumber && !hasTxKeyword && p.length < 25) {
    return {
      is_transaction: false,
      is_ambiguous: true,
      clarification_message: 'مبلغ مشخص شده است اما مشخص نکردید این تراکنش بابت چه موردی و آیا درآمد است یا هزینه؟ لطفاً عنوان و نوع آن را بفرمایید.',
      raw_input: p,
    };
  }

  // If complete transaction detected
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

  // Default financial question or small talk
  return {
    is_transaction: false,
    is_ambiguous: false,
    conversational_reply: generateFinancialAdvice(p, { totalIncome: 0, totalExpense: 0, balance: 0 }, 20000000).text,
    raw_input: p,
  };
}

/**
 * Main AI Engine: Analyzes user input (text or transcribed voice)
 * and returns structured JSON output for transactions or clarification for ambiguous queries.
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

  const geminiKey = getGeminiApiKey();
  const currentShamsi = getCurrentShamsiDate();

  // 1. Try Gemini 3.8 Flash with Structured JSON Output
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const systemInstruction = `شما موتور تحلیل هوشمند تراکنش‌های مالی و مشاور مدیریت مالی سامانه «چندبوم» (Chandboom) هستید.
وظیفه شما تحلیل دقیق پیام متنی یا صوتی کاربر (تبدیل‌شده به متن) است.

دسته‌بندی‌های استاندارد سامانه چندبوم:
- هزینه‌ها (expense): 'خوراک و رستوران' | 'مسکن و اجاره' | 'حمل‌ونقل و خودرو' | 'خرید و پوشاک' | 'سرگرمی و تفریح' | 'سلامت و درمان' | 'قبوض و شارژ' | 'آموزش و کتاب' | 'سایر و متفرقه'
- درآمدها (income): 'حقوق و دستمزد' | 'سرمایه‌گذاری و سود' | 'هدیه و پاداش' | 'فروش و کسب‌وکار' | 'سایر دریافتی‌ها'

تاریخ امروز سامانه: ${currentShamsi}

دستورالعمل خروجی:
خروجی شما باید منحصراً یک ساختار JSON معتبر باشد.

حالت الف) کاربر قصد ثبت یا گزارش تراکنش مالی (درآمد یا هزینه) دارد:
۱. اگر اطلاعات برای ثبت تراکنش ناقص یا مبهم است (مثلاً مبلغ مشخص نشده، یا مشخص نیست درآمد است یا هزینه، یا عنوان تراکنش مبهم است):
   هرگز اطلاعات فیک یا حدسی پر نکنید. خروجی باید به این صورت باشد:
   {
     "is_transaction": false,
     "is_ambiguous": true,
     "clarification_message": "یک جمله کوتاه، مؤدبانه و صمیمی به زبان فارسی که مشخص می‌کند کدام بخش مبهم است و درخواست شفاف‌سازی می‌کند (مثال: «مبلغ دقیق یا نوع تراکنش را مشخص نکردید، لطفاً بفرمایید درآمد است یا هزینه؟» یا «مبلغ دقیق خرید ساندویچ را مشخص نکردید، لطفاً بفرمایید چند تومان است؟»)"
   }

۲. اگر اطلاعات تراکنش کامل است (دارای نوع درآمد یا هزینه، مبلغ مشخص و عنوان مشخص):
   خروجی باید به این صورت باشد:
   {
     "is_transaction": true,
     "is_ambiguous": false,
     "transaction": {
       "type": "income" یا "expense",
       "title": "عنوان کوتاه و تمیز تراکنش بدون کلمات اضافه مثل خرید، واریز، مبلغ یا تومان (مثال: حقوق پروژه، خرید میوه، اسنپ)",
       "amount": عدد صحیح دقیق به تومان (مثلاً ۲۵ میلیون = 25000000، ۵۰ هزار = 50000، ریال بر ۱۰ تقسیم شود),
       "category": "یکی از دسته‌بندی‌های استاندارد ذکر شده در بالا متناسب با موضوع",
       "date": "تاریخ استخراج‌شده از متن (مثلاً اگر کاربر گفت ۲۵ مهر: ۱۴۰۳/۰۷/۲۵؛ در غیر این صورت تاریخ استاندارد ${currentShamsi})"
     }
   }

حالت ب) اگر پیام کاربر گفتگوی عمومی، احوالپرسی یا سوال و تحلیل مالی است و قصد ثبت تراکنش ندارد:
{
  "is_transaction": false,
  "is_ambiguous": false,
  "conversational_reply": "پاسخ دوستانه، دلگرم‌کننده و تحلیلی در چند بند کوتاه به زبان فارسی به عنوان «دستیار هوشمند چندبوم»"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: trimmed,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);

          // If structured transaction is returned
          if (parsed.is_transaction && (parsed.transaction || (parsed.type && parsed.amount))) {
            const rawTx = parsed.transaction || parsed;
            const txType: TransactionType = String(rawTx.type).toLowerCase().includes('income') ? 'income' : 'expense';
            const numAmount = Number(rawTx.amount) || 0;
            if (numAmount > 0) {
              return {
                is_transaction: true,
                is_ambiguous: false,
                transaction: {
                  type: txType,
                  title: String(rawTx.title || trimmed).trim(),
                  amount: Math.round(numAmount),
                  category: normalizeCategory(rawTx.category, txType),
                  date: String(rawTx.date || currentShamsi),
                },
                raw_input: trimmed,
              };
            }
          }

          // If ambiguous query
          if (parsed.is_ambiguous || parsed.clarification_message) {
            return {
              is_transaction: false,
              is_ambiguous: true,
              clarification_message:
                parsed.clarification_message ||
                'مبلغ دقیق یا نوع تراکنش مشخص نیست، لطفاً بفرمایید درآمد است یا هزینه؟',
              raw_input: trimmed,
            };
          }

          // Conversational answer
          if (parsed.conversational_reply) {
            return {
              is_transaction: false,
              is_ambiguous: false,
              conversational_reply: parsed.conversational_reply,
              raw_input: trimmed,
            };
          }
        } catch (jsonErr) {
          console.warn('Could not parse Gemini JSON response, falling back:', jsonErr);
        }
      }
    } catch (geminiError: any) {
      console.warn('Gemini generateContent call encountered an issue, trying fallback:', geminiError?.message);
    }
  }

  // 2. Fallback to Local Rule-Based Engine
  return analyzeLocally(trimmed);
}

/**
 * Backward compatibility parser (used in SMS parsing and legacy callers)
 */
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

  // Fallback
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

/**
 * Conversational advice caller
 */
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
      role: h.role === 'user' || h.sender === 'user' ? 'user' : 'assistant',
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

/**
 * Standard Unified Export Object
 */
export const aiService = {
  processFinancialAI,
  parseTransaction: parseTransactionWithSystemOne,
  getAdvice: getConversationalAdvice,
  isConfigured: isAiConfigured,
};

export default aiService;
