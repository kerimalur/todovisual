'use client';

import { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-xl transition-all duration-200';

    const variants = {
      default: 'border border-white/08 [background:rgba(255,255,255,0.03)]',
      bordered: 'border-2 border-white/12 [background:rgba(255,255,255,0.04)]',
      elevated: 'shadow-lg border border-white/10 [background:rgba(255,255,255,0.05)]',
      ghost: 'border border-transparent [background:rgba(255,255,255,0.02)]',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const hoverStyles = hoverable
      ? 'hover:shadow-md hover:border-white/15 cursor-pointer active:scale-[0.99]'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, icon, action, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between pb-4 border-b border-white/06 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/08 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => {
  return (
    <div ref={ref} className={`pt-4 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';
