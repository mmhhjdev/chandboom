/**
 * Utility functions for Persian digits, currency, and date formatting
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function toEnglishDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  let str = String(value);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return str;
}

export function formatToman(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '۰ تومان';
  const num = typeof amount === 'string' ? parseInt(toEnglishDigits(amount).replace(/,/g, ''), 10) : amount;
  if (isNaN(num)) return '۰ تومان';
  const formatted = num.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatCardNumber(card: string): string {
  const clean = toEnglishDigits(card).replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.map(toPersianDigits).join(' - ');
}

export function formatShamsiDate(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'امروز';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatter.format(d);
  } catch {
    return isoDateStr;
  }
}

export function formatShamsiDateTime(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'امروز';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(d);
  } catch {
    return isoDateStr;
  }
}

/**
 * Standard astronomical Jalali <-> Gregorian conversion algorithms (deterministic, no external dependencies)
 */
export function jalaliToGregorian(j_y: number, j_m: number, j_d: number): [number, number, number] {
  j_y = j_y - 979;
  j_m = j_m - 1;
  j_d = j_d - 1;

  let j_day_no = 365 * j_y + Math.floor(j_y / 33) * 8 + Math.floor(((j_y % 33) + 3) / 4);
  for (let i = 0; i < j_m; ++i) {
    j_day_no += i < 6 ? 31 : 30;
  }
  j_day_no += j_d;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;

  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  const g_days_in_month = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (; gm < 12; ++gm) {
    const v = g_days_in_month[gm];
    if (g_day_no < v) break;
    g_day_no -= v;
  }
  return [gy, gm + 1, g_day_no + 1];
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_days_in_month = [
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const gy2 = gy - 1600;
  const gm2 = gm - 1;
  const gd2 = gd - 1;

  let g_day_no =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm2; ++i) g_day_no += g_days_in_month[i];
  g_day_no += gd2;

  let j_day_no = g_day_no - 79;
  const j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jm = 0;
  for (; jm < 11 && j_day_no >= j_days_in_month[jm]; ++jm) {
    j_day_no -= j_days_in_month[jm];
  }
  return [jy, jm + 1, j_day_no + 1];
}

/**
 * Formats any ISO date or Date object to a clean Shamsi string "YYYY/MM/DD"
 */
export function formatToShamsiInput(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) {
    const now = new Date();
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  }
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return formatToShamsiInput(null);
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  } catch {
    return '1403/01/01';
  }
}

/**
 * Parses a Shamsi date string (e.g. "1403/08/15" or "1402-11-20") with Persian or English digits,
 * and converts it into a valid JavaScript Date object in Gregorian UTC.
 * Returns null if invalid.
 */
export function parseShamsiDate(shamsiStr?: string | null): Date | null {
  if (!shamsiStr) return null;
  const clean = toEnglishDigits(shamsiStr).trim().replace(/-/g, '/');
  const parts = clean.split('/').map((p) => parseInt(p, 10));
  if (parts.length !== 3) return null;

  const [jy, jm, jd] = parts;
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  if (jy < 1300 || jy > 1500) return null;
  if (jm < 1 || jm > 12) return null;
  if (jd < 1 || jd > 31) return null;

  try {
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
    // Set to 12:00:00 UTC to prevent local timezone shifts from rolling over to adjacent day
    const d = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

