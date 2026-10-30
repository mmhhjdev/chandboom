/**
 * Admin Authentication & 2FA Utility
 * Directly interacts with Supabase Auth without Edge Functions.
 */

import { sendNativeOtp, verifyNativeOtp } from '../lib/supabase';

interface Admin2FASession {
  verified: boolean;
  expiresAt: number;
  email: string;
}

const runtimeAdminSessions = new Map<string, Admin2FASession>();

export async function requestAdminOtpViaEdgeFunction(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await sendNativeOtp(email, { shouldCreateUser: false });
  return {
    success: res.success,
    message: res.success ? 'کد تایید امنیتی به ایمیل مدیریت ارسال شد.' : undefined,
    error: res.error,
  };
}

export async function verifyAdminOtpViaEdgeFunction(
  inputCode: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyNativeOtp(email, inputCode, 'email');

  if (result.success) {
    const session: Admin2FASession = {
      verified: true,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour session
      email: email.toLowerCase(),
    };
    runtimeAdminSessions.set(email.toLowerCase(), session);
    return { success: true };
  }

  return { success: false, error: result.error || 'کد تایید اشتباه است.' };
}

export function isAdmin2FAVerified(email?: string | null): boolean {
  if (!email) return false;
  try {
    const cleanEmail = email.toLowerCase();
    const session = runtimeAdminSessions.get(cleanEmail);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      runtimeAdminSessions.delete(cleanEmail);
      return false;
    }
    return session.verified && session.email === cleanEmail;
  } catch {
    return false;
  }
}

export function revokeAdmin2FA(email?: string): void {
  if (email) {
    runtimeAdminSessions.delete(email.toLowerCase());
  } else {
    runtimeAdminSessions.clear();
  }
}
