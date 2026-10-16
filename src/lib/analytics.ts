/**
 * Google Analytics 4 (GA4) Integration for Chandboom
 * STRICT RULE: Never hardcode the GA measurement ID.
 * Always retrieves from environment variable import.meta.env.VITE_GA_MEASUREMENT_ID.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function getGaMeasurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
}

/**
 * Initializes GA4 dataLayer and gtag if measurement ID is provided
 */
export function initGA(): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
  }
  const scriptId = 'chandboom-google-analytics';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }
  window.gtag('config', measurementId, {
    send_page_view: false, // Managed manually via AnalyticsTracker
  });
}

/**
 * Tracks route page views
 */
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

/**
 * Generic custom event tracker
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    ...params,
    send_to: measurementId,
  });
}

/**
 * Specifically tracks AI Assistant usage analytics
 */
export function trackAiQuerySent(category: string = 'guide'): void {
  trackEvent('ai_query_sent', {
    category,
    timestamp: new Date().toISOString(),
  });
}

export function trackAiQuotaExceeded(): void {
  trackEvent('ai_quota_exceeded', {
    timestamp: new Date().toISOString(),
  });
}
