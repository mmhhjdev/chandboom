/**
 * Simplified Modern Avatar System for Chandboom Platform (chandboom.ir)
 * Strict Requirement:
 * - Exactly TWO default avatar presets: Male and Female.
 * - Completely redesigned with high-quality, modern, minimalistic UI design style.
 * - Professional aesthetic tailored to the Chandboom emerald brand palette.
 */

// Modern, minimalist Male Avatar with rich emerald gradient and clean geometric contours
export const MALE_AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGradMale" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064E3B" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#0D9488" />
    </linearGradient>
    <linearGradient id="skinGradMale" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FDDEC0" />
      <stop offset="100%" stop-color="#EBB382" />
    </linearGradient>
    <linearGradient id="hairGradMale" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1F2937" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="suitGradMale" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#062E25" />
      <stop offset="100%" stop-color="#021C16" />
    </linearGradient>
  </defs>
  <!-- Background Circle with Subtle Ring -->
  <circle cx="60" cy="60" r="58" fill="url(#bgGradMale)" />
  <circle cx="60" cy="60" r="56" fill="none" stroke="#6EE7B7" stroke-width="1.5" stroke-opacity="0.35" />

  <!-- Shoulders & Coat -->
  <path d="M22 110 C24 88 40 82 60 82 C80 82 96 88 98 110 Z" fill="url(#suitGradMale)" />
  <!-- Shirt Collar & Tie -->
  <path d="M50 82 L60 96 L70 82 Z" fill="#F8FAFC" />
  <path d="M57 91 L63 91 L62 108 L60 110 L58 108 Z" fill="#10B981" />

  <!-- Neck -->
  <rect x="52" y="70" width="16" height="15" rx="4" fill="#EBB382" />

  <!-- Head -->
  <ellipse cx="60" cy="52" rx="19" ry="23" fill="url(#skinGradMale)" />

  <!-- Hair Base -->
  <path d="M41 46 C41 29 50 25 60 25 C72 25 79 31 79 48 C77 40 73 34 60 34 C49 34 43 40 41 46 Z" fill="url(#hairGradMale)" />
  <!-- Modern Side Pompadour Volume -->
  <path d="M43 38 C46 25 62 23 74 27 C80 30 78 37 72 37 C64 37 54 33 43 38 Z" fill="url(#hairGradMale)" />

  <!-- Minimalist Eyes & Eyebrows -->
  <path d="M48 45 Q53 43 57 45" stroke="#111827" stroke-width="1.8" stroke-linecap="round" fill="none" />
  <path d="M63 45 Q67 43 72 45" stroke="#111827" stroke-width="1.8" stroke-linecap="round" fill="none" />
  <circle cx="52.5" cy="51" r="2.2" fill="#111827" />
  <circle cx="67.5" cy="51" r="2.2" fill="#111827" />
  <!-- Eye highlight spark -->
  <circle cx="53.3" cy="50.2" r="0.7" fill="#FFFFFF" />
  <circle cx="68.3" cy="50.2" r="0.7" fill="#FFFFFF" />

  <!-- Nose -->
  <path d="M60 52 L59 58 L62 58" stroke="#D18F58" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />

  <!-- Calm Confident Smile -->
  <path d="M54 64 Q60 68 66 64" stroke="#873F14" stroke-width="1.6" stroke-linecap="round" fill="none" />

  <!-- Modern Clean Glasses (optional subtle touch) -->
  <rect x="45" y="47" width="13" height="8" rx="2.5" fill="none" stroke="#34D399" stroke-width="1.2" stroke-opacity="0.7" />
  <rect x="62" y="47" width="13" height="8" rx="2.5" fill="none" stroke="#34D399" stroke-width="1.2" stroke-opacity="0.7" />
  <line x1="58" y1="50" x2="62" y2="50" stroke="#34D399" stroke-width="1.2" stroke-opacity="0.7" />
