/**
 * اعتبارسنجی خالص خرج دنگ (بدون وابستگی به Supabase تا قابل تست باشد).
 * هر ورودی‌ای که از دستیار یا فرم می‌آید باید از این مسیر رد شود.
 */

export interface ExpenseDraftInput {
  title: string;
  payer: string;
  amount: number;
  participants: string[];
  members: string[];
}

export interface ValidatedExpense {
  title: string;
  payer: string;
  amount: number;
  participants: string[];
}

export function validateExpenseDraft(input: ExpenseDraftInput): ValidatedExpense {
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('مبلغ خرج دنگ باید عددی بزرگ‌تر از صفر باشد.');
  }

  const members = new Set(input.members.map((m) => m.trim()).filter(Boolean));
  const payer = input.payer.trim();
  if (!payer || !members.has(payer)) {
    throw new Error(`پرداخت‌کننده «${payer || '—'}» عضو این گروه نیست.`);
  }

  const participants = [...new Set(input.participants.map((p) => p.trim()).filter(Boolean))];
  if (participants.length === 0) {
    throw new Error('حداقل یک شرکت‌کننده برای خرج دنگ لازم است.');
  }
  const unknown = participants.filter((p) => !members.has(p));
  if (unknown.length > 0) {
    throw new Error(`این افراد عضو گروه نیستند: ${unknown.join('، ')}`);
  }

  return {
    title: input.title.trim() || 'خرج مشترک دنگ',
    payer,
    amount,
    participants,
  };
}

/** اسم‌های تکراری در لیست اعضا باعث می‌شوند تسویه دوبار حساب شود؛ قبل از ذخیره رد می‌شوند. */
export function findDuplicateNames(names: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const raw of names) {
    const n = raw.trim();
    if (!n) continue;
    if (seen.has(n)) dup.add(n);
    seen.add(n);
  }
  return [...dup];
}
