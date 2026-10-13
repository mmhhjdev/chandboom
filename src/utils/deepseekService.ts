import { ParsedAITransaction } from '../types';
import { parseTransactionWithSystemOne, getConversationalAdvice, getAiApiKey, isAiConfigured } from '../services/aiService';

/**
 * سرویس یکپارچه هوش مصنوعی چندبوم (Chandboom AI Integration)
 * کلیه درخواست‌های پردازش متن، پیامک بانکی و مشاوره به صورت مستقیم و اختصاصی
 * به موتور مرکزی هوش مصنوعی چندبوم (aiService) ارجاع داده می‌شوند.
 */

export function getDeepSeekApiKey(): string {
  return getAiApiKey();
}

export function isDeepSeekConfigured(): boolean {
  return isAiConfigured();
}

/**
 * پردازش تراکنش مالی با هوش مصنوعی چندبوم
 */
export async function parseTransactionWithDeepSeek(input: string): Promise<ParsedAITransaction> {
  const res = await parseTransactionWithSystemOne(input);
  return {
    type: res.type,
    amount: res.amount,
    category: res.category || 'سایر و متفرقه',
    description: res.clean_title,
    date: res.date || new Date().toISOString(),
    confidence: res.confidence,
  };
}

/**
 * دریافت مشاوره مالی و بودجه‌بندی از هوش مصنوعی چندبوم
 */
export async function generateDeepSeekAdvice(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string }
): Promise<string> {
  return getConversationalAdvice(userQuery, metrics, monthlyCap, demographics);
}
