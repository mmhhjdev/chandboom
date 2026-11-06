/**
 * تنظیمات رضایت کاربر برای کوکی‌های تحلیلی.
 * تا وقتی کاربر «پذیرفتن» را نزده، Google Analytics بارگذاری نمی‌شود.
 */
export type ConsentValue = 'granted' | 'denied';

const STORAGE_KEY = 'chandboom_cookie_consent_v1';
const EVENT_NAME = 'chandboom:consent-changed';

export function getConsent(): ConsentValue | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode or blocked storage: the choice applies to this page view only.
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onConsentChange(callback: () => void): () => void {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
