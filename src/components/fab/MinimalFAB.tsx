'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, CheckSquare, Play } from 'lucide-react';
import { useAppStore, useTimerStore } from '@/store';

interface MinimalFABProps {
  onOpenTaskModal: () => void;
}

export function MinimalFAB({ onOpenTaskModal }: MinimalFABProps) {
  const { fabMenuOpen, setFabMenuOpen, toggleZenMode } = useAppStore();
  const { timer } = useTimerStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Nur 2 Aktionen - das Wesentliche
  const fabActions = [
    { 
      id: 'task', 
      label: 'Neue Aufgabe', 
      icon: CheckSquare, 
      action: onOpenTaskModal,
      shortcut: 'N'
    },
    { 
      id: 'focus', 
      label: 'Fokus starten', 
      icon: Play, 
      action: toggleZenMode,
      shortcut: 'F',
      disabled: timer.isRunning,
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setFabMenuOpen(false);
      }
    };

    if (fabMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fabMenuOpen, setFabMenuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // N for new task (quick shortcut, no menu needed)
      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onOpenTaskModal();
        return;
      }

      // F for focus (if not running)
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey && !timer.isRunning) {
        event.preventDefault();
        toggleZenMode();
        return;
      }

      if (event.key === 'Escape' && fabMenuOpen) {
        setFabMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fabMenuOpen, setFabMenuOpen, timer.isRunning, onOpenTaskModal, toggleZenMode]);

  const handleAction = (action: typeof fabActions[0]) => {
    setFabMenuOpen(false);
    action.action();
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-40">
      {/* Minimal Speed Dial Menu */}
      <div className={`
        absolute bottom-16 right-0 mb-2
        transition-all duration-200 ease-out
        ${fabMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-2 pointer-events-none'
        }
      `}>
        <div className="rounded-xl shadow-2xl border border-white/10 overflow-hidden w-[180px]"
          style={{ background: '#1a1d31' }}>
          {fabActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                onClick={() => !action.disabled && handleAction(action)}
                disabled={action.disabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left
                  transition-colors
                  ${action.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/08'
                  }
                `}
              >
                <Icon size={18} className="text-violet-400" />
                <span className="text-sm font-medium text-white/80">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setFabMenuOpen(!fabMenuOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg shadow-violet-900/40
          flex items-center justify-center
          transition-all duration-200
          focus:outline-none
          ${fabMenuOpen
            ? 'rotate-45'
            : 'hover:opacity-90 active:scale-95'
          }
        `}
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        aria-label={fabMenuOpen ? 'Menü schließen' : 'Schnellaktionen öffnen'}
      >
        {fabMenuOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
