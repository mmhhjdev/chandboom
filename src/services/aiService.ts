/**
 * چندبوم (Chandboom) - سامانه هوشمند پردازش مالی و دستیار اختصاصی هوش مصنوعی
 *
 * تمامی پردازش‌های دستیار هوشمند، تحلیل تراکنش‌ها، پیامک بانکی و مشاوره مالی
 * منحصراً از طریق Edge Function رسمی 'ai-assistant' با اعتبارسنجی توکن کاربر (JWT)
 * و کنترل دسترسی اشتراک در سمت سرور انجام می‌پذیرد.
 */

import { TransactionCategory, TransactionType } from '../types';
import { invokeAiAssistantEdgeFunction, AiAssistantAction } from '../lib/supabase';

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
  action?: AiAssistantAction | null;
  requires_confirmation?: boolean;
  remaining_queries?: number;
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
 * دریافت تاریخ جاری شمسی استاندارد (مثال: 1403/08/01)
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

const VALID_EXPENSE_CATEGORIES: TransactionCategory[] = [
  'خوراک و رستوران',
  'خوراک و غذا',
  'مسکن و اجاره',
  'مسکن و قبوض',
  'حمل‌ونقل و خودرو',
  'حمل و نقل',
  'خرید و پوشاک',
  'سرگرمی و تفریح',
  'تفریح و سرگرمی',
  'سلامت و درمان',
  'قبوض و شارژ',
  'آموزش و کتاب',
  'آموزش و یادگیری',
  'سایر و متفرقه',
  'سایر',
];

const VALID_INCOME_CATEGORIES: TransactionCategory[] = [
  'حقوق و دستمزد',
  'سرمایه‌گذاری و سود',
  'سرمایه‌گذاری',
  'هدیه و پاداش',
  'فروش و کسب‌وکار',
  'سایر دریافتی‌ها',
  'سایر',
];

export function normalizeCategory(categoryName: any, type: TransactionType): TransactionCategory {
  if (!categoryName || typeof categoryName !== 'string') {
    return type === 'income' ? 'حقوق و دستمزد' : 'خوراک و غذا';
  }
  const clean = categoryName.trim();
  const validList = type === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES;
  const exact = validList.find((c) => c === clean);
  if (exact) return exact;

  const partial = validList.find((c) => clean.includes(c) || c.includes(clean));
  if (partial) return partial;

  return type === 'income' ? 'حقوق و دستمزد' : 'خوراک و غذا';
}

export const AI_CHAT_MODEL = 'gpt-4o-mini';
export const AI_PARSER_MODEL = 'gpt-4o-mini';

export function getAiApiKey(): string {
  return '';
}

export function getAiBaseUrl(): string {
  return '';
}

export function isAiConfigured(): boolean {
  return true;
}

/**
 * پردازش پیام یا تراکنش با ارسال امن به Supabase Edge Function 'ai-assistant'
 */
