import React, { useState } from 'react';
import {
  X,
  MessageSquarePlus,
  LifeBuoy,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { TicketDepartment, TicketPriority } from '../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject: string;
    department: TicketDepartment;
    category?: string;
    priority: TicketPriority;
    initialMessage: string;
  }) => Promise<void> | void;
}

const CATEGORIES: { label: string; department: TicketDepartment; value: string }[] = [
  { label: 'پشتیبانی مالی (اشتراک، فیش واریز، تراکنش)', department: 'پشتیبانی مالی', value: 'financial' },
  { label: 'پشتیبانی فنی (باگ، خطا، مشکل دسترسی)', department: 'پشتیبانی فنی', value: 'technical' },
  { label: 'پیشنهادات و انتقادات (قابلیت‌های جدید)', department: 'انتقادات و پیشنهادات', value: 'feedback' },
  { label: 'سوالات عمومی و حساب کاربری', department: 'عمومی', value: 'support' },
];

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSubmit }) => {

  const [subject, setSubject] = useState('');
  const [selectedCatIndex, setSelectedCatIndex] = useState(0);
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [initialMessage, setInitialMessage] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      setErrorMsg('لطفاً عنوان تیکت و شرح درخواست را وارد فرمایید.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    const cat = CATEGORIES[selectedCatIndex];
    try {
      await onSubmit({
        subject: subject.trim(),
        department: cat.department,
        category: cat.value,
        priority,
        initialMessage: initialMessage.trim(),
      });
      setSubject('');
      setInitialMessage('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'ذخیره تیکت در پایگاه داده انجام نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div
        id="ticket-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0E1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1F2E27] bg-zinc-50/70 dark:bg-[#121B17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ارسال تیکت پشتیبانی <span className="font-brand text-emerald-700 dark:text-emerald-400">چندبوم</span>
              </h3>
              <p className="text-[11px] text-zinc-500">پاسخگویی سریع توسط کارشناسان پشتیبانی</p>
            </div>
          </div>
          <button
            id="close-ticket-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              موضوع تیکت *
            </label>
            <input
              id="ticket-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثلاً: سوال در خصوص تایید فیش واریزی اشتراک طلایی..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-cairo"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                دسته‌بندی موضوعی
              </label>
              <select
                id="ticket-department-select"
                value={selectedCatIndex}
                onChange={(e) => setSelectedCatIndex(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-cairo"
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={cat.value} value={idx}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                اولویت رسیدگی
              </label>
              <select
                id="ticket-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-cairo"
              >
                <option value="low">کم (عادی)</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد (فوری)</option>
                <option value="urgent">بسیار اضطراری (VIP)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              متن درخواست و جزئیات کامل *
            </label>
            <textarea
              id="ticket-message-input"
              rows={4}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="لطفاً شرح کامل مشکل، شماره فیش، کد پیگیری یا سوال خود را اینجا یادداشت کنید..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none font-cairo leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50/60 dark:bg-[#121F19] rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40 text-xs text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>تیکت شما بلافاصله در سوپابیس ذخیره شده و به اطلاع تیم پشتیبانی می‌رسد.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E27]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              id="submit-new-ticket-btn"
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl text-xs font-cairo font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت تیکت...</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>ارسال تیکت به پشتیبانی</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
