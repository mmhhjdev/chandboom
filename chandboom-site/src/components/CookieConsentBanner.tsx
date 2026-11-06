import React, { useEffect, useState } from 'react';
import { getConsent, setConsent, type ConsentValue } from '../lib/consent';

export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value: ConsentValue) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="تنظیمات کوکی"
      className="fixed bottom-4 inset-x-4 z-[90] mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 font-cairo"
    >
      <p className="text-xs leading-6 text-slate-700 dark:text-slate-200">
        برای بهتر کردن سایت از کوکی‌های تحلیلی استفاده می‌کنیم. تراکنش‌ها و مبالغ شما هرگز به سرویس تحلیل ارسال نمی‌شود.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => choose('denied')}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          فقط ضروری
        </button>
        <button
          type="button"
          onClick={() => choose('granted')}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          پذیرفتن
        </button>
      </div>
    </div>
  );
};
