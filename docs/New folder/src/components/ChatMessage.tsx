import React, { useState } from 'react';
import {
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Users,
  Target,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Loader2,
  Tag,
  Check,
  X,
  TrendingUp,
  CreditCard,
  PieChart,
} from 'lucide-react';
import { AiAssistantAction } from '../lib/supabase';
import { formatToman, toPersianDigits } from '../utils/formatters';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: AiAssistantAction | null;
  actionExecuted?: boolean;
  actionSuccessMessage?: string;
  actionError?: string | null;
}

interface ChatMessageProps {
  message: ChatMessageItem;
  onExecuteAction?: (messageId: string, action: AiAssistantAction) => Promise<boolean>;
  onDismissAction?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onExecuteAction,
  onDismissAction,
}) => {
  const isUser = message.role === 'user';
  const { action, actionExecuted, actionSuccessMessage, actionError } = message;

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(actionError || null);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleConfirm = async () => {
    if (!action || !onExecuteAction || actionExecuted || isLoading) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      const ok = await onExecuteAction(message.id, action);
      if (!ok) {
        setLocalError('ثبت عملیات در پایگاه داده با خطا مواجه شد.');
      }
    } catch (err: any) {
      setLocalError(err?.message || 'خطا در اجرای عملیات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismissAction) {
      onDismissAction(message.id);
    }
  };

  const formattedTime = (() => {
    try {
      const d = new Date(message.timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return '';
  })();

  const renderActionCard = () => {
    if (!action || isDismissed) return null;

    const { type, description } = action;
    const params = action.data || action.params || {};

    let icon = <Receipt className="w-4 h-4 text-emerald-400" />;
    let typeTitle = 'پیشنهاد تراکنش مالی';
    let buttonLabel = 'تأیید و ثبت تراکنش';
    let isInformativeOnly = false;

    if (type === 'create_dong_group' || type === 'create_group') {
      icon = <Users className="w-4 h-4 text-cyan-400" />;
      typeTitle = 'پیشنهاد ایجاد گروه دنگ';
      buttonLabel = 'تأیید و ایجاد گروه دنگ';
    } else if (type === 'add_deng_expense') {
      icon = <CreditCard className="w-4 h-4 text-emerald-300" />;
      typeTitle = 'پیشنهاد ثبت خرج دنگ گروهی';
      buttonLabel = 'تأیید و ثبت خرج دنگ';
    } else if (type === 'create_goal') {
      icon = <Target className="w-4 h-4 text-amber-400" />;
      typeTitle = 'پیشنهاد هدف مالی و پس‌انداز';
      buttonLabel = 'تأیید و ثبت هدف مالی';
    } else if (type === 'create_reminder') {
      icon = <Bell className="w-4 h-4 text-purple-400" />;
      typeTitle = 'پیشنهاد یادآور پرداخت سررسید';
      buttonLabel = 'تأیید و ثبت یادآور';
    } else if (type === 'financial_analysis' || type === 'analysis_report') {
      icon = <TrendingUp className="w-4 h-4 text-amber-300" />;
      typeTitle = 'خلاصه شاخص‌های تحلیل وضعیت مالی';
      isInformativeOnly = true;
    }

    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900/90 dark:bg-[#0c1813] text-white shadow-lg backdrop-blur-sm transition-all duration-300">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
              {icon}
            </span>
            <span className="text-xs font-bold text-zinc-100">{typeTitle}</span>
          </div>

          {isInformativeOnly ? (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              تحلیل هوشمند
            </span>
          ) : actionExecuted ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Check className="w-3 h-3" />
              انجام شد
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              منتظر تأیید شما
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed text-zinc-200 font-medium">
            {description}
          </p>

          {/* Detailed Params Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-3 rounded-xl border border-white/5">
            {/* 1. Transaction */}
            {(type === 'create_transaction' || type === 'add_transaction') && (
              <>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">نوع:</span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold ${
                      params.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {params.type === 'income' ? (
                      <>
                        <ArrowDownLeft className="w-3 h-3" />
                        درآمد
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3 h-3" />
                        هزینه
                      </>
                    )}
                  </span>
                </div>
                {params.amount && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className="text-zinc-400">مبلغ:</span>
                    <span className="font-bold text-white font-mono">
                      {formatToman(Number(params.amount))}
                    </span>
                  </div>
                )}
                {params.category && (
                  <div className="flex items-center gap-1.5 text-zinc-300 col-span-2">
                    <Tag className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-400">دسته‌بندی:</span>
                    <span className="text-zinc-200">{String(params.category)}</span>
                  </div>
                )}
                {params.date && (
                  <div className="flex items-center gap-1.5 text-zinc-300 col-span-2">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-400">تاریخ:</span>
                    <span className="font-mono text-zinc-200">{toPersianDigits(params.date)}</span>
                  </div>
                )}
              </>
            )}

            {/* 2. Group Creation */}
            {(type === 'create_dong_group' || type === 'create_group') && (
              <>
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">نام گروه:</span>
                  <span className="font-bold text-cyan-300">{params.name || 'گروه جدید'}</span>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-zinc-400 text-[10px]">اعضای گروه:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(params.members) && params.members.length > 0 ? (
                      params.members.map((m: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 text-[10px]"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-[10px]">بدون عضو مشخص</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 3. Deng Expense */}
            {type === 'add_deng_expense' && (
              <>
                <div className="col-span-2 flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">گروه:</span>
                  <span className="font-bold text-cyan-300">{params.group_name || 'سفر'}</span>
                </div>
                <div className="col-span-2 flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">شرح هزینه:</span>
                  <span className="font-bold text-white">{params.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">کل مبلغ:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatToman(Number(params.amount))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">پرداخت‌کننده:</span>
                  <span className="font-bold text-amber-300">{params.payer || 'من'}</span>
                </div>
                {params.share_per_person && (
                  <div className="col-span-2 flex items-center justify-between text-zinc-300 pt-1 border-t border-white/5">
                    <span className="text-zinc-400">سهم هر نفر:</span>
                    <span className="font-mono text-cyan-200">
                      {formatToman(Number(params.share_per_person))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 4. Goal Creation */}
            {type === 'create_goal' && (
              <>
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">عنوان هدف:</span>
                  <span className="font-bold text-amber-300">{params.title}</span>
                </div>
                {params.target_amount && (
                  <div className="flex items-center gap-1.5 text-zinc-300 col-span-2">
                    <span className="text-zinc-400">مبلغ هدف:</span>
                    <span className="font-bold text-white font-mono">
                      {formatToman(Number(params.target_amount))}
                    </span>
                  </div>
                )}
                {params.deadline && (
                  <div className="flex items-center gap-1.5 text-zinc-300 col-span-2">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-400">مهلت زمانی:</span>
                    <span className="font-mono text-zinc-200">{toPersianDigits(params.deadline)}</span>
                  </div>
                )}
              </>
            )}

            {/* 5. Reminder Creation */}
            {type === 'create_reminder' && (
              <>
                <div className="col-span-2 flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-400">عنوان:</span>
                  <span className="font-bold text-purple-300">{params.title}</span>
                </div>
                {params.amount ? (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className="text-zinc-400">مبلغ:</span>
                    <span className="font-mono text-white">{formatToman(Number(params.amount))}</span>
                  </div>
                ) : null}
                {params.due_date && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-400">سررسید:</span>
                    <span className="font-mono text-zinc-200">{toPersianDigits(params.due_date)}</span>
                  </div>
                )}
              </>
            )}

            {/* 6. Financial Analysis Indicators */}
            {(type === 'financial_analysis' || type === 'analysis_report') && (
              <>
                {params.income_total !== undefined && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-400">درآمد:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatToman(Number(params.income_total))}
                    </span>
                  </div>
                )}
                {params.expense_total !== undefined && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="text-zinc-400">مخارج:</span>
                    <span className="font-mono text-rose-400 font-bold">
                      {formatToman(Number(params.expense_total))}
                    </span>
                  </div>
                )}
                {params.net_cashflow !== undefined && (
                  <div className="col-span-2 flex items-center justify-between text-zinc-300 pt-1 border-t border-white/5">
                    <span className="text-zinc-400">جریان نقدی آزاد:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {formatToman(Number(params.net_cashflow))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Success State */}
          {actionExecuted && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{actionSuccessMessage || 'عملیات با موفقیت در پایگاه داده ثبت شد.'}</span>
            </div>
          )}

          {/* Action Error State */}
          {localError && !actionExecuted && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{localError}</span>
            </div>
          )}

          {/* Action Buttons (only show when not executed and not purely informative) */}
          {!actionExecuted && !isInformativeOnly && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ثبت...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{buttonLabel}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-zinc-300 text-xs transition cursor-pointer flex items-center justify-center gap-1"
                title="صرف‌نظر"
              >
                <X className="w-3.5 h-3.5" />
                <span>انصراف</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3 transition-opacity duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs ${
          isUser
            ? 'bg-zinc-800 dark:bg-zinc-700 text-white font-bold'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div
        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
          isUser
            ? 'bg-emerald-700 text-white rounded-tl-xs'
            : 'bg-zinc-100 dark:bg-[#15231C] text-zinc-900 dark:text-zinc-100 border border-[#E2E8E4] dark:border-[#22352B] rounded-tr-xs'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* If message has action card */}
        {renderActionCard()}

        {/* Timestamp */}
        {formattedTime && (
          <div
            className={`mt-1.5 text-[10px] ${
              isUser ? 'text-emerald-100 text-left' : 'text-zinc-400 text-right'
            }`}
          >
            {toPersianDigits(formattedTime)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
