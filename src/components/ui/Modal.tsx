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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[5vh] pb-[5vh] px-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]}
          rounded-2xl shadow-2xl
          animate-scale-in
          max-h-[90vh] flex flex-col
          border border-white/10
        `}
        style={{ background: '#14172a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/08 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/08 transition-all duration-200"
            title="Schließen"
          >
            <X size={18} className="text-white/50" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Form Input Component (Notion-style)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2.5 text-white rounded-lg border border-white/10
          placeholder:text-white/25
          focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20
          transition-all duration-150
          ${className}
        `}
        style={{ background: 'rgba(255,255,255,0.06)' }}
        {...props}
      />
    </div>
  );
}

// Textarea Component (Notion-style)
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2.5 bg-white border border-gray-300
          rounded-lg text-gray-900 placeholder:text-gray-500
          focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
          transition-all duration-150 resize-none
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

// Select Component (Notion-style)
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2.5 bg-white border border-gray-300
          rounded-lg text-gray-900
          focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
          transition-all duration-150 cursor-pointer
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Button Component
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
    primary: 'text-white hover:opacity-90 shadow-sm [background:linear-gradient(135deg,#7c3aed,#6d28d9)]',
    secondary: 'text-white/70 border border-white/10 hover:bg-white/06 hover:text-white [background:rgba(255,255,255,0.04)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-white/60 hover:bg-white/06 hover:text-white/80',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-lg font-medium transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
