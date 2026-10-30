import React, { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
      ? 'rounded-none'
      : 'rounded-2xl';

  return (
    <div
      className={`relative overflow-hidden bg-zinc-200/70 dark:bg-[#14201A] ${variantClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent animate-shimmer pointer-events-none" />
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-3xl bg-white dark:bg-[#0E1512] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-4 shadow-xs ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton width="40%" height={20} />
      <Skeleton variant="circular" width={36} height={36} />
    </div>
    <Skeleton width="70%" height={32} />
    <div className="space-y-2 pt-2 border-t border-[#E2E8E4] dark:border-[#1F2E27]">
      <Skeleton width="100%" height={14} />
      <Skeleton width="85%" height={14} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="rounded-3xl bg-white dark:bg-[#0E1512] border border-[#E2E8E4] dark:border-[#1F2E27] p-4 space-y-3 shadow-xs">
    <div className="flex items-center justify-between p-2">
      <Skeleton width="30%" height={24} />
      <Skeleton width="20%" height={24} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-[#121B17]">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="space-y-1.5">
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={10} />
          </div>
        </div>
        <Skeleton width={90} height={18} />
      </div>
    ))}
  </div>
);
