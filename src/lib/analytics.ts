/**
 * Google Analytics 4 (GA4). The measurement ID comes from the environment, never from source.
 * gtag.js is injected here only (index.html no longer contains a GA snippet), so it loads once.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    __gaLoaded?: boolean;
  }
}

export function getGaMeasurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
}

/** Loads gtag.js once and configures GA4. Page views are sent manually by AnalyticsTracker. */
export function initGA(): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined' || window.__gaLoaded) return;
  window.__gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string, title?: string): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
    send_to: measurementId,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, { ...params, send_to: measurementId });
}

export function trackAiQuerySent(category: string = 'guide'): void {
  trackEvent('ai_query_sent', { category });
}

export function trackAiQuotaExceeded(): void {
  trackEvent('ai_quota_exceeded');
}
