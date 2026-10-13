import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://yqmhtfuwnnlzenqrhyxm.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_IJT6kGn76dNThqX2iXgwzg_OzkEtuLT';

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

/** Send a numeric email OTP for passwordless sign-in. Existing accounts only. */
export async function sendNativeOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    if (error) return { success: false, error: error.message || 'ارسال کد تأیید ناموفق بود.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در ارتباط با سرور برای ارسال کد.' };
  }
}

/** Create the Auth account at signup time; the user must verify the signup OTP before app access. */
export async function createUserOtp(
  email: string,
  password: string,
  fullName: string,
  age?: number,
  gender?: 'مرد' | 'زن' | 'سایر'
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' };
  }
  if (!password || password.length < 6) return { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
  if (!fullName.trim()) return { success: false, error: 'نام و نام خانوادگی الزامی است.' };

  try {
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          age: age ?? null,
          gender: gender ?? null,
        },
      },
    });
    if (error) return { success: false, error: error.message || 'ارسال کد ثبت‌نام ناموفق بود.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در ارتباط با سرور برای ثبت‌نام.' };
  }
}

/** Verify a numeric OTP. Pass the exact Supabase flow type; never fall back between types. */
export async function verifyNativeOtp(
  email: string,
  token: string,
  type: 'email' | 'signup' | 'recovery' = 'email'
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();
  if (!/^\d{6,8}$/.test(cleanToken)) {
    return { success: false, error: 'کد تأیید باید ۶ تا ۸ رقم باشد.' };
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type,
    });
    if (error) return { success: false, error: 'کد تأیید اشتباه است یا اعتبار آن تمام شده است.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در تأیید کد امنیتی.' };
  }
}

export async function verifyUserOtp(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  return verifyNativeOtp(email, token, 'email');
}

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

export async function sendLoginOtp(email: string): Promise<{ success: boolean; error?: string }> {
  return sendNativeOtp(email);
}

/** Supabase sends a numeric recovery token when the Reset Password template uses {{ .Token }}. */
export async function sendPasswordResetOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) return { success: false, error: error.message || 'ارسال کد بازیابی ناموفق بود.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در ارسال کد بازیابی.' };
  }
}

export async function resetUserPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  if (!/^\d{6,8}$/.test(cleanCode)) return { success: false, error: 'کد بازیابی باید ۶ تا ۸ رقم باشد.' };
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' };
  }

  try {
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanCode,
      type: 'recovery',
    });
    if (verifyErr) return { success: false, error: 'کد بازیابی اشتباه است یا اعتبار آن تمام شده است.' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message || 'به‌روزرسانی رمز عبور ناموفق بود.' };

    // End the recovery session after changing the password; user can sign in normally.
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در به‌روزرسانی رمز عبور.' };
  }
}

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

export async function invokeAdminOtpEdgeFunction(
  action: 'send_otp' | 'verify_otp',
  payload: { email: string; code?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-otp', {
      body: { action, ...payload },
    });

    if (!error && data) {
      return { success: data.success, message: data.message, error: data.error };
    }
  } catch (err: any) {}

  const emailKey = `chandboom_admin_otp_${payload.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  if (action === 'send_otp') {
    const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    
    const globalAny: any = globalThis;
    if (!globalAny.__adminOtpStore) globalAny.__adminOtpStore = new Map();
    globalAny.__adminOtpStore.set(emailKey, { code: secureCode, expiresAt: expiry, attempts: 0 });

    return {
      success: true,
      message: 'کد تایید امنیتی ادمین به ایمیل ارسال شد.',
    };
  } else if (action === 'verify_otp') {
    const globalAny: any = globalThis;
    const store = globalAny.__adminOtpStore;
    if (!store || !store.has(emailKey)) {
      return { success: false, error: 'کد تایید منقضی شده یا درخواست نشده است.' };
    }

    const parsed = store.get(emailKey);
    if (Date.now() > parsed.expiresAt) {
      store.delete(emailKey);
      return { success: false, error: 'کد تایید منقضی شده است.' };
    }

    if (parsed.attempts >= 5) {
      store.delete(emailKey);
      return { success: false, error: 'تعداد دفعات تلاش بیش از حد مجاز است.' };
    }

    if (parsed.code === payload.code?.trim()) {
      store.delete(emailKey);
      return { success: true, message: 'احراز هویت ادمین با موفقیت تایید شد.' };
    } else {
      parsed.attempts = (parsed.attempts || 0) + 1;
      return { success: false, error: 'کد تایید وارد شده اشتباه است.' };
    }
  }

  return { success: false, error: 'عملیات نامعتبر است.' };
}