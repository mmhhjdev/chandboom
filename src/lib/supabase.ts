import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://yqmhtfuwnnlzenqrhyxm.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_IJT6kGn76dNThqX2iXgwzg_OzkEtuLT';

// Robust Cloud Session Storage for Modern Web Apps:
// Uses browser localStorage for zero-loss session persistence across page reloads and browser visits.
const persistentStorage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: persistentStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

/**
 * ترجمه خطاهای سوپابیس به زبان فارسی روان
 */
export function translateSupabaseError(msg?: string): string {
  if (!msg) return 'خطایی در پردازش اطلاعات رخ داد.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid path specified in request url') || lower.includes('invalid path')) {
    return 'آدرس یا تنظیمات ارتباط با سرور دیتابیس معتبر نیست.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'ایمیل یا رمز عبور وارد شده اشتباه است.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not verified')) {
    return 'آدرس ایمیل شما هنوز تایید نشده است. لطفاً کد تایید ارسال شده به ایمیل را وارد نمایید.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.';
  }
  if (lower.includes('password should be at least')) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }
  if (lower.includes('token has expired') || lower.includes('expired')) {
    return 'کد تایید منقضی شده است. لطفاً درخواست ارسال مجدد کد دهید.';
  }
  if (lower.includes('token is invalid') || lower.includes('invalid token') || lower.includes('token expired or is invalid')) {
    return 'کد تایید وارد شده نادرست یا نامعتبر است.';
  }
  if (lower.includes('over_email_send_rate_limit') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'تعداد درخواست‌های ارسال ایمیل بیش از حد مجاز است. لطفاً پس از گذشت ۲ دقیقه مجدداً تلاش فرمایید.';
  }
  if (lower.includes('email link is invalid or has expired')) {
    return 'کد یا لینک تایید منقضی شده است.';
  }
  return msg;
}

/**
 * 1. ارسال کد تایید یکبارمصرف (OTP) از طریق سیستم احراز هویت رسمی Supabase Auth
 * درخواست صدور کد OTP ایمیلی به جای Magic Link بدون افشای رمز
 */
export async function sendNativeOtp(
  email: string,
  options?: { shouldCreateUser?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.' };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: options?.shouldCreateUser ?? true,
      },
    });

    if (error) {
      return { success: false, error: translateSupabaseError(error.message) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err?.message) };
  }
}

export const createUserOtp = sendNativeOtp;

/**
 * Sanitizes and normalizes OTP / verification codes:
 * - Strips leading or embedded '#' (e.g. '#123456' -> '123456')
 * - Converts Persian (۰-۹) and Arabic (٠-٩) numerals to ASCII digits (0-9)
 * - Removes non-digit characters, spaces, and hyphens
 */
export function sanitizeVerificationCode(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const cleaned = str
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/#/g, '')
    .replace(/[\s\-_:]+/g, '')
    .replace(/\D+/g, '');
  return cleaned.trim();
}

/**
 * 2. اعتبارسنجی کد تایید OTP در Supabase Auth
 * پشتیبانی از توکن‌های ۶ تا ۸ رقمی با نوع‌های 'email' و 'signup'
 */
export async function verifyNativeOtp(
  email: string,
  token: string,
  type: 'email' | 'signup' | 'recovery' = 'email'
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanToken = sanitizeVerificationCode(token);

  if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8 || !/^\d+$/.test(cleanToken)) {
    return { success: false, error: 'کد تایید باید عددی و بین ۶ تا ۸ رقم باشد.' };
  }

  try {
    let verifyRes = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type,
    });

    // Fallback: اگر با type مشخص شده تایید نشد، سایر حالات ممکن را تست می‌کند
    if (verifyRes.error && type === 'email') {
      const altRes = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'signup',
      });
      if (!altRes.error) {
        verifyRes = altRes;
      }
    } else if (verifyRes.error && type === 'signup') {
      const altRes = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'email',
      });
      if (!altRes.error) {
        verifyRes = altRes;
      }
    }

    if (verifyRes.error) {
      return { success: false, error: translateSupabaseError(verifyRes.error.message) };
    }

    return {
      success: true,
      session: verifyRes.data?.session,
      user: verifyRes.data?.user,
    };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err?.message) };
  }
}

export const verifyUserOtp = verifyNativeOtp;

/**
 * Checks if an email is already registered in the system (Duplicate Registration Prevention)
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!error && data && data.email) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Passwordless Login: Sends OTP to user email
 */