</svg>`);

// Modern, minimalist Female Avatar with vibrant emerald-teal aesthetic and stylish silhouette
export const FEMALE_AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGradFem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="60%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="skinGradFem" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FEEDE0" />
      <stop offset="100%" stop-color="#F3C3A0" />
    </linearGradient>
    <linearGradient id="hairGradFem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D150B" />
      <stop offset="100%" stop-color="#1A0D07" />
    </linearGradient>
    <linearGradient id="dressGradFem" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064E3B" />
      <stop offset="100%" stop-color="#022C22" />
    </linearGradient>
  </defs>
  <!-- Background Circle with Subtle Ring -->
  <circle cx="60" cy="60" r="58" fill="url(#bgGradFem)" />
  <circle cx="60" cy="60" r="56" fill="none" stroke="#5EEAD4" stroke-width="1.5" stroke-opacity="0.35" />

  <!-- Hair Back Flow -->
  <path d="M36 50 C34 76 38 95 44 105 C46 100 48 85 48 78 C36 70 35 55 36 50 Z" fill="url(#hairGradFem)" />
  <path d="M84 50 C86 76 82 95 76 105 C74 100 72 85 72 78 C84 70 85 55 84 50 Z" fill="url(#hairGradFem)" />

  <!-- Shoulders & Outfit -->
  <path d="M25 110 C28 90 42 84 60 84 C78 84 92 90 95 110 Z" fill="url(#dressGradFem)" />
  <!-- Elegant V-Neck Collar & Emerald Pendant -->
  <path d="M52 84 L60 97 L68 84 Z" fill="url(#skinGradFem)" />
  <circle cx="60" cy="94" r="2.2" fill="#34D399" />

  <!-- Neck -->
  <rect x="53" y="70" width="14" height="16" rx="4" fill="#F3C3A0" />

  <!-- Head -->
  <ellipse cx="60" cy="52" rx="18" ry="22" fill="url(#skinGradFem)" />

  <!-- Hair Front (Chic sleek lob / wave) -->
  <path d="M41 48 C40 30 50 25 60 25 C72 25 80 32 79 48 C76 36 68 32 60 32 C50 32 44 38 41 48 Z" fill="url(#hairGradFem)" />
  <path d="M39 46 C44 34 56 31 64 34 C69 36 74 44 76 56 C74 48 68 44 63 43 C54 41 44 44 39 46 Z" fill="url(#hairGradFem)" />

  <!-- Elegant Eyebrows & Eyes with Lashes -->
  <path d="M47 45 Q52 42 56 44" stroke="#2D150B" stroke-width="1.6" stroke-linecap="round" fill="none" />
  <path d="M64 44 Q68 42 73 45" stroke="#2D150B" stroke-width="1.6" stroke-linecap="round" fill="none" />

  <circle cx="52" cy="51" r="2.3" fill="#1A0D07" />
  <circle cx="68" cy="51" r="2.3" fill="#1A0D07" />
  <!-- Lashes -->
  <path d="M54.5 49.5 L56 48" stroke="#1A0D07" stroke-width="1.2" stroke-linecap="round" />
  <path d="M70.5 49.5 L72 48" stroke="#1A0D07" stroke-width="1.2" stroke-linecap="round" />
  <!-- Highlights -->
  <circle cx="52.8" cy="50.2" r="0.75" fill="#FFFFFF" />
  <circle cx="68.8" cy="50.2" r="0.75" fill="#FFFFFF" />

  <!-- Nose -->
  <path d="M60 52 L59.5 57 L61.5 57" stroke="#DC9666" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none" />

  <!-- Gentle Blush -->
  <ellipse cx="46" cy="56" rx="3.5" ry="2" fill="#FB7185" fill-opacity="0.3" />
  <ellipse cx="74" cy="56" rx="3.5" ry="2" fill="#FB7185" fill-opacity="0.3" />

  <!-- Soft Warm Smile -->
  <path d="M54 64 Q60 68 66 64" stroke="#BE123C" stroke-width="1.8" stroke-linecap="round" fill="none" />

  <!-- Minimalist Pearl Earrings -->
  <circle cx="41.5" cy="56" r="2" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.5" />
  <circle cx="78.5" cy="56" r="2" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.5" />
</svg>`);

export const DEFAULT_AVATAR_PRESETS = [
  {
    id: 'preset-male',
    gender: 'مرد',
    name: 'آواتار پیش‌فرض آقا',
    url: MALE_AVATAR_SVG,
  },
  {
    id: 'preset-female',
    gender: 'زن',
    name: 'آواتار پیش‌فرض خانم',
    url: FEMALE_AVATAR_SVG,
  },
] as const;

export const AVATAR_PRESETS = DEFAULT_AVATAR_PRESETS;
