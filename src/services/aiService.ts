/**
 * چندبوم (Chandboom) - سامانه هوشمند پردازش مالی و تحلیل تراکنش‌ها
 *
 * موتور اختصاصی هوش مصنوعی چندبوم (Chandboom AI Engine):
 * - تمامی پردازش‌ها و تحلیل‌های تراکنش‌ها و مشاوره‌های مالی منحصراً توسط هوش مصنوعی چندبوم انجام می‌شود.
 * - در صورت بروز خطا یا عدم پیکربندی کلید، پیام خطای شفاف و بدون افشای نام‌های خارجی به کاربر نمایش داده می‌شود.
 */

import { TransactionCategory, TransactionType } from '../types';
import { sanitizeAIPrompt } from '../utils/security';

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
  transactions?: AiStructuredTransaction[];
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
 * Helper to get the AI Base URL from Vite environment variables
 */
export function getAiBaseUrl(): string {
  let url =
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_AI_BASE_URL || (import.meta as any).env?.VITE_GAPGPT_BASE_URL)) ||
    (typeof process !== 'undefined' && (process.env?.VITE_AI_BASE_URL || process.env?.VITE_GAPGPT_BASE_URL || process.env?.GAPGPT_BASE_URL)) ||
    'https://api.gapgpt.app/v1';
  url = String(url || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!url) {
    url = 'https://api.gapgpt.app/v1';
  }
  // If user provided a base host without /v1 and without /chat/completions, ensure /v1
  if (!url.includes('/v1') && !url.includes('/chat/completions')) {
    url = `${url}/v1`;
  }
  return url;
}

export const getGapGptBaseUrl = getAiBaseUrl;

/**
 * Returns the fully qualified chat completions endpoint URL
 */
export function getAiChatEndpoint(customBaseUrl?: string): string {
  let url = (customBaseUrl || getAiBaseUrl()).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!url) {
    return 'https://api.gapgpt.app/v1/chat/completions';
  }
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (!url.includes('/v1')) {
    url = `${url}/v1`;
  }
  return `${url}/chat/completions`;
}

/**
 * Helper to get the AI API Key from Vite environment variables
 */
export function getAiApiKey(): string {
  let key =
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_AI_API_KEY || (import.meta as any).env?.VITE_GAPGPT_API_KEY || (import.meta as any).env?.VITE_DEEPSEEK_API_KEY)) ||
    (typeof process !== 'undefined' && (process.env?.VITE_AI_API_KEY || process.env?.VITE_GAPGPT_API_KEY || process.env?.GAPGPT_API_KEY || process.env?.DEEPSEEK_API_KEY)) ||
    '';
  if (typeof key === 'string') {
    key = key.trim().replace(/^['"]|['"]$/g, '');
  }
  return key;
}

export const getGapGptApiKey = getAiApiKey;

export function isAiConfigured(): boolean {
  return Boolean(getAiApiKey());
}

export const AI_CHAT_MODEL =
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_AI_MODEL || (import.meta as any).env?.VITE_GAPGPT_MODEL)) ||
  'gapgpt-gemma-26b-a4b';

export const GAPGPT_CHAT_MODEL = AI_CHAT_MODEL;

export const AI_PARSER_MODEL =
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_AI_PARSER_MODEL || (import.meta as any).env?.VITE_GAPGPT_PARSER_MODEL)) ||
  'gapgpt-gemma-26b-a4b';

export const GAPGPT_PARSER_MODEL = AI_PARSER_MODEL;

