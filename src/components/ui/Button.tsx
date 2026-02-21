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
        bg-indigo-600 text-white
        hover:bg-indigo-700 
        focus:ring-indigo-500
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-white text-gray-900 border border-gray-300
        hover:bg-gray-50 hover:border-gray-500
        focus:ring-gray-500
      `,
      ghost: `
        bg-transparent text-gray-800
        hover:bg-gray-100 hover:text-gray-900
        focus:ring-gray-500
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
