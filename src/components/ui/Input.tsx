'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      type,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const baseStyles = `
      w-full transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:opacity-50 disabled:cursor-not-allowed
      placeholder:text-gray-500
    `;

    const variants = {
      default: `
        bg-white border border-gray-300 rounded-xl
        focus:border-indigo-500 focus:ring-indigo-500/20
        hover:border-gray-400
      `,
      filled: `
        bg-gray-100 border border-transparent rounded-xl
        focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20
        hover:bg-gray-200
      `,
    };

    const errorStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : '';

    const paddingStyles = leftIcon
      ? 'pl-10 pr-4'
      : rightIcon || isPassword
      ? 'pl-4 pr-10'
      : 'px-4';

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-900">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              ${baseStyles}
              ${variants[variant]}
              ${errorStyles}
              ${paddingStyles}
              py-2.5 text-gray-900
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-700">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
  value?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search size={18} />}
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          ) : undefined
        }
        value={value}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