export const FALLBACK_CHAT_MODELS: string[] = [
  GAPGPT_CHAT_MODEL,
  'gapgpt-gemma-26b-a4b',
  'gapgpt-qwen-3.5',
  'deepseek-chat',
];

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
  const clean = catStr.trim().toLowerCase();
  const allValid = [...VALID_EXPENSE_CATEGORIES, ...VALID_INCOME_CATEGORIES];
  const exact = allValid.find((v) => v.toLowerCase() === clean || clean.includes(v.toLowerCase()) || v.toLowerCase().includes(clean));
  if (exact) return exact;

  if (type === 'income') {
    if (clean.includes('حقوق') || clean.includes('دستمزد') || clean.includes('salary') || clean.includes('wage')) return 'حقوق و دستمزد';
    if (clean.includes('سود') || clean.includes('سرمایه') || clean.includes('invest') || clean.includes('profit')) return 'سرمایه‌گذاری و سود';
    if (clean.includes('هدیه') || clean.includes('جایزه') || clean.includes('عیدی') || clean.includes('gift') || clean.includes('bonus')) return 'هدیه و پاداش';
    if (clean.includes('فروش') || clean.includes('کسب') || clean.includes('sale') || clean.includes('business')) return 'فروش و کسب‌وکار';
    return 'سایر دریافتی‌ها';
  } else {
    if (clean.includes('خوراک') || clean.includes('غذا') || clean.includes('رستوران') || clean.includes('میوه') || clean.includes('قهوه') || clean.includes('کافه') || clean.includes('food') || clean.includes('coffee') || clean.includes('restaurant')) return 'خوراک و رستوران';
    if (clean.includes('مسکن') || clean.includes('اجاره') || clean.includes('خانه') || clean.includes('rent') || clean.includes('housing')) return 'مسکن و اجاره';
    if (clean.includes('حمل') || clean.includes('ماشین') || clean.includes('بنزین') || clean.includes('اسنپ') || clean.includes('تپسی') || clean.includes('transport') || clean.includes('taxi') || clean.includes('snapp')) return 'حمل‌ونقل و خودرو';
    if (clean.includes('پوشاک') || clean.includes('لباس') || clean.includes('خرید') || clean.includes('shopping') || clean.includes('cloth')) return 'خرید و پوشاک';
    if (clean.includes('تفریح') || clean.includes('سرگرمی') || clean.includes('سینما') || clean.includes('entertainment') || clean.includes('game')) return 'سرگرمی و تفریح';
    if (clean.includes('سلامت') || clean.includes('درمان') || clean.includes('دارو') || clean.includes('دکتر') || clean.includes('health') || clean.includes('medical')) return 'سلامت و درمان';
    if (clean.includes('قبض') || clean.includes('شارژ') || clean.includes('برق') || clean.includes('آب') || clean.includes('bill') || clean.includes('utility')) return 'قبوض و شارژ';
    if (clean.includes('آموزش') || clean.includes('کتاب') || clean.includes('درس') || clean.includes('education') || clean.includes('book')) return 'آموزش و کتاب';
    return 'سایر و متفرقه';
  }
}

