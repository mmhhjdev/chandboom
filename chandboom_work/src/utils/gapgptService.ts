import { ParsedAITransaction, TransactionCategory, TransactionType } from '../types';
import {
  parseTransactionWithSystemOne,
  getConversationalAdvice,
  getAiApiKey,
  getAiBaseUrl,
  isAiConfigured,
  AI_CHAT_MODEL,
  AI_PARSER_MODEL,
} from '../services/aiService';

/**
 * سامانه مدیریت مالی چندبوم - اتصال اختصاصی هوش مصنوعی چندبوم
 */

export const GAPGPT_BASE_URL = getAiBaseUrl();
export const GAPGPT_PARSER_MODEL = AI_PARSER_MODEL;
export const GAPGPT_CHAT_MODEL = AI_CHAT_MODEL;

export function getGapGptApiKey(): string {
  return getAiApiKey();
}

export function isGapGptConfigured(): boolean {
  return isAiConfigured();
}

export interface GapGptParsedTransaction {
  clean_title: string;
  amount: number;
  type: TransactionType;
  bank?: string | null;
  date?: string;
  category?: TransactionCategory | null;
  confidence: number;
  raw_input: string;
}

/**
 * استخراج ساختاریافته تراکنش با هوش مصنوعی چندبوم
 */
export async function parseTransactionWithGapGpt(input: string): Promise<GapGptParsedTransaction> {
  const res = await parseTransactionWithSystemOne(input);
  return {
    clean_title: res.clean_title,
    amount: res.amount,
    type: res.type,
    bank: res.bank,
    date: res.date,
    category: res.category,
    confidence: res.confidence,
    raw_input: res.raw_input,
  };
}

/**
 * دریافت مشاوره و گفتگوی مالی هوشمند
 */
export async function generateGapGptChatResponse(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string }
): Promise<string> {
  return getConversationalAdvice(userQuery, metrics, monthlyCap, demographics);
}

/**
 * نام‌های مستعار جهت حفظ سازگاری
 */
export const parseTransactionWithDeepSeek = async (input: string): Promise<ParsedAITransaction> => {
  const res = await parseTransactionWithGapGpt(input);
  return {
    type: res.type,
    amount: res.amount,
    category: res.category || 'سایر و متفرقه',
    description: res.clean_title,
    date: res.date || new Date().toISOString(),
    confidence: res.confidence,
  };
};

export const generateDeepSeekAdvice = generateGapGptChatResponse;
export const getDeepSeekApiKey = getGapGptApiKey;
