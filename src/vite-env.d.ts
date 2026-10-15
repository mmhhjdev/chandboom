/**
 * Ambient type definitions for the chandboom.ir Vite SPA.
 * This file is a global script (no top-level import/export) so that the
 * interface augmentations below merge with lib.dom and Vite's own types.
 */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GAPGPT_BASE_URL: string;
  readonly VITE_GAPGPT_API_KEY: string;
  /** Google Analytics 4 Measurement ID (never hardcoded in source files). */
  readonly VITE_GA_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** GA4 dataLayer (created by the inline bootstrap in index.html). */
  dataLayer?: unknown[];
  /** gtag.js function installed by https://www.googletagmanager.com/gtag/js */
  gtag?: (...args: unknown[]) => void;
}
