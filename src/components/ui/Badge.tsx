import React, { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'neutral' | 'purple';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
  warning:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80',
  danger:
    'bg-zinc-50 text-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 border-zinc-200 dark:border-zinc-900/60',
  info:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
  gold:
    'bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-400/50 shadow-xs',
  purple:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
  neutral:
    'bg-zinc-100 text-zinc-700 dark:bg-[#141F1A] dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-emerald-500',
  danger: 'bg-zinc-500',
  info: 'bg-emerald-500',
  gold: 'bg-emerald-400',
  purple: 'bg-emerald-500',
  neutral: 'bg-zinc-400',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-cairo font-bold rounded-lg border transition-colors select-none ${variantStyles[variant]} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