export async function processFinancialAI(
  userInput: string,
  userContext?: {
    metrics?: { balance: number; totalIncome: number; totalExpense: number };
    monthlyCap?: number;
    fullName?: string;
    chatHistory?: Array<{ role?: string; text?: string; content?: string }>;
    mode?: 'agent' | 'advisor';
  }
): Promise<AiProcessResult> {
  const trimmed = userInput.trim();
  if (!trimmed) {
    throw new Error('متن پیام وارد نشده است.');
  }

  // Determine requested mode: advisor (for deep analysis) or agent (action proposals)
  const isAdvisorQuery =
    userContext?.mode === 'advisor' ||
    /تحلیل|مشاوره|پیش‌بینی|وضعیت کلی|آینده|بررسی بودجه|سناریو/i.test(trimmed);
  const mode: 'agent' | 'advisor' = isAdvisorQuery ? 'advisor' : 'agent';

  // Format message history
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (userContext?.chatHistory && userContext.chatHistory.length > 0) {
    const recent = userContext.chatHistory.slice(-4);
    for (const item of recent) {
      history.push({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: String(item.text || item.content || '').slice(0, 500),
      });
    }
  }

  // Call official Supabase Edge Function
  const res = await invokeAiAssistantEdgeFunction(trimmed, history, mode);

  if (!res.success) {
    if (res.code === 'SUBSCRIPTION_REQUIRED') {
      throw new Error('دستیار هوشمند چندبوم فقط برای کاربران دارای اشتراک فعال (برنزی، پرو یا VIP) در دسترس است.');
    }
    if (res.code === 'QUOTA_EXCEEDED') {
      throw new Error('سقف ماهانه استفاده از هوش مصنوعی شما به اتمام رسیده است.');
    }
    if (res.code === 'AUTH_REQUIRED') {
      throw new Error('برای گفت‌وگو با دستیار هوشمند، لطفاً ابتدا وارد حساب کاربری خود شوید.');
    }
    throw new Error(res.error || 'خطا در ارتباط با دستیار هوشمند چندبوم.');
  }

  // 1. If an action is proposed by the server
  if (res.action) {
    const actionType = res.action.type;
    const params = res.action.data || res.action.params || {};

    if (actionType === 'create_transaction' || actionType === 'add_transaction') {
      const txType: TransactionType =
        String(params.type || '').toLowerCase().includes('income') ? 'income' : 'expense';
      const amount = Math.round(Number(params.amount) || 0);

      const structuredTx: AiStructuredTransaction = {
        type: txType,
        title: params.description || (txType === 'income' ? 'درآمد' : 'هزینه'),
        amount,
        category: normalizeCategory(params.category, txType),
        date: params.date || getCurrentShamsiDate(),
      };

      return {
        is_transaction: true,
        is_ambiguous: false,
        transaction: structuredTx,
        transactions: [structuredTx],
        conversational_reply: res.reply,
        action: res.action,
        requires_confirmation: res.requires_confirmation ?? true,
        remaining_queries: res.remaining_queries,
        raw_input: trimmed,
      };
    }

    // For create_dong_group, create_goal, create_reminder:
    return {
      is_transaction: false,
      is_ambiguous: false,
      conversational_reply: res.reply,
      action: res.action,
      requires_confirmation: res.requires_confirmation ?? true,
      remaining_queries: res.remaining_queries,
      raw_input: trimmed,
    };
  }

  // 2. Regular conversational or advisor response (no action proposed)
  return {
    is_transaction: false,
    is_ambiguous: false,
    conversational_reply: res.reply,
    action: null,
    requires_confirmation: false,
    remaining_queries: res.remaining_queries,
    raw_input: trimmed,
  };
}

/**
 * استخراج و تحلیل ساختاریافته تراکنش‌ها و پیامک‌های بانکی با دستیار هوشمند چندبوم
 */
export async function parseTransactionWithSystemOne(input: string): Promise<AiParsedTransaction> {
  const result = await processFinancialAI(input);

  if (result.is_transaction && result.transaction) {
    return {
      clean_title: result.transaction.title,
      amount: result.transaction.amount,
      type: result.transaction.type,
      bank: 'کارت بانکی',
      date: new Date().toISOString(),
      category: result.transaction.category,
      confidence: 0.99,
      raw_input: input,
    };
  }

  if (result.is_ambiguous && result.clarification_message) {
    throw new Error(result.clarification_message);
  }

  if (result.conversational_reply) {
    throw new Error(result.conversational_reply);
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
 * دریافت مشاوره و گفتگوی مالی هوشمند با هوش مصنوعی چندبوم در حالت Advisor
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
    mode: 'advisor',
    chatHistory: chatHistory?.map((h) => ({
      role: h.role === 'user' || h.sender === 'user' ? 'user' : 'assistant',
      text: h.text || h.content || '',
    })),
  });

  if (result.conversational_reply) {
    return result.conversational_reply;
  }
  throw new Error('خطا در برقراری ارتباط با دستیار هوشمند چندبوم.');
}

export const aiService = {
  processFinancialAI,
  parseTransaction: parseTransactionWithSystemOne,
  parseTransactionsBatch,
  getAdvice: getConversationalAdvice,
  isConfigured: isAiConfigured,
};

export default aiService;
