import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  FileText,
  Loader2,
} from 'lucide-react';
import { TransactionCategory, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { parseTransactionWithSystemOne } from '../services/aiService';

interface BankSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: {
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    description: string;
    account?: string;
    date: string;
  }) => void;
}

export const BankSmsModal: React.FC<BankSmsModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
}) => {
  const [rawText, setRawText] = useState('');
  const [isParsed, setIsParsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Extracted deterministic attributes
  const [extractedAmount, setExtractedAmount] = useState<number>(0);
  const [extractedType, setExtractedType] = useState<TransactionType>('expense');
  const [extractedBank, setExtractedBank] = useState<string>('کارت بانکی');
  const [extractedDate, setExtractedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // User interactive confirmation fields (Category MUST be manually chosen!)
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('خوراک و غذا');
  const [customDescription, setCustomDescription] = useState('');

  if (!isOpen) return null;

  const handleParseSms = async () => {
    setParseError(null);
    const text = rawText.trim();
    if (!text) {
      setParseError('لطفاً متن پیامک بانکی، رسید یا جمله محاوره را در کادر وارد فرمایید.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Parse using GapGPT typesafe/jev-1.13 (/systemone) and Smart NLU parser
      const parsed = await parseTransactionWithSystemOne(text);

      if (!parsed.amount || parsed.amount <= 0) {
        setParseError('مبلغ معتبری در متن شناسایی نشد. لطفاً متن یا عدد مبلغ را بررسی فرمایید.');
        setIsProcessing(false);
        return;
      }

      setExtractedAmount(parsed.amount);
      setExtractedType(parsed.type);
      setExtractedBank(parsed.bank || 'کارت بانکی شتاب');
      setExtractedDate(parsed.date ? parsed.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      
      // Default description from clean title or bank
      const cleanDesc = parsed.clean_title && parsed.clean_title !== text
        ? parsed.clean_title
        : `${parsed.type === 'income' ? 'واریزی' : 'برداشت'} ${parsed.bank || 'بانک'}`;
      setCustomDescription(cleanDesc);

      // Default category for user to confirm/change
      setSelectedCategory(parsed.type === 'income' ? 'حقوق و دستمزد' : 'خوراک و غذا');

      setIsParsed(true);
    } catch (err: any) {
      console.error('Error parsing transaction text:', err);
      setParseError('خطا در پردازش هوشمند پیامک. لطفاً متن را بررسی نمایید.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedAmount <= 0) return;

    onSaveTransaction({
      type: extractedType,
      amount: extractedAmount,
      category: selectedCategory,
      description: customDescription.trim() || `${extractedType === 'income' ? 'واریز' : 'برداشت'} - ${extractedBank}`,
      account: extractedBank,
      date: new Date(extractedDate).toISOString(),
    });

    onClose();
  };

  const categories = extractedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-cairo">
      <div
        id="bank-sms-modal"
        className="w-full max-w-lg bg-white dark:bg-[#0E1511] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1F2E27] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                پردازش هوشمند پیامک بانکی و فیش
              </h3>
              <p className="text-xs text-zinc-500">
                استخراج قطعی داده‌ها با تایید و انتخاب دستی دسته‌بندی توسط شما
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {!isParsed ? (
          /* Step 1: Paste Input */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                متن پیامک یا رسید پرداخت را اینجا جای‌گذاری (Paste) کنید:
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="مثال: برداشت از کارت سامان به مبلغ ۵۸۰,۰۰۰ ریال به حساب ... تاریخ ۱۴۰۵/۰۷/۱۸ ساعت ۱۲:۳۰"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-2xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono resize-none leading-relaxed text-right"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400">
                پشتیبانی از تمامی بانک‌های عضو شتاب (سامان، ملت، ملی، بلو، رسالت...)
              </span>
              <button
                type="button"
                onClick={handleParseSms}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال پردازش هوشمند...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>استخراج و مرحله بعد</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Interactive Confirmation Screen */
          <form onSubmit={handleConfirmAndSave} className="space-y-4">
            {/* Extracted Deterministic Badge Summary */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  بانک شناسایی‌شده:
                </span>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  {extractedBank}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  {extractedType === 'income' ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                  )}
                  نوع و مبلغ استخراج‌شده:
                </span>
                <div className="text-left">
                  <span
                    className={`font-cairo font-black text-base ${
                      extractedType === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {extractedType === 'income' ? '+' : '-'} {formatToman(extractedAmount)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    ({extractedType === 'income' ? 'واریز' : 'برداشت'})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  تاریخ ثبت:
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {extractedDate}
                </span>
              </div>
            </div>

            {/* Interactive User Selection for Category (No Auto-guessing) */}
            <div className="space-y-2">
              <label className="block text-xs font-cairo font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>لطفاً دسته‌بندی این تراکنش را مشخص فرمایید *</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-2 rounded-xl text-xs font-cairo font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                          : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1A2620]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span>توضیحات تکمیلی (اختیاری):</span>
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="مثلاً: خرید نان و اقلام سوپرمارکت"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E27]">
              <button
                type="button"
                onClick={() => setIsParsed(false)}
                className="px-4 py-2 rounded-xl text-xs font-cairo font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                اصلاح متن پیامک
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت نهایی تراکنش در چندبوم</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
