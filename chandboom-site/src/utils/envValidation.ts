/**
 * سامانه اعتبارسنجی متغیرهای محیطی چندبوم (Chandboom Environment Validator)
 * برای پشتیبانی از پایپ‌لاین‌های CI/CD و استقرار در GitHub Pages
 */

export interface EnvValidationReport {
  isValid: boolean;
  isSupabaseConfigured: boolean;
  isAiConfigured: boolean;
  isAdminConfigured: boolean;
  missingVariables: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationReport {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 1. Supabase Credentials
  const supabaseUrl =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';

  const supabaseAnonKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );

  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  // 2. AI: the provider key lives ONLY in Supabase Edge Function secrets (GAPGPT_API_KEY).
  // Never read or validate an AI key in the browser: Vite inlines import.meta.env into the bundle.
  const isAiConfigured = isSupabaseConfigured;

  // 3. Admin Credentials
  const adminEmail =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_EMAIL) ||
    (typeof process !== 'undefined' && process.env?.VITE_ADMIN_EMAIL) ||
    '';
  const isAdminConfigured = Boolean(adminEmail);
  if (!isAdminConfigured) {
    warnings.push('ایمیل ادمین ارشد (VITE_ADMIN_EMAIL) تنظیم نشده است. دسترسی ادمین در هر حال توسط سرور (role=admin) کنترل می‌شود.');
  }

  return {
    isValid: isSupabaseConfigured && isAiConfigured,
    isSupabaseConfigured,
    isAiConfigured,
    isAdminConfigured,
    missingVariables: missing,
    warnings,
  };
}