/**
 * موتور پردازش هوش مصنوعی چندبوم (Chandboom AI Engine)
 * خروجی ساختاریافته JSON جهت ثبت تراکنش و مشاوره مالی
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
  const baseUrl = getGapGptBaseUrl();

  // Strict check: No local mock fallbacks allowed
  if (!apiKey) {
    throw new Error('خطا در برقراری ارتباط با هوش مصنوعی چندبوم: کلید دسترسی سامانه هوش مصنوعی در متغیرهای محیطی سامانه (VITE_GAPGPT_API_KEY / VITE_AI_API_KEY) تنظیم نشده است.');
  }

  if (!baseUrl) {
    throw new Error('خطا در برقراری ارتباط با هوش مصنوعی چندبوم: آدرس سرویس هوش مصنوعی پیکربندی نشده است.');
  }

  const currentShamsi = getCurrentShamsiDate();

  const systemInstruction = `شما موتور تحلیل هوشمند تراکنش‌های مالی و مشاور مدیریت مالی سامانه «چندبوم» (Chandboom) هستید که منحصراً به عنوان «هوش مصنوعی چندبوم» (Chandboom AI) فعالیت می‌کنید.
وظیفه شما تحلیل دقیق پیام متنی یا صوتی کاربر (تبدیل‌شده به متن) است. این پیام ممکن است شامل ۱ تراکنش یا چندین تراکنش مالی همزمان باشد.

دسته‌بندی‌های استاندارد سامانه چندبوم:
- هزینه‌ها (expense): 'خوراک و رستوران' | 'مسکن و اجاره' | 'حمل‌ونقل و خودرو' | 'خرید و پوشاک' | 'سرگرمی و تفریح' | 'سلامت و درمان' | 'قبوض و شارژ' | 'آموزش و کتاب' | 'سایر و متفرقه'
- درآمدها (income): 'حقوق و دستمزد' | 'سرمایه‌گذاری و سود' | 'هدیه و پاداش' | 'فروش و کسب‌وکار' | 'سایر دریافتی‌ها'

تاریخ امروز سامانه: ${currentShamsi}

دستورالعمل خروجی:
پاسخ شما باید منحصراً و بدون هیچ متن مقدمه یا موخره، یک ساختار JSON معتبر باشد:

حالت ۱) اگر کاربر قصد ثبت یا گزارش تراکنش مالی (درآمد یا هزینه) دارد:
الف) اگر اطلاعات برای ثبت تراکنش ناقص یا مبهم است (مثلاً مبلغ مشخص نشده، یا مشخص نیست درآمد است یا هزینه، یا عنوان تراکنش مبهم است):
   هرگز اطلاعات فیک یا حدسی پر نکنید. خروجی باید این ساختار باشد:
   {
     "is_transaction": false,
     "is_ambiguous": true,
     "clarification_message": "یک جمله کوتاه، مؤدبانه و صمیمی به زبان فارسی که مشخص می‌کند کدام بخش مبهم است و درخواست شفاف‌سازی می‌کند (مثال: «مبلغ دقیق یا نوع تراکنش را مشخص نکردید، لطفاً بفرمایید درآمد است یا هزینه؟» یا «مبلغ دقیق خرید ساندویچ را به تومان مشخص بفرمایید»)"
   }

ب) اگر اطلاعات تراکنش کامل است:
- چه تنها ۱ تراکنش و چه چندین تراکنش همزمان در پیام وجود داشته باشد (مثال: «واریز حقوق ۲۵ میلیون، خرید قهوه ۵۰ هزار تومن و کرایه اسنپ ۱۲۰ تومن»)، همه آن‌ها را در آرایه transactions قرار دهید:
   {
     "is_transaction": true,
     "is_ambiguous": false,
     "transactions": [
       {
         "type": "income" یا "expense",
         "title": "عنوان کوتاه و تمیز تراکنش بدون کلمات اضافه مثل خرید، واریز، مبلغ یا تومان (مثال: حقوق، قهوه، اسنپ)",
         "amount": عدد صحیح دقیق به تومان (مثلاً ۲۵ میلیون = 25000000، ۵۰ هزار = 50000، اگر ریال بود بر ۱۰ تقسیم شود),
         "category": "یکی از دسته‌بندی‌های استاندارد ذکر شده در بالا متناسب با موضوع",
         "date": "تاریخ استخراج‌شده از متن یا تاریخ ${currentShamsi}"
       }
     ]
   }

حالت ۲) اگر پیام کاربر گفتگوی عمومی، احوالپرسی یا سوال و تحلیل مالی است و قصد ثبت تراکنش ندارد:
{
  "is_transaction": false,
  "is_ambiguous": false,
  "conversational_reply": "پاسخ دوستانه، تحلیلی و تخصصی به عنوان «دستیار هوشمند چندبوم»"
}`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemInstruction },
  ];

  if (userContext?.chatHistory && userContext.chatHistory.length > 0) {
    const recent = userContext.chatHistory.slice(-6);
    for (const item of recent) {
      messages.push({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.text,
      });
    }
  }

  let finalPrompt = trimmed;
  if (userContext?.metrics) {
    finalPrompt += `\n[اطلاعات مالی کاربر: موجودی فعلی: ${userContext.metrics.balance} تومان، درآمد ماه: ${userContext.metrics.totalIncome} تومان، هزینه ماه: ${userContext.metrics.totalExpense} تومان]`;
  }

  messages.push({ role: 'user', content: finalPrompt });

  const chatEndpoint = getAiChatEndpoint(baseUrl);
  const candidateModels = Array.from(new Set([
    GAPGPT_CHAT_MODEL,
    'gapgpt-gemma-26b-a4b',
    'gapgpt-qwen-3.5',
    'deepseek-chat',
  ])).filter(Boolean);

  let lastError: Error | null = null;
  let data: any = null;

  for (const modelToTry of candidateModels) {
    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToTry,
          messages,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errJson = await response.json();
          errorDetail = errJson?.error?.message || JSON.stringify(errJson);
        } catch {
          const rawText = await response.text().catch(() => '');
          if (rawText.includes('<html') || rawText.includes('<!DOCTYPE')) {
            errorDetail = 'مسیر دسترسی سرویس یا مدل انتخابی در دسترس نمی‌باشد.';
          } else {
            errorDetail = rawText.slice(0, 150);
          }
        }

        const formattedErr = new Error(
          `خطا در برقراری ارتباط با هوش مصنوعی چندبوم (کد وضعیت ${response.status}): ${errorDetail || 'پاسخ ناموفق'}`
        );

        if (response.status === 404 || response.status >= 500) {
          lastError = formattedErr;
          continue;
        }

        throw formattedErr;
      }

      data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        break;
      }
    } catch (fetchErr: any) {
      if (
        fetchErr?.message?.includes('کد وضعیت 404') ||
        fetchErr?.message?.includes('کد وضعیت 5')
      ) {
        lastError = fetchErr;
        continue;
      }
      throw new Error(
        `خطا در برقراری ارتباط با هوش مصنوعی چندبوم: ارتباط با سرور برقرار نشد (${fetchErr?.message || 'خطای شبکه'}).`
      );
    }
  }

  if (!data) {
    if (lastError) {
      throw lastError;
    }
    throw new Error('خطا در برقراری ارتباط با هوش مصنوعی چندبوم: پاسخی از سرور دریافت نشد.');
  }



  const rawContent = data.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error('خطا در برقراری ارتباط با هوش مصنوعی چندبوم: پاسخ دریافتی از سرور خالی است.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        return {
          is_transaction: false,
          is_ambiguous: false,
          conversational_reply: rawContent,
          raw_input: trimmed,
        };
      }
    } else {
      return {
        is_transaction: false,
        is_ambiguous: false,
        conversational_reply: rawContent,
        raw_input: trimmed,
      };
    }
  }

  // Handle Ambiguity Response
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

  // Handle Structured Transaction(s) Response (Single or Batch Multi-Transactions)
  let rawList: any[] = [];
  if (Array.isArray(parsed?.transactions)) {
    rawList = parsed.transactions;
  } else if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed?.transaction) {
    if (Array.isArray(parsed.transaction)) {
      rawList = parsed.transaction;
    } else if (typeof parsed.transaction === 'object') {
      rawList = [parsed.transaction];
    }
  } else if (parsed?.amount !== undefined) {
    rawList = [parsed];
  }

  const validTransactions: AiStructuredTransaction[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== 'object') continue;
    const numAmount = Number(raw.amount) || 0;
    if (numAmount <= 0) continue;

    const txType: TransactionType = String(raw.type || '').toLowerCase().includes('income') ? 'income' : 'expense';
    let title = String(raw.title || raw.description || trimmed).trim();
    // Clean up excessive prefix words if left in title
    title = title.replace(/^(?:ثبت\s*کن|بنویس|واریز\s*شد|واریز|خرید\s*شد|خرید|کرایه|پرداخت|هزینه|بابت)\s+/i, '').trim() || title;

    validTransactions.push({
      type: txType,
      title: title || (txType === 'income' ? 'درآمد' : 'هزینه'),
      amount: Math.round(numAmount),
      category: normalizeCategory(raw.category, txType),
      date: String(raw.date && raw.date !== 'unknown' ? raw.date : currentShamsi),
    });
  }

  if (validTransactions.length > 0) {
    return {
      is_transaction: true,
      is_ambiguous: false,
      transaction: validTransactions[0],
      transactions: validTransactions,
      raw_input: trimmed,
    };
  }

  // Handle Conversational Reply
  if (parsed.conversational_reply) {
    return {
      is_transaction: false,
      is_ambiguous: false,
      conversational_reply: parsed.conversational_reply,
      raw_input: trimmed,
    };
  }

  return {
    is_transaction: false,
    is_ambiguous: false,
    conversational_reply: rawContent,
    raw_input: trimmed,
  };
}

/**
 * استخراج و تحلیل ساختاریافته تراکنش‌ها و پیامک‌های بانکی با هوش مصنوعی چندبوم
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

  if (result.is_ambiguous && result.clarification_message) {
    throw new Error(result.clarification_message);
  }

  throw new Error('متن وارد شده شامل اطلاعات تراکنش مالی معتبر نمی‌باشد.');
}

/**
 * استخراج گروهی چند تراکنش مالی از متن با هوش مصنوعی چندبوم
 */
