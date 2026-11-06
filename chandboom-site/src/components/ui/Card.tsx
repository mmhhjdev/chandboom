import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, bordered = true, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-[#0E1512] rounded-3xl transition-all duration-200 ${
          bordered ? 'border border-[#E2E8E4] dark:border-[#1F2E27]' : ''
        } ${
          hoverable
            ? 'hover:shadow-lg hover:border-emerald-500/40 dark:hover:border-emerald-600/40 hover:-translate-y-0.5 cursor-pointer'
            : 'shadow-xs'
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-5 sm:p-6 pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E27]/80 flex flex-col space-y-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-cairo text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p
      ref={ref}
      className={`font-cairo text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-5 sm:p-6 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E27]/80 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
