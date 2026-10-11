import { ParsedAITransaction, TransactionCategory, TransactionType } from '../types';
import { parseTransactionWithSystemOne, getConversationalAdvice } from '../services/aiService';

/**
 * چندبوم (Chandboom) - Unified AI Provider Integration
 * Model A: typesafe/jev-1.13 (/systemone) for structured transaction parsing
 * Model B: gapgpt-gemma-26b-a4b (/chat/completions) for conversational advisory
 */

export const GAPGPT_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAPGPT_BASE_URL) ||
  'https://api.gapgpt.app/v1';

export const GAPGPT_PARSER_MODEL = 'typesafe/jev-1.13';
export const GAPGPT_CHAT_MODEL = 'gapgpt-gemma-26b-a4b';
export const GAPGPT_FALLBACK_CHAT_MODEL = 'gpt-6-luna';

/**
 * Retrieves the GapGPT API Key from environment variables
 */
export function getGapGptApiKey(): string {
  const key =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAPGPT_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GAPGPT_API_KEY) ||
    '';
  return key ? key.trim() : '';
}

export function isGapGptConfigured(): boolean {
  return Boolean(getGapGptApiKey());
}

/**
 * Structure returned by the specialized Parser Model (typesafe/jev-1.13)
 */
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
 * 1. Structured Data & Transaction Parser (typesafe/jev-1.13 via /systemone)
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
 * 2. Conversational Advisor & General Chat (gapgpt-gemma-26b-a4b via /chat/completions)
 */
export async function generateGapGptChatResponse(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string }
): Promise<string> {
  return getConversationalAdvice(userQuery, metrics, monthlyCap, demographics);
}