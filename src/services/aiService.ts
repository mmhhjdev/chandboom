/**
 * چندبوم (Chandboon) - AI Integration Service
 * Dual-Model AI Architecture:
 * - Model A: Structured Transaction Parser (typesafe/jev-1.13) via /systemone endpoint
 * - Model B: Conversational & Financial Advisor (gapgpt-gemma-26b-a4b) via /chat/completions endpoint
 *
 * STRICT WHITE-LABELING & PRIVACY RULES:
 * - Never expose internal vendor/model names (DeepSeek, Jev, Gemma, Supabase) on user-facing UI.
 * - Always use brand-safe generic titles: «دستیار هوشمند چندبوم» or «پردازشگر هوشمند تراکنش».
 */

import { parsePersianSmartNLU, isGreetingOrSmallTalk, generateGreetingResponse, generateFinancialAdvice } from '../utils/aiParser';
import { sanitizeAIPrompt } from '../utils/security';
import { TransactionType, TransactionCategory } from '../types';

const DEFAULT_BASE_URL = 'https://api.gapgpt.app/v1';

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

/**
 * Retrieves GapGPT Base URL from environment or defaults to https://api.gapgpt.app/v1
 */
export function getAiBaseUrl(): string {
  const url =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAPGPT_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_GAPGPT_BASE_URL) ||
    DEFAULT_BASE_URL;
  return url.replace(/\/+$/, '');
}

/**
 * Retrieves GapGPT API Key from environment variables
 */
export function getAiApiKey(): string {
  const key =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAPGPT_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEEPSEEK_API_KEY) ||
    (typeof process !== 'undefined' && (process.env?.GAPGPT_API_KEY || process.env?.VITE_GAPGPT_API_KEY)) ||
    '';
  return key ? key.trim() : '';
}

export function isAiConfigured(): boolean {
  return Boolean(getAiApiKey());
}

/**
 * Model A: Structured Transaction Parser (typesafe/jev-1.13)
 * Endpoint: https://api.gapgpt.app/v1/systemone
 * Payload Structure: Uses `state` (raw text/SMS input) and `questions` (deterministic extraction)
 * Usage: Exclusively used when processing pasted bank SMS or raw expense strings into structured draft fields.
 */