export async function parseTransactionsBatch(input: string): Promise<AiStructuredTransaction[]> {
  const result = await processFinancialAI(input);

  if (result.is_transaction && result.transactions && result.transactions.length > 0) {
    return result.transactions;
  }

  if (result.is_transaction && result.transaction) {
    return [result.transaction];
  }

  if (result.is_ambiguous && result.clarification_message) {
    throw new Error(result.clarification_message);
  }

  throw new Error('متن وارد شده شامل اطلاعات تراکنش مالی معتبر نمی‌باشد.');
}

/**
 * دریافت مشاوره و گفتگوی مالی هوشمند با هوش مصنوعی چندبوم
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
  if (result.is_transaction && result.transactions && result.transactions.length > 1) {
    return `تعداد ${result.transactions.length.toLocaleString('fa-IR')} تراکنش همزمان شناسایی شد: ` +
      result.transactions.map((t) => `«${t.title}» (${t.amount.toLocaleString('fa-IR')} تومان)`).join('، ');
  }
  if (result.is_transaction && result.transaction) {
    const tx = result.transaction;
    return `تراکنش «${tx.title}» به مبلغ ${tx.amount.toLocaleString('fa-IR')} تومان در دسته‌بندی «${tx.category}» شناسایی شد.`;
  }
  if (result.conversational_reply) {
    return result.conversational_reply;
  }
  throw new Error('خطا در برقراری ارتباط با هوش مصنوعی چندبوم: پاسخی از هوش مصنوعی دریافت نشد.');
}

/**
 * Standard Unified Export Object
 */
export const aiService = {
  processFinancialAI,
  parseTransaction: parseTransactionWithSystemOne,
  parseTransactionsBatch,
  getAdvice: getConversationalAdvice,
  isConfigured: isAiConfigured,
};

export default aiService;