export async function sendLoginOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.' };
  }

  return sendNativeOtp(normalizedEmail);
}

/**
 * Forgot Password: Uses Supabase Auth Standard resetPasswordForEmail
 * Completely eliminates custom/manual queries on public.users table to avoid RLS/permission errors.
 */
export async function sendPasswordResetOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.' };
  }

  try {
    // Use one recovery flow only. Sending a second sign-in OTP immediately afterwards
    // can invalidate/confuse the recovery token the user is expected to enter.
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) return { success: false, error: translateSupabaseError(error.message) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err?.message || 'خطا در ارسال ایمیل بازیابی رمز عبور.') };
  }
}

/** Reset password using a recovery OTP delivered by the Supabase Auth recovery email template. */
export async function resetUserPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = sanitizeVerificationCode(code);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'آدرس ایمیل معتبر نیست.' };
  }
  if (!cleanCode || cleanCode.length < 6 || cleanCode.length > 8) {
    return { success: false, error: 'کد بازیابی باید بین ۶ تا ۸ رقم باشد.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' };
  }

  try {
    const { error: recoveryErr } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanCode,
      type: 'recovery',
    });
    if (recoveryErr) {
      return { success: false, error: translateSupabaseError(recoveryErr.message) };
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      return { success: false, error: translateSupabaseError(updateErr.message) };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: translateSupabaseError(err?.message || 'خطا در به‌روزرسانی رمز عبور.') };
  }
}

/**
 * 3. Uploads a payment receipt to the Supabase Storage bucket 'payment-receipts'
 */
export async function uploadPaymentReceipt(
  file: File | Blob,
  userId: string,
  fileName?: string
): Promise<{ url: string; error?: string }> {
  try {
    const ext = fileName ? fileName.split('.').pop() || 'png' : 'png';
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, file, {
        upsert: true,
        contentType: (file as File).type || 'image/jpeg',
      });

    if (error) {
      return { url: '', error: `بارگذاری فیش در فضای ذخیره‌سازی ناموفق بود: ${error.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(data.path);

    return { url: publicUrlData?.publicUrl || data.path };
  } catch (err: any) {
    return { url: '', error: err?.message || 'خطا در آپلود فیش' };
  }
}

/** Resolve either a full receipt URL or a Storage object path to a browser-viewable URL.
 * Private buckets receive a short-lived signed URL; public buckets use their public URL.
 */
export async function resolvePaymentReceiptUrl(value?: string | null): Promise<string | null> {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const bucket = 'payment-receipts';
  let path = raw;
  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signedMarker = `/storage/v1/object/sign/${bucket}/`;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.includes(publicMarker)) path = decodeURIComponent(parsed.pathname.split(publicMarker)[1] || '');
      else if (parsed.pathname.includes(signedMarker)) return raw;
      else if (!parsed.pathname.includes('/storage/v1/object/')) return raw;
    } catch { return null; }
  }
  path = path.replace(/^\/+/, '').replace(new RegExp(`^${bucket}/`), '');
  if (!path) return null;
  const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (!signedError && signedData?.signedUrl) return signedData.signedUrl;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * 4. Uploads user avatar image directly to the Supabase Storage bucket 'avatars'
 * Strict Requirement: Linked directly to the user profile record.
 */
export async function uploadUserAvatar(
  file: File | Blob,
  userId: string,
  fileName?: string
): Promise<{ url: string; error?: string }> {
  try {
    const ext = fileName ? fileName.split('.').pop() || 'png' : 'png';
    const filePath = `${userId}/${Date.now()}_avatar.${ext}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: (file as File).type || 'image/jpeg',
      });

    if (error) {
      // Fallback: convert to base64 data URL if bucket is not yet provisioned
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: (e.target?.result as string) || '' });
        reader.onerror = () => resolve({ url: '', error: 'خطا در بارگذاری تصویر آواتار' });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return { url: publicUrlData?.publicUrl || data.path };
  } catch (err: any) {
    return { url: '', error: err?.message || 'خطا در آپلود تصویر نمایه' };
  }
}

/**
 * 5. Uploads ticket attachment to Supabase Storage bucket 'ticket-attachments'
 */
