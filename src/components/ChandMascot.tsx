import React from 'react';

/**
 * ماسکوت سه‌بعدی دستیار چندبوم (PNG/WebP شفاف در public/icons3d).
 * WebP برای مرورگرهای جدید و PNG به‌عنوان جایگزین؛ برای تصویر بزرگ‌تر، سایز مناسب انتخاب می‌شود.
 */
export interface ChandMascotProps {
  size?: number;
  className?: string;
  alt?: string;
}

const RATIO = 882 / 1146;

export const ChandMascot: React.FC<ChandMascotProps> = ({
  size = 48,
  className,
  alt = 'دستیار هوشمند چندبوم',
}) => (
  <picture>
    <source
      type="image/webp"
      srcSet="/icons3d/ai-mascot-128.webp 128w, /icons3d/ai-mascot-256.webp 256w, /icons3d/ai-mascot-512.webp 512w"
      sizes={`${size}px`}
    />
    <img
      src="/icons3d/ai-mascot-256.png"
      srcSet="/icons3d/ai-mascot-128.png 128w, /icons3d/ai-mascot-256.png 256w, /icons3d/ai-mascot-512.png 512w"
      sizes={`${size}px`}
      width={size}
      height={Math.round(size * RATIO)}
      alt={alt}
      className={className}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  </picture>
);

export default ChandMascot;
