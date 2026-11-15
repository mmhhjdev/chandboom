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

const ASSET_LABELS: Record<string, string> = {
  'dashboard': 'نمای کلی داشبورد مالی: تمام وضعیت پول شما در یک نگاه',
  'transactions': 'دو فلش سبز در حال جابه‌جایی؛ ورود و خروج پول با شفافیت کامل',
  'goals': 'صندوقچه‌ی گنج باز با سکه‌های سبز؛ اهداف مالی‌تان، یک قدم تا رسیدن',
  'dong': 'سکه‌ای که میان دو نفر تقسیم شده؛ تقسیم منصفانه‌ی هزینه‌های گروهی',
  'quest': 'کارت چک‌لیست با ستاره؛ کارهای امروزِ مالی‌تان، یکی‌یکی انجام شوند',
  'forecast': 'گوی بلورین با نمودار صعودی؛ پیش‌بینی هوشمند بودجه‌ی ماه‌های پیش رو',
  'vip-crown': 'تاج سبز درخشان با جواهرهای روشن؛ اشتراک VIP چندبوم',
  'analytics': 'نمودار دایره‌ای با تکه‌ی جداشده؛ تحلیل ساده‌ی هزینه‌ها و درآمدها',
  'reminders': 'زنگ سبز با نشان تازه؛ یادآوری سررسیدها تا هیچ‌چیز جا نماند',
  'budget': 'کیف پول سبز با سکه‌های در حال بیرون‌آمدن؛ بودجه‌ی ماهانه‌ی منظم',
  'add': 'دکمه‌ی بزرگ سبز با علامت مثبت؛ ثبت سریع یک تراکنش جدید',
  'ai': 'کره‌ی بلورین هوش مصنوعی با ستاره‌ی درخشان؛ دستیار هوشمند مالی چندبوم',
  'avatar-male': 'آواتار کاربر چندبوم با لبخند و حس اطمینان',
  'avatar-female': 'آواتار کاربر چندبوم با لبخند و حس اطمینان',
};

export const ChandAsset: React.FC<ChandAssetProps> = ({ name, size = 48, className, alt }) => {
  const imageAlt = alt ?? ASSET_LABELS[name] ?? 'تصویر چندبوم';
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
        alt={imageAlt}
        className={className}
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};

export default ChandAsset;
