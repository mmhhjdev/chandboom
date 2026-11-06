import React from 'react';

/**
 * دارایی‌های سه‌بعدی VIP چندبوم (PNG/WebP شفاف در public/icons3d/vip).
 * برای نمایش بزرگ‌تر از ۳۲ پیکسل استفاده کنید؛ آیکون‌های کوچک همان ChandIcon هستند.
 */
export type ChandAssetName =
  | 'dashboard' | 'transactions' | 'goals' | 'dong' | 'quest' | 'forecast'
  | 'vip-crown' | 'analytics' | 'reminders' | 'budget' | 'add' | 'ai'
  | 'avatar-male' | 'avatar-female';

export interface ChandAssetProps {
  name: ChandAssetName;
  size?: number;
  className?: string;
  alt?: string;
}

export const ChandAsset: React.FC<ChandAssetProps> = ({ name, size = 48, className, alt = '' }) => {
  const base = `/icons3d/vip/${name}`;
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`${base}-128.webp 128w, ${base}-256.webp 256w, ${base}-512.webp 512w`}
        sizes={`${size}px`}
      />
      <img
        src={`${base}-256.png`}
        srcSet={`${base}-128.png 128w, ${base}-256.png 256w, ${base}-512.png 512w`}
        sizes={`${size}px`}
        width={size}
        height={size}
        alt={alt}
        className={className}
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};

export default ChandAsset;
