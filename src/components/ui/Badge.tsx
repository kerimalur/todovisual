'use client';

import { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = 'default', size = 'sm', dot = false, className = '', children, ...props },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';

    const variants = {
      default: 'bg-gray-100 text-gray-700 border border-gray-200',
      primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200',
      danger: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
    };

    const dotColors = {
      default: 'bg-gray-500',
      primary: 'bg-indigo-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      info: 'bg-blue-500',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Priority Type
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Priority Badge - speziell für Prioritäten
export interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const priorityConfig = {
  low: { label: 'Niedrig', variant: 'default' as const, icon: '○' },
  medium: { label: 'Mittel', variant: 'info' as const, icon: '◐' },
  high: { label: 'Hoch', variant: 'warning' as const, icon: '◉' },
  urgent: { label: 'Dringend', variant: 'danger' as const, icon: '●' },
};

export function PriorityBadge({ priority, showLabel = true, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} size={size} dot>
      {showLabel ? config.label : config.icon}
    </Badge>
  );
}
