'use client';

import { forwardRef, useEffect, useState } from 'react';

// Linear Progress Bar
export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  color?: string; // Custom color override
  className?: string;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = 'default',
      size = 'md',
      showLabel = false,
      animated = true,
      color,
      className = '',
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(0);
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    useEffect(() => {
      if (animated) {
        const timer = setTimeout(() => setDisplayValue(percentage), 100);
        return () => clearTimeout(timer);
      } else {
        setDisplayValue(percentage);
      }
    }, [percentage, animated]);

    const sizes = {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
    };

    const variants = {
      default: 'bg-indigo-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
    };

    return (
      <div ref={ref} className={`w-full ${className}`}>
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
          <div
            className={`
              ${sizes[size]} ${!color ? variants[variant] : ''} rounded-full
              transition-all duration-700 ease-out
            `}
            style={{ 
              width: `${displayValue}%`,
              ...(color ? { backgroundColor: color } : {})
            }}
          />
        </div>
        {showLabel && (
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
            <span className="text-xs text-gray-400">
              {value} / {max}
            </span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

// Circular Progress / Ring
export interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  animated = true,
  children,
  className = '',
}: ProgressRingProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(100, Math.max(0, value));

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  const colors = {
    default: { stroke: '#6366f1', bg: '#e0e7ff' },
    success: { stroke: '#10b981', bg: '#d1fae5' },
    warning: { stroke: '#f59e0b', bg: '#fef3c7' },
    danger: { stroke: '#ef4444', bg: '#fee2e2' },
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[variant].bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[variant].stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className="text-lg font-bold text-gray-900">
            {Math.round(displayValue)}%
          </span>
        ))}
      </div>
    </div>
  );
}
