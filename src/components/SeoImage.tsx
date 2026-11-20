import React, { useEffect, useState } from 'react';

/**
 * تصویر سئو‌شده‌ی چندبوم: WebP با srcset، JPG به‌عنوان جایگزین، alt و title و کپشن.
 * با زدن روی تصویر، نسخه‌ی بزرگ با کپشن باز می‌شود (zoomable).
 */
export interface SeoImageProps {
  slug: string;
  alt: string;
  title?: string;
  caption?: string;
  className?: string;
  sizes?: string;
  zoomable?: boolean;
  priority?: boolean;
}

const BASE = '/images/marketing';

export const SeoImage: React.FC<SeoImageProps> = ({
  slug, alt, title, caption, className, sizes = '(min-width: 1024px) 33vw, 100vw', zoomable = false, priority = false,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const picture = (
    <picture>
      <source type="image/webp" srcSet={`${BASE}/${slug}-600.webp 600w, ${BASE}/${slug}-1200.webp 1200w`} sizes={sizes} />
      <img
        src={`${BASE}/${slug}-1200.jpg`}
        srcSet={`${BASE}/${slug}-1200.jpg 1200w`}
        sizes={sizes}
        width={1200}
        height={670}
        alt={alt}
        title={title}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={className}
      />
    </picture>
  );

  if (!zoomable) return picture;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in rounded-2xl overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
        aria-label={`بزرگ‌نمایی: ${alt}`}
      >
        {picture}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[120] bg-black/85 flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={`${BASE}/${slug}-1200.jpg`}
            alt={alt}
            title={title}
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
          />
          {caption && <p className="mt-4 max-w-2xl text-center text-sm text-white/90 font-cairo">{caption}</p>}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 px-4 py-2 rounded-xl border border-white/40 text-white text-xs font-bold font-cairo"
          >
            بستن
          </button>
        </div>
      )}
    </>
  );
};

export default SeoImage;