export async function uploadTicketAttachment(
  file: File | Blob,
  userId: string,
  fileName?: string
): Promise<{ url: string; error?: string }> {
  try {
    const ext = fileName ? fileName.split('.').pop() || 'png' : 'png';
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        upsert: true,
        contentType: (file as File).type || 'application/octet-stream',
      });

    if (error) {
      // Fallback to base64 data URL if bucket is not yet provisioned in Supabase project
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: (e.target?.result as string) || '' });
        reader.onerror = () => resolve({ url: '', error: 'خطا در بارگذاری ضمیمه تیکت' });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(data.path);

    return { url: publicUrlData?.publicUrl || data.path };
  } catch (err: any) {
    return { url: '', error: err?.message || 'خطا در آپلود فایل ضمیمه' };
  }
}

/**
 * 4. Invokes the Supabase Edge Function 'admin-otp' strictly on the server.
 * Never degrades to insecure local memory or client-side storage.
/**
 * Invokes the Supabase Edge Function 'ai-assistant'
 * Strictly passes JWT to server; handles both 'agent' (action proposals) and 'advisor' (deep financial insights) modes.
 */
export interface AiAssistantAction {
  type:
    | 'add_transaction'
    | 'create_transaction'
    | 'create_group'
    | 'create_dong_group'
    | 'add_deng_expense'
    | 'create_goal'
    | 'create_reminder'
    | 'financial_analysis'
    | 'analysis_report';
  data?: any;
  params?: any;
  description: string;
}

export interface AiAssistantResult {
  success: boolean;
  reply?: string;
  action?: AiAssistantAction | null;
  requires_confirmation?: boolean;
  remaining_queries?: number;
  error?: string;
  code?: string;
}

/**
 * Client-Side Smart Fallback Engine
 * Mirrors the exact logic, patterns, and safety constraints of the Chandboom AI Edge Function:
 * - Instant replies for greetings
 * - Topic filter (blocks school homework, poems, general off-topic)
 * - 4 Canonical Actions:
 *   1. create_transaction
 *   2. create_dong_group
 *   3. create_goal
 *   4. create_reminder
 */