export async function parseTransactionWithSystemOne(input: string): Promise<AiParsedTransaction> {
  const { safePrompt } = sanitizeAIPrompt(input);
  const apiKey = getAiApiKey();
  const baseUrl = getAiBaseUrl();

  if (apiKey) {
    try {
      // Jev Schema: state + questions array for deterministic attribute extraction
      const payload = {
        model: 'typesafe/jev-1.13',
        state: safePrompt,
        questions: [
          {
            id: 'amount',
            question: 'مبلغ تراکنش به عدد صحیح تومان چقدر است؟ (مبالغ ریال را بر ۱۰ تقسیم کن، ۲۵۰۰ هزار تومان معادل ۲۵۰۰۰۰۰ است، ۵۰ میلیون تومان معادل ۵۰۰۰۰۰۰۰ است)',
            type: 'number',
          },
          {
            id: 'type',
            question: 'نوع تراکنش چیست؟ آیا expense (هزینه، خرید، برداشت، پرداخت) است یا income (درآمد، واریز، حقوق، پاداش)؟',
            type: 'string',
          },
          {
            id: 'clean_title',
            question: 'عنوان یا نام کالا، خدمات یا منبع درآمد بدون کلمات اضافه مثل خرید، واریز، مبلغ یا تومان چیست؟ (مثال: ساندویچ، حقوق، اسنپ)',
            type: 'string',
          },
          {
            id: 'bank',
            question: 'نام بانک یا کارت بانکی در صورت وجود در متن چیست؟ (مثلاً سامان، ملت، بلو، ملی)',
            type: 'string',
          },
        ],
      };

      const response = await fetch(`${baseUrl}/systemone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        let extractedAmount = 0;
        let extractedType: TransactionType = 'expense';
        let extractedTitle = '';
        let extractedBank: string | null = null;

        if (data.answers && typeof data.answers === 'object') {
          if (Array.isArray(data.answers)) {
            for (const item of data.answers) {
              if (item.id === 'amount') extractedAmount = Number(item.answer) || 0;
              if (item.id === 'type') extractedType = String(item.answer).toLowerCase().includes('income') ? 'income' : 'expense';
              if (item.id === 'clean_title') extractedTitle = String(item.answer || '');
              if (item.id === 'bank') extractedBank = String(item.answer || '');
            }
          } else {
            extractedAmount = Number(data.answers.amount) || 0;
            extractedType = String(data.answers.type || '').toLowerCase().includes('income') ? 'income' : 'expense';
            extractedTitle = String(data.answers.clean_title || data.answers.title || '');
            extractedBank = data.answers.bank ? String(data.answers.bank) : null;
          }
        } else if (data.data && typeof data.data === 'object') {
          extractedAmount = Number(data.data.amount) || 0;
          extractedType = String(data.data.type || '').toLowerCase().includes('income') ? 'income' : 'expense';
          extractedTitle = String(data.data.clean_title || data.data.title || '');
          extractedBank = data.data.bank ? String(data.data.bank) : null;
        }

        if (extractedAmount > 0) {
          return {
            clean_title: extractedTitle || safePrompt,
            amount: Math.round(extractedAmount),
            type: extractedType,
            bank: extractedBank || null,
            date: new Date().toISOString(),
            category: null, // Interactive User Confirmation: category must not be hard-guessed
            confidence: 0.99,
            raw_input: safePrompt,
          };
        }
      }
    } catch (networkError) {
      console.warn('پردازشگر هوشمند تراکنش: خطای شبکه در مدل استخراج، استفاده از موتور پردازش داخلی.');
    }
  }

  // Robust Smart NLU Local Fallback Engine (Applies exact mathematical and Persian NLU rules)
  const localResult = parsePersianSmartNLU(safePrompt);
  return {
    clean_title: localResult.cleanTitle,
    amount: localResult.amount,
    type: localResult.type,
    bank: localResult.bank || null,
    date: new Date().toISOString(),
    category: null, // Must prompt user to choose manually
    confidence: localResult.amount > 0 ? 0.95 : 0.4,
    raw_input: safePrompt,
  };
}

/**
 * Model B: Conversational & Financial Advisor (gapgpt-gemma-26b-a4b)
 * Endpoint: https://api.gapgpt.app/v1/chat/completions
 * Payload Structure: Standard chat array format ({ messages: [{ role: "user", content: "..." }] })
 * Usage: Used for general chat, friendly greetings, budget analysis, and impulse buy guidance.
 */
export async function getConversationalAdvice(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string }
): Promise<string> {
  const { safePrompt } = sanitizeAIPrompt(userQuery);

  // 1. Friendly Greeting & Small Talk Handler (Prevents cold rejections or rigid error alerts)
  if (isGreetingOrSmallTalk(safePrompt)) {
    return generateGreetingResponse(safePrompt, demographics?.fullName);
  }

  const apiKey = getAiApiKey();
  const baseUrl = getAiBaseUrl();

  if (apiKey) {
    const hourlyWage = Math.round(Math.max((metrics.totalIncome || monthlyCap || 20000000) / 160, 100000));
    const demographicInfo = demographics
      ? `\nکاربر: ${demographics.fullName || 'کاربر'} | سن: ${
          demographics.age ? demographics.age + ' سال' : 'مشخص‌نشده'
        } | جنسیت: ${demographics.gender || 'مشخص‌نشده'}`
      : '';

    const systemPrompt = `شما مشاور صمیمی، دلسوز و تحلیل‌گر ارشد سامانه مدیریت مالی «چندبوم» (chandboon.ir) هستید.
رویکرد و لحن:
۱. بسیار دوستانه، مودبانه و گرم سخن بگویید. هرگز پاسخ‌های خشک یا خطای سفت‌وسخت ندهید.
۲. اگر کاربر احوالپرسی یا تشکر کرد، گرم پاسخ دهید و پیشنهادهای مفید مالی ارائه دهید.
۳. سپر ضد خرید تکانه‌ای (Impulse Buy Shield): اگر کاربر درباره قصد خرید کالای غیرضروری، گجت، گوشی، لباس یا لپ‌تاپ پرسید، به شکلی محترمانه و حسابگرانه ارزش زمانی آن خرید را (بر اساس درآمد ساعتی کاربر: هر ساعت معادل ${hourlyWage.toLocaleString('fa-IR')} تومان) متذکر شوید و پیشنهاد قانون تأمل ۲۴ تا ۴۸ ساعته بدهید.
۴. پاسخ‌ها را ساختاریافته، موجز و در ۳ تا ۴ بند فارسی بنویسید.`;

    const userContext = `اطلاعات مالی کاربر:${demographicInfo}
- مجموع درآمد ماهانه: ${metrics.totalIncome.toLocaleString('fa-IR')} تومان
- مجموع هزینه‌های ثبت‌شده: ${metrics.totalExpense.toLocaleString('fa-IR')} تومان
- تراز موجودی حساب: ${metrics.balance.toLocaleString('fa-IR')} تومان
- سقف بودجه مصوب: ${monthlyCap.toLocaleString('fa-IR')} تومان
- ارزش تقریبی هر ساعت کار کاربر: ${hourlyWage.toLocaleString('fa-IR')} تومان

پیام یا سوال کاربر: ${safePrompt}`;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gapgpt-gemma-26b-a4b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext },
          ],
          temperature: 0.5,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply.trim();
      }
    } catch (err) {
      console.warn('دستیار هوشمند چندبوم: خطای شبکه در مدل گفت‌وگو، استفاده از تحلیلگر داخلی.');
    }
  }

  // Friendly Offline Rule-Based Advisor Fallback
  return generateFinancialAdvice(safePrompt, metrics, monthlyCap).text;
}

/**
 * Standard Unified Export Object for Clean Service Layer
 */
export const aiService = {
  parseTransaction: parseTransactionWithSystemOne,
  getAdvice: getConversationalAdvice,
  isConfigured: isAiConfigured,
};

export default aiService;
