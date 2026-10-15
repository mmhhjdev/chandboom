/**
 * Admin Two-Factor Authentication (OTP / 2FA) Security Utility
 * Strictly uses Supabase Edge Functions / runtime memory security.
 * NEVER stores tokens or credentials in localStorage or sessionStorage (Zero Storage Policy).
 */

import { invokeAdminOtpEdgeFunction } from '../lib/supabase';

interface Admin2FASession {
  verified: boolean;
  expiresAt: number;
  email: string;
}

// Secure in-memory runtime map (No localStorage or sessionStorage)
const runtimeAdminSessions = new Map<string, Admin2FASession>();
const runtimeOtpCodes = new Map<string, { code: string; expiresAt: number }>();

export async function requestAdminOtpViaEdgeFunction(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return await invokeAdminOtpEdgeFunction('send_otp', { email });
}

export async function verifyAdminOtpViaEdgeFunction(
  inputCode: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const result = await invokeAdminOtpEdgeFunction('verify_otp', { email, code: inputCode });

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

// Local mock OTP generation and verification has been deprecated and removed.
// All OTP generation and verification MUST occur strictly on the server (Edge Function / Supabase Auth).


export function isAdmin2FAVerified(email: string): boolean {
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

export function revokeAdmin2FA(): void {
  runtimeAdminSessions.clear();
}
