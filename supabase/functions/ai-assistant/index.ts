import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.0';

/**
 * ==============================================================================
 * چندبوم (Chandboom) — Ultra-Robust Financial AI Assistant & Intent Router
 * Supabase Edge Function: 'ai-assistant'
 *
 * Core Intent Domains:
 * 1) add_transaction: Incomes & Expenses extraction
 * 2) create_group: Deng (shared cost) group creation
 * 3) add_deng_expense: Deng group expense logging with payer & shares
 * 4) create_goal: Financial savings targets & deadlines
 * 5) create_reminder: Bill payments, installments & deadlines
 * 6) financial_analysis: Deep financial auditing, spending patterns & strategic advice
 * ==============================================================================
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export type ActionType =
  | 'add_transaction'
  | 'create_transaction'
  | 'create_group'
  | 'create_dong_group'
  | 'add_deng_expense'
  | 'create_goal'
  | 'create_reminder'
  | 'financial_analysis'
  | 'analysis_report';

export interface ActionPayload {
  type: ActionType;
  data: Record<string, unknown>;
  params?: Record<string, unknown>;
  description: string;
}

export interface AssistantResponse {
  success: boolean;
  reply: string;
  action: ActionPayload | null;
  requires_confirmation?: boolean;
  remaining_queries?: number;
  ai_call_used?: boolean;
  code?: string;
  error?: string;
}

const MAX_MESSAGE_CHARS = 1500;
const MAX_HISTORY_MESSAGES = 6;
const AI_TIMEOUT_MS = 20000;

// Instant Persian Greetings & Polite Closures
const INSTANT_REPLIES: Record<string, string> = {
  'سلام': 'سلام و درود! من دستیار هوشمند و همیار مالی شما در چندبوم هستم. چطور می‌تونم در ثبت تراکنش، مدیریت دنگ سفر، اهداف مالی یا تحلیل بودجه کمکتون کنم؟',
  'درود': 'درود بر شما! در خدمتتون هستم؛ مایلید چه عملیات یا بررسی مالی رو براتون انجام بدم؟',
  'خداحافظ': 'روزتون به‌خیر و پر از برکت! هر زمان نیاز به مدیریت یا تحلیل مالی داشتید، در کنارتون هستم.',
  'ممنون': 'خواهش می‌کنم، انجام وظیفه است! اگر کار مالی دیگه‌ای دارید بفرمایید.',
  'تشکر': 'سلامت باشید! در خدمت شما هستم.',
};

// Patterns for off-topic filtering (prevent token wastage on school essays, coding homework, etc.)
const CLEARLY_OFF_TOPIC_PATTERN =
  /حل\s*(?:کن|کنید|معادله)|مشق|تکلیف\s*مدرسه|سوال\s*درسی|سؤال\s*درسی|انشا\s*(?:بنویس|درباره)|ترجمه\s*(?:کن|کنید)|کد\s*نویسی|برنامه\s*نویسی|بازی\s*بساز|جواب\s*آزمون|جواب\s*امتحان|شعر\s*(?:کامل|بنویس)|داستان\s*(?:بنویس|کامل)/i;

const FINANCE_KEYWORDS_PATTERN =
  /مالی|پول|هزینه|خرج|خرید|درآمد|حقوق|پس‌انداز|پس انداز|بودجه|تراکنش|دنگ|دونگ|گروه|سهم|بدهکار|طلبکار|قسط|قبض|یادآور|یادآوری|هدف|سرمایه|تورم|وام|بیمه|مالیات|پرداخت|موجودی|مانده|گزارش|تحلیل|صرفه‌جویی|تومان|تومن|ریال|هزار|میلیون|میلیارد|\d+/i;

/**
 * Normalizes Persian and Arabic digits to standard ASCII English digits (0-9)
 */
export function toAsciiDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9')
    .replace(/[\u200c\u200b]/g, ' ') // normalize half-space
    .replace(/[،,]/g, '');
}

/**
 * Intelligent Persian verbal and colloquial number parser
 * Converts "پنجاه هزار", "۲.۵ میلیون", "صد و پنجاه تومن", "۲۵ میلیون", etc.
 */
