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
      default: 'bg-white border border-gray-200',
      bordered: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white shadow-lg border border-gray-100',
      ghost: 'bg-gray-50 border border-transparent',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const hoverStyles = hoverable
      ? 'hover:shadow-md hover:border-gray-300 cursor-pointer active:scale-[0.99]'
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
        className={`flex items-center justify-between pb-4 border-b border-gray-100 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-700">{subtitle}</p>}
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
