import { getSupabaseClient } from '../lib/supabase';

export const ADMIN_SESSION_KEY = 'chandboom_admin_session';
export const LEGACY_ADMIN_SESSION_KEY = 'chandboon_admin_session';

export interface AdminSession {
  email: string;
  fullName: string;
  token: string;
  expiresAt: number;
  authenticatedAt: number;
}

/**
/**
 * Securely retrieves admin email configuration from environment variables
 */
export function getEnvAdminEmail(): string {
  const envVal =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_EMAIL) ||
    (typeof process !== 'undefined' && process.env?.VITE_ADMIN_EMAIL) ||
    '';
  return envVal ? envVal.trim().toLowerCase() : '';
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const envEmail = getEnvAdminEmail();
  return Boolean(envEmail && clean === envEmail);
}

export function canAccessAdminPanel(userRole?: string, email?: string): boolean {
  return isAdminEmail(email) || userRole === 'admin' || isStoredAdminSessionValid(email);
}

/**
 * Checks if a valid, unexpired admin session exists in localStorage
 */
export function getStoredAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(LEGACY_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (!session || !session.email || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) {
      clearStoredAdminSession();
      return null;
    }
    return session;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

export function isStoredAdminSessionValid(userEmail?: string): boolean {
  try {
    const session = getStoredAdminSession();
    if (!session || !session.email || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      clearStoredAdminSession();
      return false;
    }
    // Must match authorized admin email configuration
    if (!isAdminEmail(session.email)) {
      return false;
    }
    if (userEmail && session.email.toLowerCase() !== userEmail.toLowerCase()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setStoredAdminSession(email: string, fullName = 'مدیر ارشد چندبوم'): AdminSession {
  const cleanEmail = email.trim().toLowerCase();
  const session: AdminSession = {
    email: cleanEmail,
    fullName,
    token: `cb_adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    authenticatedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24-hour admin session
  };
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('admin_email', cleanEmail);
    localStorage.setItem('admin_name', fullName);
  } catch (e) {
    console.warn('Failed to persist admin session to localStorage', e);
  }
  return session;
}

export function clearStoredAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_name');
  } catch (e) {
    console.warn('Failed to clear admin session from localStorage', e);
  }
}

/**
 * Supabase Auth Cryptographic Validation:
 * Authenticates exclusively via Supabase Auth server (secure bcrypt/Argon2 hashing).
 * Does NOT accept client-side password fallbacks or unverified environment passwords.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'لطفاً ایمیل و رمز عبور ادمین را وارد نمایید.' };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return { success: false, error: 'اتصال به سرویس احراز هویت برقرار نیست.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message.includes('Invalid login credentials')
          ? 'ایمیل یا رمز عبور ادمین نادرست است.'
          : error.message,
      };
    }

    if (data?.user) {
      const userEmail = data.user.email?.toLowerCase();
      const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
      const isAuthorized = isAdminEmail(userEmail) || role === 'admin';

      if (isAuthorized) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'مدیر ارشد چندبوم';
        const session = setStoredAdminSession(cleanEmail, name);
        return { success: true, session };
      } else {
        return {
          success: false,
          error: 'اطلاعات ورود در Supabase Auth تایید شد، اما این حساب دسترسی سطح مدیریت ندارد.',
        };
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'خطا در ارتباط با سرور احراز هویت Supabase.',
    };
  }

  return { success: false, error: 'اطلاعات کاربری ادمین در سیستم تایید نشد.' };
}


