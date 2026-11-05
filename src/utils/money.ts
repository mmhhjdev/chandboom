/**
 * ابزارهای ورودی و نمایش مبلغ پولی (تومان، عدد صحیح)
 * - ارقام فارسی و عربی را به لاتین تبدیل می‌کند تا کیبورد فارسی هم کار کند.
 * - جداکننده‌های هزارگان فارسی/عربی/انگلیسی را حذف می‌کند.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/** مبلغ ورودی کاربر را به عدد صحیح تبدیل می‌کند؛ اگر نامعتبر باشد NaN برمی‌گرداند. */
export function parseMoneyInput(input: string): number {
  const cleaned = normalizeDigits(input).replace(/[,،٬\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

/** در حین تایپ، ارقام را با جداکننده هزارگان نمایش می‌دهد. */
export function formatMoneyInput(value: string): string {
  const digits = normalizeDigits(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}