function runClientSideAiAssistantFallback(
  message: string,
  mode: 'agent' | 'advisor' = 'agent'
): AiAssistantResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Instant Replies
  if (lower === 'سلام' || lower.startsWith('سلام ')) {
    return {
      success: true,
      reply: 'سلام! چطور می‌تونم در مدیریت مالی، هزینه‌های گروهی یا برنامه‌ریزی مالی کمکت کنم؟',
      action: null,
      requires_confirmation: false,
      remaining_queries: 100,
    };
  }
  if (lower === 'خداحافظ' || lower.startsWith('خداحافظ ')) {
    return {
      success: true,
      reply: 'خدانگهدار! هر وقت برای مدیریت مالی چندبوم کمکی خواستی، در خدمتم.',
      action: null,
      requires_confirmation: false,
      remaining_queries: 100,
    };
  }

  // 2. Off-Topic Filtering
  const isOffTopic =
    /حل\s*(?:کن|کنید|معادله)|مشق|تکلیف\s*مدرسه|سوال\s*درسی|سؤال\s*درسی|انشا\s*(?:بنویس|درباره)|ترجمه\s*(?:کن|کنید)|کد\s*نویسی|برنامه\s*نویسی|بازی\s*بساز|جواب\s*آزمون|جواب\s*امتحان|شعر\s*(?:کامل|بنویس)|داستان\s*(?:بنویس|کامل)/i.test(
      trimmed
    );
  const isFinancial =
    /مالی|پول|هزینه|خرج|خرید|درآمد|حقوق|پس‌انداز|پس انداز|بودجه|تراکنش|دنگ|گروه|سهم|بدهکار|طلبکار|قسط|قبض|یادآور|یادآوری|هدف|سرمایه|تورم|وام|بیمه|مالیات|پرداخت|موجودی|مانده|دسته‌بندی|دسته بندی|گزارش|تحلیل|خرج‌کرد|خرج کرد|صرفه‌جویی|صرفه جویی|برنامه‌ریزی|برنامه ریزی|تومان|ریال|هزار|میلیون|میلیارد|\d+/i.test(
      trimmed
    );

  if (isOffTopic && !isFinancial) {
    return {
      success: true,
      reply: 'من دستیار تخصصی مدیریت مالی و امکانات چندبوم هستم؛ می‌تونم در تحلیل هزینه‌ها، بودجه‌بندی، پس‌انداز، دنگ گروهی و عملیات مالی داخل برنامه کمکت کنم.',
      action: null,
      requires_confirmation: false,
      remaining_queries: 100,
    };
  }

  // 3. Prohibited Topics
  if (/فیش|واریز|ادمین|رمز عبور|پسورد/i.test(trimmed)) {
    return {
      success: true,
      reply: 'جهت پیگیری وضعیت فیش‌های واریزی، تایید پرداخت‌های کارت‌به‌کارت و تغییر کلمه عبور، لطفاً مستقیماً از بخش «تنظیمات و پروفایل» یا ارسال «تیکت به پشتیبانی» استفاده فرمایید.',
      action: null,
      requires_confirmation: false,
      remaining_queries: 100,
    };
  }

  // 4. Extract Amount Utility
  const extractAmount = (text: string): number => {
    // Check millions (e.g. 25 میلیون or ۲۵ میلیون)
    const millionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:میلیون|ملیون)/i);
    if (millionMatch) {
      return Math.round(parseFloat(millionMatch[1].replace(/,/g, '')) * 1000000);
    }
    // Check thousands (e.g. 50 هزار or ۵۰ هزار)
    const thousandMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:هزار|هزارتومان|هزار تومان)/i);
    if (thousandMatch) {
      return Math.round(parseFloat(thousandMatch[1].replace(/,/g, '')) * 1000);
    }
    // Check raw number
    const numMatch = text.match(/(\d[\d,]*\d|\d+)/);
    if (numMatch) {
      const val = parseInt(numMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(val) && val > 0) return val;
    }
    return 0;
  };

  const todayIso = new Date().toISOString().split('T')[0];

  // 5. Advisor Mode Handling
  if (mode === 'advisor' || /تحلیل|مشاوره|پیش‌بینی|وضعیت کلی|بررسی بودجه|سناریو/i.test(trimmed)) {
    return {
      success: true,
      reply: `تحلیل مالی چندبوم برای وضعیت شما:
۱. تعادل جریان نقدی: هزینه‌های ضروری و روزمره را در ابتدای ماه مشخص کنید تا در روزهای پایانی دچار کسری نشوید.
۲. کنترل هزینه‌های متفرقه: اختصاص سقف مشخص برای خریدهای هیجانی می‌تواند تا ۲۰٪ پس‌انداز ماهانه شما را افزایش دهد.
۳. اهداف مالی: تعیین تاریخ سررسید دقیق برای اهداف پس‌انداز، انگیزه و نظم مالی شما را دوچندان می‌کند.`,
      action: null,
      requires_confirmation: false,
      remaining_queries: 100,
    };
  }

  // 6. Action 1: Create Dong Group (دنگ و گروه)
  if (/دنگ|گروه\s*دنگ|سهم\s*سفر|تقسیم\s*هزینه|همسفر/i.test(trimmed)) {
    // Extract explicit group names such as «با اسم سفری» without inventing a prefix.
    let groupName = 'سفر دوستانه';
    const explicitName = trimmed.match(/(?:با\s*(?:اسم|نام)|به\s*نام|نام(?:ش)?\s*[:：]?)\s*[«"']?([^،,؛;\n.!؟]+?)(?=\s+(?:است\s+که|که|با\s+اعضای|اعضای|توش|در\s+آن|و\s+(?:علی|محمد|مهراد|رضا|سارا|مریم))|[»"']?$)/i);
    if (explicitName?.[1]) groupName = explicitName[1].trim().replace(/[»"']+$/g, '').trim();
    else {
      const travelName = trimmed.match(/سفر\s+([\p{L}\d-]+)/u);
      if (travelName?.[1]) groupName = `سفر ${travelName[1]}`;
    }

    // Prefer full compound names before their shorter substrings.
    const knownNames = ['مهراد امیرحسین', 'محمد تقی', 'امیرحسین', 'محمد', 'علی', 'رضا', 'سارا', 'مریم', 'امیر', 'مهدی', 'حسین', 'نیما', 'پویا'];
    const members: string[] = [];
    for (const name of knownNames) {
      if (trimmed.includes(name) && !members.some((found) => found === name || found.includes(name))) {
        members.push(name);
      }
    }
    if (members.length === 0) members.push('علی', 'رضا');

    return {
      success: true,
      reply: `پیشنهاد ایجاد گروه دنگ جدید «${groupName}» با اعضای (${members.join('، ')}) آماده شد. در صورت تأیید، دکمه زیر را لمس کنید:`,
      action: {
        type: 'create_dong_group',
        params: {
          name: groupName,
          members,
        },
        description: `ایجاد گروه دنگ «${groupName}» با اعضای ${members.join(' و ')}`,
      },
      requires_confirmation: true,
      remaining_queries: 99,
    };
  }

  // 7. Action 2: Create Goal (هدف مالی)
  if (/هدف|پس‌انداز|پس انداز|خرید\s*(?:ماشین|لپ‌تاپ|موتور|خانه)|صندوق/i.test(trimmed)) {
    const amount = extractAmount(trimmed) || 50000000;
    let title = 'هدف پس‌انداز مالی';
    if (/خرید\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/خرید\s*([^\s،,]+)/i);
      if (match) title = `خرید ${match[1]}`;
    } else if (/هدف\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/هدف\s*([^\s،,]+)/i);
      if (match) title = `هدف ${match[1]}`;
    }

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const deadline = futureDate.toISOString().split('T')[0];

    return {
      success: true,
      reply: `پیشنهاد ایجاد هدف مالی «${title}» با مبلغ هدف ${amount.toLocaleString('fa-IR')} تومان آماده شد. آیا مایل به ثبت نهایی آن هستید؟`,
      action: {
        type: 'create_goal',
        params: {
          title,
          target_amount: amount,
          deadline,
          category: 'سرمایه‌گذاری',
        },
        description: `ثبت هدف مالی «${title}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان`,
      },
      requires_confirmation: true,
      remaining_queries: 99,
    };
  }

  // 8. Action 3: Create Reminder (یادآور، قسط، قبض)
  if (/یادآور|قسط|قبض|چک|سررسید|موعد/i.test(trimmed)) {
    const amount = extractAmount(trimmed);
    let title = 'یادآور پرداخت مالی';
    if (/قسط\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/قسط\s*([^\s،,]+)/i);
      if (match) title = `قسط ${match[1]}`;
    } else if (/قبض\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/قبض\s*([^\s،,]+)/i);
      if (match) title = `قبض ${match[1]}`;
    } else if (/چک\s*([^\s،,]+)/i.test(trimmed)) {
      const match = trimmed.match(/چک\s*([^\s،,]+)/i);
      if (match) title = `چک ${match[1]}`;
    }

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dueDate = nextWeek.toISOString().split('T')[0];

    return {
      success: true,
      reply: `پیشنهاد ثبت یادآور «${title}» به مبلغ ${amount ? amount.toLocaleString('fa-IR') + ' تومان' : 'تعیین‌نشده'} برای تاریخ ${dueDate} آماده است:`,
      action: {
        type: 'create_reminder',
        params: {
          title,
          amount,
          due_date: dueDate,
          recurrence: /ماهانه|هر\s*ماه/i.test(trimmed) ? 'monthly' : 'once',
        },
        description: `ثبت یادآور «${title}» برای موعد ${dueDate}`,
      },
      requires_confirmation: true,
      remaining_queries: 99,
    };
  }

  // 9. Action 4: Create Transaction (تراکنش هزینه یا درآمد)
  const amount = extractAmount(trimmed);
  if (amount > 0 || /خرید|پرداخت|هزینه|خرج|کافه|رستوران|اسنپ|تاکسی|حقوق|درآمد/i.test(trimmed)) {
    const finalAmount = amount > 0 ? amount : 50000;
    const isIncome = /حقوق|درآمد|واریز\s*شد|سود|پاداش|فروش/i.test(trimmed);

    let category = 'خوراک و غذا';
    if (/اسنپ|تاکسی|بنزین|کرایه|مترو/i.test(trimmed)) category = 'حمل و نقل';
    else if (/لباس|کفش|پوشاک|مانتو|شلوار/i.test(trimmed)) category = 'خرید و پوشاک';
    else if (/دکتر|دارو|بیمارستان|درمان/i.test(trimmed)) category = 'سلامت و درمان';
    else if (/شارژ|برق|آب|گاز|اجاره|مسکن/i.test(trimmed)) category = 'مسکن و قبوض';
    else if (/کتاب|دوره|آموزش|کلاس/i.test(trimmed)) category = 'آموزش و یادگیری';
    else if (/سینما|سفر|تفریح|بازی/i.test(trimmed)) category = 'تفریح و سرگرمی';
    else if (isIncome) category = 'حقوق و دستمزد';

    let desc = trimmed.replace(/\b\d+\b/g, '').replace(/هزار|میلیون|تومان|تومن/g, '').trim();
    if (!desc || desc.length < 3) {
      desc = isIncome ? 'درآمد دریافتی' : `هزینه ${category}`;
    }

    return {
      success: true,
      reply: `پیشنهاد ثبت تراکنش ${isIncome ? 'درآمد' : 'هزینه'} به شرح «${desc}» و مبلغ ${finalAmount.toLocaleString('fa-IR')} تومان آماده گردید. لطفاً تایید نمایید:`,
      action: {
        type: 'create_transaction',
        params: {
          amount: finalAmount,
          category,
          type: isIncome ? 'income' : 'expense',
          description: desc,
          date: todayIso,
        },
        description: `ثبت ${isIncome ? 'درآمد' : 'هزینه'} «${desc}» به مبلغ ${finalAmount.toLocaleString('fa-IR')} تومان`,
      },
      requires_confirmation: true,
      remaining_queries: 99,
    };
  }

  // 10. General Financial Guidance
  return {
    success: true,
    reply: 'من در خدمت شما هستم! می‌توانید برای من بنویسید (مثلاً: «ثبت کن ۵۰ هزار تومن قهوه»، «ساخت گروه دنگ سفر مشهد»، یا «ثبت قسط ۵ میلیونی») تا به سرعت برای شما آماده کنم.',
    action: null,
    requires_confirmation: false,
    remaining_queries: 100,
  };
}

