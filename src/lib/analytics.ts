/**
 * GA4 analytics helper for chandboom.ir (Vite + React SPA).
 * The Measurement ID is read from import.meta.env.VITE_GA_MEASUREMENT_ID
 * and is NEVER hardcoded in source code.
 */

type EventParams = Record<string, string | number | boolean | undefined>;

const GA_MEASUREMENT_ID: string | undefined =
  (import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) || undefined;

/** True only when gtag.js has finished loading in a browser environment. */
function isGtagReady(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/** True when analytics should run at all (browser + configured ID). */
export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(GA_MEASUREMENT_ID);
}

/**
 * Manually track an SPA route change as a page_view.
 * (send_page_view is disabled in index.html config, so this is the only source of pageviews.)
 */
export function trackPageView(path: string, title?: string): void {
  if (!isGtagReady()) return;
  window.gtag!('event', 'page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/** Generic custom event tracker. */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (!isGtagReady()) return;
  window.gtag!('event', name, { ...params, send_to: GA_MEASUREMENT_ID });
}

/** Attach signed-in user id / custom dimensions to the session. */
export function setUserProperties(userId: string, properties: EventParams = {}): void {
  if (!isGtagReady()) return;
  window.gtag!('set', { user_id: userId, ...properties });
}

/** Clear user association on sign-out. */
export function resetUserProperties(): void {
  if (!isGtagReady()) return;
  window.gtag!('set', { user_id: null });
}

/** Project-specific typed helpers used across the app. */
export const analytics = {
  login(method = 'otp'): void {
    trackEvent('login', { method });
  },
  signup(method = 'otp'): void {
    trackEvent('signup', { method });
  },
  logout(): void {
    trackEvent('logout');
    resetUserProperties();
  },
  otpRequested(phoneMasked?: string): void {
    trackEvent('otp_requested', { phone_masked: phoneMasked });
  },
  otpVerified(success = true): void {
    trackEvent('otp_verified', { success });
  },
  paymentReceiptUploaded(source: 'camera' | 'gallery' | 'file' = 'file'): void {
    trackEvent('payment_receipt_uploaded', { source });
  },
  avatarUploaded(fileSizeKb?: number): void {
    trackEvent('avatar_uploaded', { file_size_kb: fileSizeKb });
  },
  transactionCreated(category?: string, amount?: number): void {
    trackEvent('transaction_created', { category, amount });
  },
  aiAnalysisRequested(): void {
    trackEvent('ai_analysis_requested');
  },
  excelExported(): void {
    trackEvent('excel_exported');
  },
  dengGroupCreated(): void {
    trackEvent('deng_group_created');
  },
  savingsChallengeJoined(): void {
    trackEvent('savings_challenge_joined');
  },
  error(message: string, fatal = false): void {
    trackEvent('app_error', { message: message.slice(0, 200), fatal });
  },
};

export default analytics;