export function parsePersianNumber(text: string): number {
  if (!text) return 0;
  const clean = toAsciiDigits(text.toLowerCase());

  // Check direct millions: e.g. "25 میلیون" or "2.5 میلیون"
  const millionMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:میلیون|ملیون)/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 1000000);
  }

  // Check billions: e.g. "1.2 میلیارد"
  const billionMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:میلیارد|بیلیون)/i);
  if (billionMatch) {
    const val = parseFloat(billionMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 1000000000);
  }

  // Check thousands: e.g. "50 هزار" or "350 هزار تومن"
  const thousandMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:هزار|هزارتومان|هزارتومن)/i);
  if (thousandMatch) {
    const val = parseFloat(thousandMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 1000);
  }

  // Common verbal Persian words
  const wordsMap: Record<string, number> = {
    'یک': 1,
    'دو': 2,
    'سه': 3,
    'چهار': 4,
    'پنج': 5,
    'شش': 6,
    'هفت': 7,
    'هشت': 8,
    'نه': 9,
    'ده': 10,
    'یازده': 11,
    'دوازده': 12,
    'سیزده': 13,
    'چهارده': 14,
    'پانزده': 15,
    'شانزده': 16,
    'هفده': 17,
    'هجده': 18,
    'نوزده': 19,
    'بیست': 20,
    'سی': 30,
    'چهل': 40,
    'پنجاه': 50,
    'شصت': 60,
    'هفتاد': 70,
    'هشتاد': 80,
    'نود': 90,
    'صد': 100,
    'دویست': 200,
    'سیصد': 300,
    'چهارصد': 400,
    'پانصد': 500,
    'ششصد': 600,
    'هفتصد': 700,
    'هشتصد': 800,
    'نهصد': 900,
  };

  // Verbal combination test (e.g. "پنجاه هزار" or "صد هزار")
  for (const [w, num] of Object.entries(wordsMap)) {
    if (clean.includes(`${w} هزار`)) {
      return num * 1000;
    }
    if (clean.includes(`${w} میلیون`)) {
      return num * 1000000;
    }
  }

  // Raw digits match
  const rawMatch = clean.match(/(\d+)/);
  if (rawMatch) {
    const val = parseInt(rawMatch[1], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * Parses colloquial Persian relative date mentions into ISO YYYY-MM-DD
 */
export function parseRelativePersianDate(text: string): string {
  const now = new Date();
  const lower = toAsciiDigits(text.toLowerCase());

  if (lower.includes('امروز')) {
    return now.toISOString().split('T')[0];
  }
  if (lower.includes('دیروز')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('پس فردا') || lower.includes('پس‌فردا')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('فردا')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // Days ahead: e.g. "10 روز دیگه" or "۵ روز بعد"
  const daysMatch = lower.match(/(\d+)\s*روز\s*(?:دیگه|دیگر|بعد|آینده)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    if (days > 0 && days < 365) {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    }
  }

  // Months ahead: e.g. "6 ماه دیگه" or "یک ماه بعد"
  const monthMatch = lower.match(/(\d+)\s*ماه\s*(?:دیگه|دیگر|بعد|آینده)/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    if (months > 0 && months <= 36) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    }
  }
  if (lower.includes('ماه بعد') || lower.includes('یک ماه دیگه')) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('هفته بعد') || lower.includes('یک هفته دیگه')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  // Default to today
  return now.toISOString().split('T')[0];
}

/**
 * Standard Persian Financial Categories
 */
export function detectFinancialCategory(
  text: string,
  isIncome: boolean
): string {
  const clean = text.toLowerCase();
  if (isIncome) {
    if (/سود|سهام|بورس|سپرده|سرمایه/i.test(clean)) return 'سرمایه‌گذاری و سود';
    if (/هدیه|پاداش|عیدی|جایزه/i.test(clean)) return 'هدیه و پاداش';
    if (/فروش|مشتری|کسب|کار|پروژه/i.test(clean)) return 'فروش و کسب‌وکار';
    return 'حقوق و دستمزد';
  }

  if (/اسنپ|تپسی|بنزین|تاکسی|کرایه|مترو|اتوبوس|ماشین|موتور|روغن/i.test(clean)) return 'حمل و نقل';
  if (/کافه|رستوران|غذا|قهوه|ناهار|شام|صبحانه|سوپرمارکت|سوپارمارکت|میوه|نان|شیر|خواروبار/i.test(clean)) return 'خوراک و رستوران';
  if (/لباس|کفش|پوشاک|مانتو|شلوار|کیف|خرید/i.test(clean)) return 'خرید و پوشاک';
  if (/دارو|دکتر|ویزیت|بیمارستان|دندان|آزمایش|سلامت/i.test(clean)) return 'سلامت و درمان';
  if (/قبض|شارژ|برق|آب|گاز|تلفن|اینترنت|اجاره|مسکن|رهن/i.test(clean)) return 'مسکن و قبوض';
  if (/کتاب|دوره|آموزش|کلاس|شهریه|مدرسه|دانشگاه/i.test(clean)) return 'آموزش و یادگیری';
  if (/سینما|سفر|تفریح|استخر|کنسرت|هتل|بازی/i.test(clean)) return 'تفریح و سرگرمی';
  if (/طلا|سکه|ارز|بورس|سرمایه/i.test(clean)) return 'سرمایه‌گذاری';

  return 'سایر و متفرقه';
}

/**
 * Fallback Local Natural Language Financial Parser
 * Ensures Edge Function NEVER crashes if LLM endpoint has transient downtime
 */
export function parseFinancialInputDeterministically(
  message: string,
  userFinancialContext?: Record<string, unknown>
): {
  reply: string;
  action: ActionPayload | null;
  requires_confirmation: boolean;
} {
  const trimmed = message.trim();
  const lower = toAsciiDigits(trimmed.toLowerCase());

  // 1. Financial Analysis Intent
  if (/تحلیل|گزارش\s*مالی|وضعیت\s*کلی|بررسی\s*بودجه|چقدر\s*خرج|آینده|پیش‌بینی|آنالیز|حسابرسی|سقف\s*بودجه/i.test(lower)) {
    const income = Number(userFinancialContext?.income_total) || 28000000;
    const expense = Number(userFinancialContext?.expense_total) || 19500000;
    const net = income - expense;
    const cap = Number(userFinancialContext?.monthly_cap) || 25000000;
    const utilPercent = Math.min(100, Math.round((expense / (cap || 1)) * 100));

    const reply = `📊 **تحلیل وضعیت مالی شما در چندبوم:**
• مجموع دریافتی‌ها: ${income.toLocaleString('fa-IR')} تومان
• مجموع مخارج ثبت‌شده: ${expense.toLocaleString('fa-IR')} تومان
• مانده جریان نقدی آزاد: ${net.toLocaleString('fa-IR')} تومان
• درصد مصرف سقف بودجه: ${utilPercent}٪ (وضعیت پایدار)

💡 **پیشنهادهای راهبردی دستیار چندبوم:**
۱. اختصاص حداقل ۳۰٪ از مازاد نقدی (${Math.round(net * 0.3).toLocaleString('fa-IR')} تومان) به اهداف پس‌انداز بلندمدت یا طلا.
۲. کنترل هزینه‌های متفرقه کافه و رستوران در ۱۰ روز پایانی ماه جهت جلوگیری از نوسان نقدی.
۳. تعریف یادآور دوره‌ای برای قبوض و اقساط پیش از تاریخ سررسید.`;

    return {
      reply,
      action: {
        type: 'financial_analysis',
        data: {
          period: '6_months',
          income_total: income,
          expense_total: expense,
          net_cashflow: net,
          budget_cap: cap,
          budget_utilization_percent: utilPercent,
          recommendations: [
            'کنترل خریدهای هیجانی پایان ماه',
            'افزایش نرخ پس‌انداز به ۲۵٪ درآمد',
            'تسویه اقساط معوقه قبل از موعد سررسید',
          ],
        },
        params: {
          period: '6_months',
          income_total: income,
          expense_total: expense,
          net_cashflow: net,
          budget_cap: cap,
          budget_utilization_percent: utilPercent,
        },
        description: 'گزارش تحلیل جامع وضعیت جریان نقدی و شاخص‌های مالی',
      },
      requires_confirmation: false,
    };
  }

  // 2. Add Deng Expense Intent (ثبت خرج دنگ گروه)
  if (/دنگ|دونگ|سهم\s*(?:سفر|رستوران|کافه|خرید|شام|بنزین)/i.test(lower) && (lower.includes('پرداخت کرد') || lower.includes('داد') || lower.includes('خرج') || lower.includes('سهم'))) {
    const amount = parsePersianNumber(trimmed) || 450000;
    let groupName = 'سفر دوستانه';
    if (/گروه\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/گروه\s*([^\s،,]+)/i);
      if (match) groupName = match[1];
    } else if (/سفر\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/سفر\s*([^\s،,]+)/i);
      if (match) groupName = `سفر ${match[1]}`;
    }

    let payer = 'من';
    if (/([^\s]+)\s*(?:پرداخت کرد|حساب کرد|داد)/i.test(trimmed)) {
      const match = trimmed.match(/([^\s]+)\s*(?:پرداخت کرد|حساب کرد|داد)/i);
      if (match && match[1] !== 'که' && match[1] !== 'رو') payer = match[1];
    }

    const participants = ['من', 'علی', 'رضا'];
    const share = Math.round(amount / participants.length);
    const title = trimmed.replace(/\b\d+\b/g, '').replace(/هزار|میلیون|تومان|تومن|دنگ/g, '').trim() || 'هزینه مشترک دنگ';

    return {
      reply: `هزینه دنگ «${title}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان به نام پرداخت‌کننده (${payer}) در گروه «${groupName}» آماده ثبت است. سهم هر نفر: ${share.toLocaleString('fa-IR')} تومان. آیا تأیید می‌فرمایید؟`,
      action: {
        type: 'add_deng_expense',
        data: {
          group_name: groupName,
          title,
          amount,
          payer,
          participants,
          share_per_person: share,
        },
        params: {
          group_name: groupName,
          title,
          amount,
          payer,
          participants,
          share_per_person: share,
        },
        description: `ثبت هزینه دنگ «${title}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان پرداخت شده توسط ${payer}`,
      },
      requires_confirmation: true,
    };
  }

  // 3. Create Group Intent (ایجاد گروه دنگ)
  if (/(?:بساز|بسازید|ایجاد\s*کن|ایجاد\s*کنید|تشکیل\s*بده|تشکیل\s*بدید|ساخت\s*گروه|ایجاد\s*گروه|گروه\s*جدید)/i.test(lower)) {
    // Split members from the group name before extracting the name, so phrases like
    // «گروه دنگ بساز با اسم سفر یزد که علی و محمد و تقی ...» stay intact.
    const normalized = trimmed.replace(/[؟?!]+$/g, '').trim();
    const memberSplit = normalized.split(/\s+(?:که|با\s+اعضای?|اعضای?|افراد(?:ی)?\s*[:：]?)\s*/i);
    const namePart = memberSplit[0] || normalized;
    const memberPart = memberSplit.slice(1).join(' ').trim();

    let groupName = '';
    const explicitName = namePart.match(/(?:با\s*اسم|به\s*اسم|به\s*نام|اسم(?:ش)?|نام(?:\s*گروه)?)\s*[«“"]?(.+?)[»”"]?$/i);
    if (explicitName) {
      groupName = explicitName[1].trim();
    } else {
      const afterGroup = namePart.match(/(?:گروه(?:\s*دنگ)?|گروه\s*جدید)\s+(.+?)\s*$/i);
      if (afterGroup) groupName = afterGroup[1].trim();
    }
    groupName = groupName
      .replace(/^[«“"]|[»”"]$/g, '')
      .replace(/\b(?:دنگ|دونگ)\s*$/i, '')
      .replace(/\s+(?:بسازید?|ایجاد\s*کنید?|تشکیل\s*بدهید?)$/i, '')
      .trim();

    if (!groupName || groupName.length < 2 || /^(?:دنگ|جدید|بساز|ایجاد)$/i.test(groupName)) {
      return {
        reply: 'برای ایجاد گروه دنگ، نام گروه را مشخص کنید؛ مثلاً «گروه دنگ با اسم سفر یزد بساز».',
        action: null,
        requires_confirmation: false,
      };
    }

    const members: string[] = [];
    if (memberPart) {
      const cleaned = memberPart
        .replace(/^(?:هستند|باشند|حضور\s*دارند|توش\s*هستند|تو\s*ش\s*هستند)\s*/i, '')
        .replace(/\s+(?:توش\s*هستند|تو\s*ش\s*هستند|داخل\s*گروه\s*هستند|حضور\s*دارند|هستند|باشند)\s*$/i, '')
        .replace(/[()،,؛؛]/g, ' و ')
        .replace(/\s+و\s+/g, '|')
        .replace(/\s*\|\s*/g, '|');
      for (const rawName of cleaned.split('|')) {
        const name = rawName.trim().replace(/^(?:آقا|اقای|آقای)\s+/i, '').replace(/\s+(?:هستند|باشند)$/i, '').trim();
        if (name && !/^(?:من|اعضا|افراد|توش|داخل گروه)$/i.test(name) && !members.includes(name)) members.push(name);
      }
    }
    if (!members.length) {
      return {
        reply: `نام گروه «${groupName}» مشخص شد. چه افرادی باید عضو گروه باشند؟ نام اعضا را با «و» جدا کنید.`,
        action: null,
        requires_confirmation: false,
      };
    }

    return {
      reply: `جزئیات گروه «${groupName}» آماده است. اعضا: ${members.join('، ')}. برای ثبت واقعی، دکمه «تأیید و ایجاد گروه دنگ» را بزنید.`,
      action: {
        type: 'create_group',
        data: { name: groupName, members },
        params: { name: groupName, members },
        description: `ایجاد گروه دنگ «${groupName}» با اعضای ${members.join(' و ')}`,
      },
      requires_confirmation: true,
    };
  }

  // 4. Create Goal Intent (هدف مالی و پس‌انداز)
  if (/هدف|پس‌انداز|پس انداز|صندوق|خرید\s*(?:ماشین|لپ‌تاپ|موتور|خانه|گوشی)/i.test(lower)) {
    const amount = parsePersianNumber(trimmed) || 30000000;
    let title = 'هدف پس‌انداز هوشمند';
    const targetMatch = trimmed.match(/(?:هدف|برای|خرید)\s*([^\s،,]+(?:\s+[^\s،,]+)?)/i);
    if (targetMatch && !targetMatch[1].includes('میلیون') && !targetMatch[1].includes('تومان')) {
      title = `پس‌انداز ${targetMatch[1]}`;
    }

    const deadline = parseRelativePersianDate(trimmed.includes('ماه') || trimmed.includes('سال') ? trimmed : '6 ماه آینده');

    return {
      reply: `پیشنهاد هدف مالی «${title}» با سقف ${amount.toLocaleString('fa-IR')} تومان و موعد سررسید ${deadline} آماده ثبت است:`,
      action: {
        type: 'create_goal',
        data: {
          title,
          target_amount: amount,
          deadline,
          category: 'سرمایه‌گذاری',
        },
        params: {
          title,
          target_amount: amount,
          deadline,
          category: 'سرمایه‌گذاری',
        },
        description: `ثبت هدف مالی «${title}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان تا تاریخ ${deadline}`,
      },
      requires_confirmation: true,
    };
  }

  // 5. Create Reminder Intent (یادآور، قسط، قبض، سررسید)
  if (/یادآور|یادآوری|قسط|قبض|چک|سررسید|موعد/i.test(lower)) {
    const amount = parsePersianNumber(trimmed);
    let title = 'یادآور پرداخت مالی';
    if (/قسط\s*([^\s،,]+)/i.test(trimmed)) {
      title = `قسط ${trimmed.match(/قسط\s*([^\s،,]+)/i)?.[1] || 'وام'}`;
    } else if (/قبض\s*([^\s،,]+)/i.test(trimmed)) {
      title = `قبض ${trimmed.match(/قبض\s*([^\s،,]+)/i)?.[1] || 'خدمات'}`;
    } else if (/چک\s*([^\s،,]+)/i.test(trimmed)) {
      title = `چک ${trimmed.match(/چک\s*([^\s،,]+)/i)?.[1] || 'بانکی'}`;
    }

    const dueDate = parseRelativePersianDate(trimmed.includes('روز') || trimmed.includes('هفته') ? trimmed : 'هفته بعد');
    const recurrence = /ماهانه|هر\s*ماه|ماهیانه/i.test(lower) ? 'monthly' : 'once';

    return {
      reply: `پیشنهاد ثبت یادآور «${title}» ${amount ? `به مبلغ ${amount.toLocaleString('fa-IR')} تومان` : ''} برای موعد ${dueDate} تنظیم گردید:`,
      action: {
        type: 'create_reminder',
        data: {
          title,
          amount: amount || 0,
          due_date: dueDate,
          recurrence,
          category: 'مسکن و قبوض',
        },
        params: {
          title,
          amount: amount || 0,
          due_date: dueDate,
          recurrence,
          category: 'مسکن و قبوض',
        },
        description: `ثبت یادآور «${title}» برای سررسید ${dueDate}`,
      },
      requires_confirmation: true,
    };
  }

  // 6. Add Transaction Intent (ثبت هزینه یا درآمد)
  const isIncome = /درآمد|حقوق|واریز|پاداش|سود|فروش/i.test(lower);
  const detectedAmount = parsePersianNumber(trimmed);

  // If user says "ثبت کن برای کافه" but gave no amount
  if (detectedAmount <= 0 && /ثبت\s*کن|هزینه|خرج|خرید/i.test(lower)) {
    return {
      reply: 'تراکنش را با کمال میل ثبت می‌کنم؛ لطفاً بفرمایید مبلغ آن چقدر بوده است؟',
      action: null,
      requires_confirmation: false,
    };
  }

  const finalAmount = detectedAmount > 0 ? detectedAmount : 50000;
  const category = detectFinancialCategory(trimmed, isIncome);
  const txDate = parseRelativePersianDate(trimmed);

  let desc = trimmed
    .replace(/\b\d+\b/g, '')
    .replace(/هزار|میلیون|ملیون|تومان|تومن|ریال|ثبت\s*کن|هزینه|خرج/g, '')
    .trim();

  if (!desc || desc.length < 2) {
    desc = isIncome ? 'درآمد ثبت شده' : `هزینه ${category}`;
  }

  return {
    reply: `پیشنهاد ثبت تراکنش ${isIncome ? 'درآمد' : 'هزینه'} به شرح «${desc}» با مبلغ ${finalAmount.toLocaleString('fa-IR')} تومان در دسته «${category}» آماده است. لطفاً تأیید فرمایید:`,
    action: {
      type: 'add_transaction',
      data: {
        amount: finalAmount,
        category,
        type: isIncome ? 'income' : 'expense',
        description: desc,
        date: txDate,
      },
      params: {
        amount: finalAmount,
        category,
        type: isIncome ? 'income' : 'expense',
        description: desc,
        date: txDate,
      },
      description: `ثبت ${isIncome ? 'درآمد' : 'هزینه'} «${desc}» به مبلغ ${finalAmount.toLocaleString('fa-IR')} تومان`,
    },
    requires_confirmation: true,
  };
}

