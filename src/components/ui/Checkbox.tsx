'use client';

import { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  variant?: 'default' | 'circle';
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      variant = 'default',
      size = 'md',
      className = '',
      checked,
      onChange,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: { box: 'w-4 h-4', icon: 12 },
      md: { box: 'w-5 h-5', icon: 14 },
      lg: { box: 'w-6 h-6', icon: 16 },
    };

    const variants = {
      default: 'rounded',
      circle: 'rounded-full',
    };

    return (
      <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              ${sizes[size].box}
              ${variants[variant]}
              border-2 transition-all duration-200
              ${
                checked
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-gray-300 group-hover:border-gray-400'
              }
              peer-focus:ring-2 peer-focus:ring-emerald-500/20 peer-focus:ring-offset-1
            `}
          >
            <Check
              size={sizes[size].icon}
              className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                text-white transition-all duration-200
                ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
              `}
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <span
                className={`
                  block text-sm font-medium transition-colors
                  ${checked ? 'text-gray-500 line-through' : 'text-gray-900'}
                `}
              >
                {label}
              </span>
            )}
            {description && (
              <span className="block text-sm text-gray-500 mt-0.5">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Animated Task Checkbox - mit Confetti-Effekt
export interface TaskCheckboxProps extends CheckboxProps {
  onComplete?: () => void;
}

export const TaskCheckbox = forwardRef<HTMLInputElement, TaskCheckboxProps>(
  ({ onComplete, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      if (e.target.checked && onComplete) {
        onComplete();
      }
    };

    return (
      <Checkbox
        ref={ref}
        variant="circle"
        onChange={handleChange}
        {...props}
      />
    );
  }
);

TaskCheckbox.displayName = 'TaskCheckbox';
