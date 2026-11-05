/**
 * موتور تسویه‌حساب گروه دنگ چندبوم
 *
 * اصول:
 * 1) همه محاسبات با عدد صحیح (تومان) انجام می‌شود؛ گرد کردن با روش «بزرگ‌ترین باقی‌مانده»
 *    تضمین می‌کند جمع سهم‌ها دقیقاً برابر مبلغ کل باشد و هیچ ریالی گم نشود.
 * 2) پرداخت‌کننده همیشه بستانکار مبلغ کامل است و سهم خودش هم از بستانکاری کم می‌شود
 *    (کسی که پول داده، سهم خودش را هم دارد).
 * 3) اسم ناشناخته (عضو حذف‌شده، تغییر نام، اسم تکراری) هرگز بی‌صدا حذف نمی‌شود؛
 *    در فهرست issues گزارش می‌شود تا کاربر ببیند.
 */

export interface SettlementBillItem {
  price: number;
  consumers: string[];
}

export interface SettlementExpense {
  title?: string;
  payer: string;
  amount: number;
  participants: string[];
  isItemized?: boolean;
  billItems?: SettlementBillItem[];
}

export interface SettlementFamily {
  name: string;
  count: number;
}

export interface SettlementInput {
  members: string[];
  families?: SettlementFamily[] | null;
  isFamilyMode?: boolean;
  expenses: SettlementExpense[];
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementResult {
  transfers: SettlementTransfer[];
  balances: Record<string, number>;
  issues: string[];
}

interface Weighted {
  name: string;
  weight: number;
}

/**
 * تقسیم عدد صحیح total بین افراد بر اساس وزن، با روش بزرگ‌ترین باقی‌مانده.
 * خروجی همیشه جمعش دقیقاً برابر total است.
 */
export function splitProportionally(total: number, parts: Weighted[]): Map<string, number> {
  const result = new Map<string, number>();
  const valid = parts.filter((p) => p.weight > 0);
  const totalWeight = valid.reduce((sum, p) => sum + p.weight, 0);
  if (valid.length === 0 || totalWeight === 0 || total <= 0) return result;

  const rows = valid.map((p) => {
    const exact = (total * p.weight) / totalWeight;
    const floor = Math.floor(exact);
    return { name: p.name, floor, fraction: exact - floor };
  });

  let remainder = total - rows.reduce((sum, r) => sum + r.floor, 0);
  const order = [...rows].sort((a, b) => b.fraction - a.fraction || a.name.localeCompare(b.name));
  for (const row of order) {
    if (remainder <= 0) break;
    row.floor += 1;
    remainder -= 1;
  }

  for (const row of rows) {
    result.set(row.name, (result.get(row.name) ?? 0) + row.floor);
  }
  return result;
}

export function computeSettlement(input: SettlementInput): SettlementResult {
  const issues: string[] = [];
  const isFamily = Boolean(input.isFamilyMode);
  // Rows from the database can be missing fields (null / older schema). Never assume arrays.
  const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
  const members = asArray(input.members);
  const expensesList = asArray(input.expenses);

  const families = asArray(input.families);
  const familyWeight = new Map<string, number>();
  families.forEach((f) => familyWeight.set(f.name, Math.max(1, Math.floor(Number(f.count) || 1))));

  const entities = isFamily ? families.map((f) => f.name) : members;
  const entitySet = new Set(entities);

  const balances: Record<string, number> = {};
  entities.forEach((name) => {
    balances[name] = 0;
  });

  const weightOf = (name: string): number => (isFamily ? familyWeight.get(name) ?? 0 : 1);
  const unique = (list: string[] | null | undefined) =>
    Array.from(new Set(asArray(list).map((n) => String(n).trim()).filter(Boolean)));

  expensesList.forEach((exp, index) => {
    const label = exp.title?.trim() ? `«${exp.title.trim()}»` : `هزینه ${index + 1}`;

    if (!entitySet.has(exp.payer)) {
      issues.push(`${label}: پرداخت‌کننده «${exp.payer}» در لیست اعضای گروه نیست؛ این هزینه در محاسبه لحاظ نشد.`);
      return;
    }

    // مبلغ کل هزینه: برای فاکتور تفکیک‌شده، جمع اقلام ملاک است تا بدهی‌ها با پرداخت هماهنگ بمانند.
    const items = asArray(exp.billItems);
    const itemized = Boolean(exp.isItemized && items.length > 0);
    let total = Math.round(Number(exp.amount) || 0);
    const allocations = new Map<string, number>();

    if (itemized) {
      const itemsTotal = items.reduce((sum, item) => sum + Math.round(Number(item.price) || 0), 0);
      if (itemsTotal !== total) {
        issues.push(`${label}: جمع اقلام (${itemsTotal.toLocaleString('en-US')}) با مبلغ ثبت‌شده (${total.toLocaleString('en-US')}) برابر نیست؛ جمع اقلام ملاک محاسبه شد.`);
      }
      total = itemsTotal;

      for (const item of items) {
        const price = Math.round(Number(item.price) || 0);
        if (price <= 0) continue;
        const consumers = unique(item.consumers);
        const known = consumers.filter((c) => entitySet.has(c));
        const unknown = consumers.filter((c) => !entitySet.has(c));
        if (unknown.length) {
          issues.push(`${label}: مصرف‌کننده «${unknown.join('، ')}» در گروه پیدا نشد.`);
        }
        if (known.length === 0) {
          issues.push(`${label}: یکی از اقلام مصرف‌کننده معتبری ندارد و سهمی از آن محاسبه نشد.`);
          continue;
        }
        splitProportionally(price, known.map((name) => ({ name, weight: weightOf(name) })))
          .forEach((share, name) => allocations.set(name, (allocations.get(name) ?? 0) + share));
      }
    } else {
      if (total <= 0) {
        issues.push(`${label}: مبلغ نامعتبر است و نادیده گرفته شد.`);
        return;
      }
      const participants = unique(exp.participants);
      const known = participants.filter((p) => entitySet.has(p));
      const unknown = participants.filter((p) => !entitySet.has(p));
      if (unknown.length) {
        issues.push(`${label}: شرکت‌کننده «${unknown.join('، ')}» در گروه پیدا نشد.`);
      }
      if (known.length === 0) {
        issues.push(`${label}: هیچ شرکت‌کننده معتبری ندارد و محاسبه نشد.`);
        return;
      }
      splitProportionally(total, known.map((name) => ({ name, weight: weightOf(name) })))
        .forEach((share, name) => allocations.set(name, share));
    }

    if (total <= 0 || allocations.size === 0) return;

    balances[exp.payer] += total;
    allocations.forEach((share, name) => {
      balances[name] -= share;
    });
  });

  // تسویه حداقلی: بدهکارها را به بستانکارها وصل می‌کند.
  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];
  Object.entries(balances).forEach(([name, value]) => {
    const rounded = Math.round(value);
    if (rounded < 0) debtors.push({ name, amount: -rounded });
    else if (rounded > 0) creditors.push({ name, amount: rounded });
  });

  const byAmountThenName = (a: { name: string; amount: number }, b: { name: string; amount: number }) =>
    b.amount - a.amount || a.name.localeCompare(b.name);
  debtors.sort(byAmountThenName);
  creditors.sort(byAmountThenName);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > 0) transfers.push({ from: debtor.name, to: creditor.name, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return { transfers, balances, issues };
}
