'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-start justify-center pt-[5vh] pb-[5vh] px-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="fixed inset-0 bg-[#040616]/70 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
          rounded-2xl border border-white/15 shadow-2xl animate-scale-in
        `}
        style={{
          background:
            'linear-gradient(180deg, rgba(36,44,92,0.96) 0%, rgba(22,28,64,0.95) 100%)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#f4f6ff]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Schliessen"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', style, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-white/75">{label}</label>}
      <input
        className={`
          w-full px-3 py-2.5 text-white rounded-lg border border-white/15
          placeholder:text-white/35
          focus:outline-none focus:border-violet-300/70 focus:ring-2 focus:ring-violet-400/25
          transition-colors
          ${className}
        `}
        style={{ background: 'rgba(255,255,255,0.09)', colorScheme: 'dark', ...(style || {}) }}
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', style, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-white/75">{label}</label>}
      <textarea
        className={`
          w-full px-3 py-2.5 rounded-lg text-white border border-white/15
          placeholder:text-white/35
          focus:outline-none focus:border-violet-300/70 focus:ring-2 focus:ring-violet-400/25
          transition-colors resize-none
          ${className}
        `}
        style={{ background: 'rgba(255,255,255,0.09)', ...(style || {}) }}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', style, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-white/75">{label}</label>}
      <select
        className={`
          w-full px-3 py-2.5 rounded-lg text-white border border-white/15
          focus:outline-none focus:border-violet-300/70 focus:ring-2 focus:ring-violet-400/25
          transition-colors cursor-pointer
          ${className}
        `}
        style={{ background: 'rgba(255,255,255,0.09)', colorScheme: 'dark', ...(style || {}) }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ background: '#1b2252' }}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'text-white hover:opacity-90 shadow-sm [background:linear-gradient(135deg,#7c3aed,#5b7cff)]',
    secondary:
      'text-white/85 border border-white/15 hover:bg-white/10 hover:text-white [background:rgba(255,255,255,0.06)]',
    danger: 'bg-red-600 text-white hover:bg-red-500 shadow-sm',
    ghost: 'text-white/70 hover:bg-white/10 hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
