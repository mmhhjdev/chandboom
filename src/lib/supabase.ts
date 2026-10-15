import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
 * 2. اعتبارسنجی کد تایید OTP در Supabase Auth
 */
export async function verifyNativeOtp(
  email: string,
  token: string,
  type: 'email' | 'signup' | 'recovery' = 'email'
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();

  if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8 || !/^\d+$/.test(cleanToken)) {
    return { success: false, error: 'کد تایید باید عددی و بین ۶ تا ۸ رقم باشد.' };
  }

  try {
    let verifyRes = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type,
    });

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
 * بررسی وجود ایمیل در سیستم
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
 * ورود با رمز عبور موقت (OTP)
 */
export async function sendLoginOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.' };
  }

  return sendNativeOtp(normalizedEmail);
}

/**
 * بازیابی رمز عبور
 */
export async function sendPasswordResetOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.' };
  }

  try {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      console.warn('Supabase resetPasswordForEmail returned error:', error.message);
      return { success: false, error: error.message || 'خطا در ارسال ایمیل بازیابی رمز عبور.' };
    }

    try {
      await sendNativeOtp(normalizedEmail);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در ارتباط با سرور احراز هویت جهت بازیابی رمز عبور.' };
  }
}

/**
 * ریست کردن رمز عبور پس از تایید کد
 */
export async function resetUserPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' };
  }

  if (cleanCode) {
    const { error: recoveryErr } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanCode,
      type: 'recovery',
    });

    if (recoveryErr) {
      const fallbackVerify = await verifyNativeOtp(normalizedEmail, cleanCode, 'email');
      if (!fallbackVerify.success) {
        return { success: false, error: translateSupabaseError(recoveryErr.message) };
      }
    }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.warn('Note on updateUser:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در به‌روزرسانی رمز عبور.' };
  }
}

/**
 * آپلود فیش پرداخت
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
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: (e.target?.result as string) || '' });
        reader.onerror = () => resolve({ url: '', error: 'خطا در بارگذاری تصویر فیش' });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(data.path);

    return { url: publicUrlData?.publicUrl || data.path };
  } catch (err: any) {
    return { url: '', error: err?.message || 'خطا در آپلود فیش' };
  }
}

/**
 * آپلود تصویر آواتار
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
 * اتصال به Edge Function مربوط به OTP ادمین
 */
export async function invokeAdminOtpEdgeFunction(
  action: 'send_otp' | 'verify_otp',
  payload: { email: string; code?: string }
): Promise<{ success: boolean; message?: string; error?: string; verified?: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-otp', {
      body: { action, ...payload },
    });

    if (error) {
      return { success: false, error: translateSupabaseError(error.message) };
    }

    if (data) {
      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error,
        verified: Boolean(data.verified),
      };
    }
    return { success: false, error: 'پاسخی از سرور احراز هویت دو مرحله‌ای دریافت نشد.' };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'ارتباط با سرور امن احراز هویت ادمین برقرار نشد.',
    };
  }
}

/**
 * بررسی سفارشات توسط ادمین
 */
export async function invokeAdminReviewOrderEdgeFunction(params: {
  action: 'approve' | 'reject';
  paymentId: string;
  adminNotes?: string;
}): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
  try {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes?.data?.session?.access_token;

    if (!token) {
      return {
        success: false,
        error: 'نشست احراز هویت مدیر ارشد یافت نشد.',
      };
    }

    const { data, error } = await supabase.functions.invoke('admin-review-order', {
      body: params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      return { success: false, error: translateSupabaseError(error.message) };
    }

    if (data) {
      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error,
        data: data.data,
      };
    }

    return { success: false, error: 'پاسخی از سرور بررسی سفارش دریافت نشد.' };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'خطا در ارتباط با سرور بررسی سفارشات.',
    };
  }
}

/**
 * مدیریت کاربران توسط ادمین
 */
export async function invokeAdminManageUserEdgeFunction(params: {
  action: 'update_role_tier' | 'update_subscription_days';
  userId: string;
  role?: string;
  tier?: string;
  daysToAdd?: number;
  reason?: string;
}): Promise<{ success: boolean; message?: string; error?: string; data?: any }> {
  try {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes?.data?.session?.access_token;

    if (!token) {
      return {
        success: false,
        error: 'نشست احراز هویت مدیر ارشد یافت نشد.',
      };
    }

    const { data, error } = await supabase.functions.invoke('admin-manage-user', {
      body: params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      return { success: false, error: translateSupabaseError(error.message) };
    }

    if (data) {
      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error,
        data: data.data,
      };
    }

    return { success: false, error: 'پاسخی از سرور مدیریت کاربران دریافت نشد.' };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'خطا در ارتباط با سرور مدیریت کاربران.',
    };
  }
}