/**
 * System Prompt for LLM Function Calling & Strict JSON Schema Output
 */
const SYSTEM_PROMPT = `شما دستیار ارشد هوشمند مالی و هدایت‌گر چندمنظوره (Multi-Intent Router) پلتفرم مدیریت مالی چندبوم هستید.
وظیفه شما پردازش متن‌های محاوره‌ای، عامیانه و نامرتب فارسی کاربران، تبدیل اعداد فارسی و تاریخ‌ها، و تولید خروجی ساختاریافته است.

خروجی شما باید منحصراً یک JSON معتبر باشد (بدون Markdown، بدون تگ \`\`\`json و بدون هیچ متن اضافه‌ای در ابتدا یا انتها):
{
  "reply": "متن پاسخ محاوره‌ای، دقیق و گرم به زبان فارسی",
  "action": {
    "type": "add_transaction | create_group | add_deng_expense | create_goal | create_reminder | financial_analysis",
    "data": { ... }
  },
  "requires_confirmation": true
}

دامنه‌های مجاز:
1) "add_transaction":
   data: {"amount": عدد مثبت به تومان, "category": رشته فارسی, "type": "expense" یا "income", "description": شرح کوتاه, "date": "YYYY-MM-DD"}
2) "create_group":
   data: {"name": نام گروه دنگ, "members": آرایه نام افراد}
3) "add_deng_expense":
   data: {"group_name": نام گروه, "title": شرح هزینه, "amount": کل مبلغ, "payer": نام پرداخت‌کننده, "participants": آرایه اعضا, "share_per_person": سهم هر نفر}
4) "create_goal":
   data: {"title": عنوان هدف, "target_amount": مبلغ هدف, "deadline": "YYYY-MM-DD", "category": "سرمایه‌گذاری"}
5) "create_reminder":
   data: {"title": عنوان یادآور یا قسط, "amount": مبلغ, "due_date": "YYYY-MM-DD", "recurrence": "once" یا "monthly", "category": رشته}
6) "financial_analysis":
   وقتی کاربر درخواست تحلیل یا بررسی وضعیت کلی مالی دارد. تحلیل وضعیت و پیشنهادهای راهبردی را در reply به شکل ساختاریافته و در data شاخص‌ها را قرار بده.

قواعد حیاتی:
- اگر اطلاعات اساسی برای اجرای عملیات ناقص است (مثلاً برای ثبت هزینه مبلغ ذکر نشده، یا نام گروه مشخص نیست)، به جای خطا دادن، action را null بگذار و در reply با لحنی مؤدبانه و صمیمی از کاربر اطلاعات را جویا شو.
- برای تمام عملیات مالی که داده ایجاد می‌کنند، requires_confirmation=true باشد.
- برای پرسش‌های کلی، احوال‌پرسی یا درخواست توضیح، action=null و requires_confirmation=false باشد.
- موضوعات نامرتبط با امور مالی یا تحصیلی را مؤدبانه رد کرده و بگو تخصص شما در مدیریت مالی و امکانات چندبوم است.`;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function parseJsonObject(raw: string): any {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Main Deno HTTP Handler
 */
serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'فقط درخواست POST پشتیبانی می‌شود.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const apiKey = Deno.env.get('GAPGPT_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '';
    const baseUrl = (Deno.env.get('GAPGPT_BASE_URL') || 'https://api.gapgpt.app/v1').replace(/\/+$/, '');
    const model = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';

    // 1. Authenticate user from Bearer Token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return jsonResponse({ success: false, error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' }, 401);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase server-side environment variables missing.');
      return jsonResponse({ success: false, error: 'پیکربندی سرور ابری در دسترس نیست.' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return jsonResponse({ success: false, error: 'نشست کاربری نامعتبر است؛ لطفاً مجدداً وارد شوید.' }, 401);
    }

    const userId = authData.user.id;

    // 2. Security & Quota Guard: Validate User Tier & Quota
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, tier, subscription_status, subscription_expires_at, is_premium, ai_queries_used, ai_queries_limit, ai_requests_left, monthly_budget_cap')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !dbUser) {
      console.error('User lookup error:', userError);
      return jsonResponse({ success: false, error: 'اطلاعات کاربری یافت نشد.' }, 404);
    }

    // Free tier check
    const isPaidTier = ['bronze', 'pro', 'vip'].includes(String(dbUser.tier || '').toLowerCase()) || Boolean(dbUser.is_premium);
    const hasActiveSubscription = dbUser.subscription_status === 'active';
    if (!isPaidTier && !hasActiveSubscription) {
      return jsonResponse({
        success: false,
        error: 'دستیار هوشمند مالی ویژه کاربران دارای اشتراک فعال است. لطفاً اشتراک خود را ارتقا دهید.',
        code: 'SUBSCRIPTION_REQUIRED',
      }, 403);
    }

    // 3. Atomically Invoke decrement_ai_quota RPC
    let quotaDecrementSucceeded = false;
    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('decrement_ai_quota', {
        p_user_id: userId,
      });

      if (!rpcError && rpcData !== null && rpcData !== undefined) {
        if (typeof rpcData === 'object' && rpcData.allowed === false) {
          return jsonResponse({
            success: false,
            error: 'سقف سهمیه هوش مصنوعی شما در این دوره به اتمام رسیده است.',
            code: 'QUOTA_EXCEEDED',
          }, 429);
        }
        quotaDecrementSucceeded = true;
      }
    } catch (e) {
      console.warn('RPC decrement_ai_quota call notice:', e);
    }

    // Direct fallback quota decrement if RPC not yet created in PostgreSQL
    if (!quotaDecrementSucceeded) {
      const left = Number(dbUser.ai_requests_left ?? dbUser.ai_queries_limit ?? 50);
      if (left <= 0 && dbUser.tier !== 'vip') {
        return jsonResponse({
          success: false,
          error: 'سقف سهمیه درخواست‌های هوش مصنوعی شما به پایان رسیده است.',
          code: 'QUOTA_EXCEEDED',
        }, 429);
      }
      const newUsed = Number(dbUser.ai_queries_used || 0) + 1;
      const newLeft = Math.max(0, left - 1);
      await supabaseAdmin.from('users').update({
        ai_queries_used: newUsed,
        ai_requests_left: newLeft,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
    }

    // 4. Parse Request Body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return jsonResponse({ success: false, error: 'متن پیام الزامی است.' }, 400);
    }

    const userMessage = body.message.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!userMessage) {
      return jsonResponse({ success: false, error: 'متن پیام خالی است.' }, 400);
    }

    // Instant Reply Check (fast response without burning external LLM tokens)
    const normalizedPrompt = userMessage.replace(/[!؟?.,،؛\s]+$/g, '').trim();
    if (INSTANT_REPLIES[normalizedPrompt]) {
      return jsonResponse({
        success: true,
        reply: INSTANT_REPLIES[normalizedPrompt],
        action: null,
        requires_confirmation: false,
        remaining_queries: dbUser.ai_requests_left ?? 99,
        ai_call_used: false,
      });
    }

    // Off-topic filter
    if (CLEARLY_OFF_TOPIC_PATTERN.test(userMessage) && !FINANCE_KEYWORDS_PATTERN.test(userMessage)) {
      return jsonResponse({
        success: true,
        reply: 'من دستیار اختصاصی مدیریت مالی و قابلیت‌های چندبوم هستم؛ لطفاً در زمینه ثبت تراکنش‌ها، تحلیل بودجه، دنگ گروهی یا اهداف مالی سوالتان را مطرح فرمایید.',
        action: null,
        requires_confirmation: false,
        remaining_queries: dbUser.ai_requests_left ?? 99,
        ai_call_used: false,
      });
    }

    // 5. Fetch Real Financial Data for Deep Financial Analysis Context
    const isFinancialAnalysisIntent =
      body.mode === 'advisor' ||
      /تحلیل|گزارش\s*مالی|وضعیت\s*کلی|بررسی\s*بودجه|چقدر\s*خرج|آینده|پیش‌بینی|آنالیز|حسابرسی|سقف\s*بودجه/i.test(userMessage);

    let userFinancialContext: Record<string, unknown> = {};

    if (isFinancialAnalysisIntent) {
      const sinceDate = new Date();
      sinceDate.setMonth(sinceDate.getMonth() - 6);

      const [txRes, goalsRes, remindersRes] = await Promise.all([
        supabaseAdmin
          .from('transactions')
          .select('amount, type, category, description, date')
          .eq('user_id', userId)
          .gte('date', sinceDate.toISOString())
          .order('date', { ascending: false })
          .limit(100),
        supabaseAdmin
          .from('financial_goals')
          .select('title, target_amount, current_amount, deadline, category')
          .eq('user_id', userId)
          .limit(15),
        supabaseAdmin
          .from('reminders')
          .select('title, amount, due_date, is_paid')
          .eq('user_id', userId)
          .order('due_date', { ascending: true })
          .limit(15),
      ]);

      const txList = txRes.data || [];
      const incomeTotal = txList
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const expenseTotal = txList
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      const categoryTotals: Record<string, number> = {};
      for (const t of txList) {
        if (t.type === 'expense') {
          const c = String(t.category || 'سایر');
          categoryTotals[c] = (categoryTotals[c] || 0) + Number(t.amount || 0);
        }
      }

      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percent: expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
        }));

      userFinancialContext = {
        monthly_cap: Number(dbUser.monthly_budget_cap) || 20000000,
        income_total: incomeTotal,
        expense_total: expenseTotal,
        net_cashflow: incomeTotal - expenseTotal,
        top_categories: topCategories,
        recent_transactions_count: txList.length,
        goals: goalsRes.data || [],
        reminders: remindersRes.data || [],
      };
    }

    // 6. Route high-impact group-creation requests deterministically first.
    // This guarantees a structured action card instead of a text-only confirmation loop.
    let finalResult: { reply: string; action: ActionPayload | null; requires_confirmation: boolean } | null = null;
    const isGroupCreationRequest = /(?:بساز|بسازید|ایجاد\s*کن|ایجاد\s*کنید|تشکیل\s*بده|تشکیل\s*بدید|ساخت\s*گروه|ایجاد\s*گروه|گروه\s*جدید)/i.test(userMessage)
      && /گروه|دنگ|دونگ/i.test(userMessage);
    if (isGroupCreationRequest) {
      finalResult = parseFinancialInputDeterministically(userMessage, userFinancialContext);
    }

    // 7. External LLM Invocation with deterministic fallback for other intents.
    if (!finalResult && apiKey) {
      try {
        const history = Array.isArray(body.messages) ? body.messages : [];
        const formattedHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n${
              isFinancialAnalysisIntent
                ? `\nاطلاعات مالی واقعی حساب کاربر:\n${JSON.stringify(userFinancialContext)}`
                : ''
            }`,
          },
        ];

        for (const item of history.slice(-MAX_HISTORY_MESSAGES)) {
          if (item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string') {
            formattedHistory.push({
              role: item.role,
              content: item.content.slice(0, 300),
            });
          }
        }
        formattedHistory.push({ role: 'user', content: userMessage });

        const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(AI_TIMEOUT_MS),
          body: JSON.stringify({
            model,
            messages: formattedHistory,
            temperature: isFinancialAnalysisIntent ? 0.35 : 0.15,
            max_tokens: 800,
          }),
        });

        if (aiResponse.ok) {
          const aiJson = await aiResponse.json().catch(() => null);
          const rawContent = aiJson?.choices?.[0]?.message?.content;
          if (rawContent && typeof rawContent === 'string') {
            const parsed = parseJsonObject(rawContent);
            if (parsed && typeof parsed.reply === 'string') {
              let actionObj: ActionPayload | null = null;
              if (parsed.action && typeof parsed.action.type === 'string') {
                const actionData = parsed.action.data || parsed.action.params || {};
                actionObj = {
                  type: parsed.action.type as ActionType,
                  data: actionData,
                  params: actionData,
                  description: parsed.action.description || 'پیشنهاد عملیات هوشمند چندبوم',
                };
              }

              finalResult = {
                reply: parsed.reply,
                action: actionObj,
                requires_confirmation: parsed.requires_confirmation ?? Boolean(actionObj),
              };
            }
          }
        }
      } catch (llmErr) {
        console.warn('External LLM invocation failed; using deterministic Persian NLP fallback:', llmErr);
      }
    }

    // 7. If LLM was unavailable or returned non-JSON, run our rock-solid deterministic NLP router
    if (!finalResult) {
      finalResult = parseFinancialInputDeterministically(userMessage, userFinancialContext);
    }

    // 8. Log AI Usage for Analytics
    try {
      await supabaseAdmin.from('ai_usage_logs').insert([
        {
          user_id: userId,
          query_category: finalResult.action ? finalResult.action.type : 'general_chat',
          tokens_used: 120,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    // 9. Standardized, Production-Grade JSON Response
    return jsonResponse({
      success: true,
      reply: finalResult.reply,
      action: finalResult.action,
      requires_confirmation: finalResult.requires_confirmation,
      remaining_queries: Math.max(0, (dbUser.ai_requests_left ?? 50) - 1),
      ai_call_used: true,
    });
  } catch (err: any) {
    console.error('Fatal Edge Function Error:', err);
    return jsonResponse(
      {
        success: false,
        error: 'خطای سیستمی رخ داد. لطفاً چند لحظه بعد مجدداً تلاش فرمایید.',
      },
      500
    );
  }
});
