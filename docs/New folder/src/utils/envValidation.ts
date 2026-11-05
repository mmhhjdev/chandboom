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

  // 2. Chandboom AI Credentials (VITE_AI_API_KEY or VITE_GAPGPT_API_KEY)
  const aiKey =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_AI_API_KEY ||
        (import.meta as any).env?.VITE_GAPGPT_API_KEY ||
        (import.meta as any).env?.VITE_DEEPSEEK_API_KEY)) ||
    (typeof process !== 'undefined' &&
      (process.env?.VITE_AI_API_KEY ||
        process.env?.VITE_GAPGPT_API_KEY ||
        process.env?.GAPGPT_API_KEY ||
        process.env?.DEEPSEEK_API_KEY)) ||
    '';

  const isAiConfigured = Boolean(aiKey && !aiKey.includes('MY_') && !aiKey.includes('placeholder'));

  if (!isAiConfigured) {
    missing.push('VITE_GAPGPT_API_KEY (یا VITE_AI_API_KEY)');
    warnings.push('کلید هوش مصنوعی چندبوم برای تحلیل پیامک بانکی و گفتگو تنظیم نشده است.');
  }

  // AI Base URL
  const aiBaseUrl =
    (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_AI_BASE_URL || (import.meta as any).env?.VITE_GAPGPT_BASE_URL)) ||
    (typeof process !== 'undefined' && (process.env?.VITE_AI_BASE_URL || process.env?.VITE_GAPGPT_BASE_URL)) ||
    '';
  if (!aiBaseUrl) {
    // Defaults to https://api.gapgpt.app/v1 automatically in aiService
  }

  // 3. Admin Credentials
  const adminEmail =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_EMAIL) ||
    (typeof process !== 'undefined' && process.env?.VITE_ADMIN_EMAIL) ||
    '';
  const adminPassword =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_PASSWORD) ||
    (typeof process !== 'undefined' && process.env?.VITE_ADMIN_PASSWORD) ||
    '';

  const isAdminConfigured = Boolean(adminEmail && adminPassword);
  if (!isAdminConfigured) {
    warnings.push('اطلاعات ورود ادمین ارشد (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD) در متغیرها تنظیم نشده است.');
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
