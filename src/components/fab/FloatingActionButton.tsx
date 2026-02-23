'use client';

import { FormEvent, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, 
  X, 
  CheckSquare, 
  Target, 
  Calendar, 
  Rocket, 
  Timer, 
  Sparkles 
} from 'lucide-react';
import { useAppStore, useTimerStore, useMotivationStore, useDataStore, useSettingsStore } from '@/store';
import { buildQuickCaptureTaskInput } from '@/lib/quickCapture';

interface FloatingActionButtonProps {
  onOpenTaskModal: () => void;
  onOpenGoalModal: () => void;
  onOpenProjectModal: () => void;
  onOpenEventModal: () => void;
  onOpenTimerModal: () => void;
}

type FabAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut: string;
  disabled?: boolean;
};

export function FloatingActionButton({
  onOpenTaskModal,
  onOpenGoalModal,
  onOpenProjectModal,
  onOpenEventModal,
  onOpenTimerModal,
}: FloatingActionButtonProps) {
  const { fabMenuOpen, setFabMenuOpen, toggleZenMode } = useAppStore();
  const { timer } = useTimerStore();
  const { triggerMotivation } = useMotivationStore();
  const { addTask } = useDataStore();
  const settings = useSettingsStore((state) => state.settings);
  const menuRef = useRef<HTMLDivElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [quickCaptureTitle, setQuickCaptureTitle] = useState('');
  const [quickCaptureLoading, setQuickCaptureLoading] = useState(false);

  const fabActions = useMemo<FabAction[]>(() => [
    { 
      id: 'task', 
      label: 'Neue Aufgabe', 
      icon: CheckSquare, 
      action: onOpenTaskModal,
      shortcut: 'T'
    },
    { 
      id: 'goal', 
      label: 'Neues Ziel', 
      icon: Target, 
      action: onOpenGoalModal,
      shortcut: 'G'
    },
    { 
      id: 'event', 
      label: 'Neuer Termin', 
      icon: Calendar, 
      action: onOpenEventModal,
      shortcut: 'E'
    },
    { 
      id: 'project', 
      label: 'Neues Projekt', 
      icon: Rocket, 
      action: onOpenProjectModal,
      shortcut: 'P'
    },
    { 
      id: 'timer', 
      label: 'Timer starten', 
      icon: Timer, 
      action: onOpenTimerModal,
      shortcut: 'F',
      disabled: timer.isRunning,
    },
    { 
      id: 'zen', 
      label: 'Zen Modus', 
      icon: Sparkles, 
      action: () => {
        toggleZenMode();
        triggerMotivation('zen-mode');
      },
      shortcut: 'Z'
    },
  ], [
    onOpenTaskModal,
    onOpenGoalModal,
    onOpenProjectModal,
    onOpenEventModal,
    onOpenTimerModal,
    timer.isRunning,
    toggleZenMode,
    triggerMotivation,
  ]);

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

  const handleAction = useCallback((action: FabAction) => {
    setFabMenuOpen(false);
    action.action();
  }, [setFabMenuOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setFabMenuOpen(!fabMenuOpen);
      }

      if (fabMenuOpen) {
        const action = fabActions.find(a => a.shortcut.toLowerCase() === event.key.toLowerCase());
        if (action && !action.disabled) {
          event.preventDefault();
          handleAction(action);
        }
        if (event.key === 'Escape') {
          setFabMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fabActions, fabMenuOpen, handleAction, setFabMenuOpen]);

  const handleQuickCapture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = quickCaptureTitle.trim();
    if (!title || quickCaptureLoading) return;

    try {
      setQuickCaptureLoading(true);
      const quickTask = buildQuickCaptureTaskInput(title, {
        quickCaptureDefaultPriority: settings.quickCaptureDefaultPriority,
        quickCaptureDefaultTag: settings.quickCaptureDefaultTag,
      });
      if (!quickTask) return;

      await addTask(quickTask);

      setQuickCaptureTitle('');
      triggerMotivation('task-complete');
    } catch (error) {
      console.error('Quick capture failed:', error);
    } finally {
      setQuickCaptureLoading(false);
      quickInputRef.current?.focus();
    }
  };

  return (
    <div ref={menuRef} className="fixed bottom-8 right-8 z-50">
      {/* Speed Dial Menu */}
      <div className={`
        absolute bottom-16 right-0 mb-2
        transition-all duration-300 ease-out
        ${fabMenuOpen 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[260px]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <p className="text-sm font-semibold text-gray-800">
              Schnellaktionen
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">⌘K</kbd>
              zum Öffnen
            </p>
          </div>

          {/* Quick Capture */}
          <form onSubmit={handleQuickCapture} className="px-4 py-3 border-b border-gray-100 bg-gray-50/70">
            <label htmlFor="quick-capture" className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Capture
            </label>
            <div className="flex items-center gap-2">
              <input
                id="quick-capture"
                ref={quickInputRef}
                type="text"
                value={quickCaptureTitle}
                onChange={(e) => setQuickCaptureTitle(e.target.value)}
                placeholder={settings.quickCapturePlaceholder || 'Aufgabe schnell notieren...'}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
              />
              <button
                type="submit"
                disabled={quickCaptureLoading || !quickCaptureTitle.trim()}
                className="px-3 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </form>

          {/* Actions List */}
          <div className="py-2">
            {fabActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <button
                  key={action.id}
                  onClick={() => !action.disabled && handleAction(action)}
                  disabled={action.disabled}
                  className={`
                    w-full flex items-center gap-4 px-5 py-3 text-left
                    transition-all duration-150
                    ${action.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                    ${action.id === 'zen' 
                      ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600' 
                      : action.id === 'timer'
                      ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600'
                      : action.id === 'task'
                      ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'
                      : action.id === 'goal'
                      ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
                      : action.id === 'event'
                      ? 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600'
                      : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600'
                    }
                  `}>
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      {action.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md font-mono">
                    {action.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setFabMenuOpen(!fabMenuOpen)}
        className={`
          w-14 h-14 rounded-2xl shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-indigo-200
          ${fabMenuOpen 
            ? 'bg-gray-900 rotate-45 scale-95' 
            : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:scale-105 hover:shadow-xl hover:shadow-indigo-200'
          }
        `}
        aria-label={fabMenuOpen ? 'Menü schließen' : 'Schnellaktionen öffnen'}
      >
        {fabMenuOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}