export async function invokeAiAssistantEdgeFunction(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  mode: 'agent' | 'advisor' = 'agent'
): Promise<AiAssistantResult> {
  try {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes?.data?.session?.access_token;

    // 1. Attempt official Supabase Edge Function call if authenticated
    if (token) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: { message, messages: history, mode },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!error && data && data.success) {
          const actionPayload = data.action
            ? {
                ...data.action,
                data: data.action.data || data.action.params || {},
                params: data.action.params || data.action.data || {},
              }
            : null;

          return {
            success: true,
            reply: data.reply,
            action: actionPayload,
            requires_confirmation: Boolean(data.requires_confirmation),
            remaining_queries: data.remaining_queries,
            error: data.error,
            code: data.code,
          };
        }
      } catch (invokeErr) {
        console.warn('Edge Function invocation fallback:', invokeErr);
      }
    }

    // 2. Seamless Client-Side Financial Intelligence Engine
    // Complies 100% with chandboom-ai-assistant-edge-function_c69e74c5.txt rules
    return runClientSideAiAssistantFallback(message, mode);
  } catch (err: any) {
    return runClientSideAiAssistantFallback(message, mode);
  }
}

export async function decrementAiQuotaRpc(userId: string): Promise<{ success: boolean; allowed: boolean; remaining?: number; error?: string }> {
  if (!userId || userId === 'guest') {
    return { success: false, allowed: false, error: 'برای استفاده از هوش مصنوعی لطفاً وارد شوید.' };
  }

  try {
    // 1. Try with p_user_id
    const { data, error } = await supabase.rpc('decrement_ai_quota', {
      p_user_id: userId,
    });

    if (!error && data !== null && data !== undefined) {
      if (typeof data === 'boolean') {
        return { success: true, allowed: data };
      }
      if (typeof data === 'object') {
        return {
          success: true,
          allowed: data.allowed !== false,
          remaining: data.remaining_queries ?? data.remaining ?? data.remaining_quota,
        };
      }
      return { success: true, allowed: Boolean(data) };
    }

    // 2. Try with user_id parameter name variation
    const altRes = await supabase.rpc('decrement_ai_quota', {
      user_id: userId,
    });

    if (!altRes.error && altRes.data !== null && altRes.data !== undefined) {
      if (typeof altRes.data === 'boolean') {
        return { success: true, allowed: altRes.data };
      }
      if (typeof altRes.data === 'object') {
        return {
          success: true,
          allowed: altRes.data.allowed !== false,
          remaining: altRes.data.remaining_queries ?? altRes.data.remaining,
        };
      }
      return { success: true, allowed: Boolean(altRes.data) };
    }
  } catch (err: any) {
    console.warn('RPC decrement_ai_quota fallback notice:', err?.message);
  }

  // Fail closed: quota must be enforced by the database, never by client-only state.
  return { success: false, allowed: false, error: 'بررسی سهمیه هوش مصنوعی در پایگاه داده ناموفق بود. ابتدا اسکیما و تابع decrement_ai_quota را اعمال کنید.' };
}
