'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variants = {
      primary: `
        text-white
        hover:opacity-90
        focus:ring-violet-500
        shadow-sm hover:shadow-md
        [background:linear-gradient(135deg,#7c3aed,#6d28d9)]
      `,
      secondary: `
        text-white/70 border border-white/10
        hover:bg-white/06 hover:text-white
        focus:ring-white/20
        [background:rgba(255,255,255,0.04)]
      `,
      ghost: `
        bg-transparent text-white/60
        hover:bg-white/06 hover:text-white/80
        focus:ring-white/20
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700
        focus:ring-red-500
        shadow-sm hover:shadow-md
      `,
      success: `
        bg-emerald-600 text-white
        hover:bg-emerald-700
        focus:ring-emerald-500
        shadow-sm hover:shadow-md
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
