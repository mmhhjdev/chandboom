declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function trackPageView(path: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', MEASUREMENT_ID, {
    page_path: path,
    page_title: document.title,
  });
}

export function trackEvent(action: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, { ...params, measurement_id: MEASUREMENT_ID });
}

export const analytics = {
  pageView: trackPageView,
  login: (method: string) => trackEvent('login', { method }),
  signup: (method: string) => trackEvent('sign_up', { method }),
  logout: () => trackEvent('logout'),
  otpRequested: () => trackEvent('otp_requested'),
  otpVerified: () => trackEvent('otp_verified'),
  otpFailed: (reason?: string) => trackEvent('otp_failed', { reason }),
  paymentReceiptUploaded: () => trackEvent('payment_receipt_uploaded'),
  avatarUploaded: () => trackEvent('avatar_uploaded'),
  error: (type: string, message?: string) => trackEvent('app_error', { error_type: type, message }),
};
