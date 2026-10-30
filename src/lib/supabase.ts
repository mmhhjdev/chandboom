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

export async function invokeAiAssistantEdgeFunction(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  mode: 'agent' | 'advisor' = 'agent'
): Promise<AiAssistantResult> {
  try {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes?.data?.session?.access_token;
    if (!token) {
      return {
        success: false,
        error: 'برای استفاده از دستیار هوشمند، ابتدا وارد حساب کاربری خود شوید.',
        code: 'AUTH_REQUIRED',
      };
    }

    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: { message, messages: history, mode },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      // Supabase returns non-2xx Edge Function responses as FunctionsHttpError.
      // Read its response body so quota/auth/subscription codes reach every UI entry point.
      let serverError: any = null;
      try {
        serverError = await (error as any).context?.json?.();
      } catch {
        serverError = null;
      }
      console.error('AI Edge Function request failed:', error);
      return {
        success: false,
        error: serverError?.error || error.message || 'ارتباط امن با سرویس هوش مصنوعی برقرار نشد.',
        code: serverError?.code || 'EDGE_FUNCTION_ERROR',
        remaining_queries: typeof serverError?.remaining_queries === 'number'
          ? serverError.remaining_queries
          : undefined,
      };
    }

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'پاسخ سرور هوش مصنوعی معتبر نیست.',
        code: 'INVALID_AI_RESPONSE',
      };
    }

    const actionPayload = data.action
      ? {
          ...data.action,
          data: data.action.data || data.action.params || {},
          params: data.action.params || data.action.data || {},
        }
      : null;

    return {
      success: Boolean(data.success),
      reply: data.reply,
      action: actionPayload,
      requires_confirmation: Boolean(data.requires_confirmation),
      remaining_queries: data.remaining_queries,
      error: data.error,
      code: data.code,
    };
  } catch (err: any) {
    console.error('AI Edge Function invocation error:', err);
    return {
      success: false,
      error: err?.message || 'سرویس هوش مصنوعی موقتاً در دسترس نیست.',
      code: 'EDGE_FUNCTION_ERROR',
    };
  }
}
