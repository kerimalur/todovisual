'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Target,
  Calendar,
  Zap,
  ListTodo,
  TrendingUp,
  BookOpen,
  LayoutDashboard,
  CheckCircle2,
  Command,
  ArrowRight,
  Clock,
  FolderKanban,
  Repeat,
  StickyNote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, useDataStore, useSettingsStore } from '@/store';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  action: () => void;
  keywords: string[];
  category: 'navigation' | 'action' | 'task';
}

interface CommandPaletteProps {
  onOpenTaskModal: () => void;
  onOpenGoalModal: () => void;
  onOpenEventModal: () => void;
}

export function CommandPalette({ onOpenTaskModal, onOpenGoalModal, onOpenEventModal }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { toggleZenMode } = useAppStore();
  const { tasks, addTask } = useDataStore();
  const settings = useSettingsStore((state) => state.settings);

  // Quick add detection - if query starts with "+" create task directly
  const isQuickAdd = query.startsWith('+');
  const quickAddTitle = isQuickAdd ? query.slice(1).trim() : '';

  const commands: CommandItem[] = useMemo(() => [
    // Actions
    {
      id: 'new-task',
      title: 'Neue Aufgabe',
      subtitle: 'Aufgabe erstellen',
      icon: Plus,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      action: () => { onOpenTaskModal(); setIsOpen(false); },
      keywords: ['task', 'aufgabe', 'neu', 'erstellen', 'add'],
      category: 'action'
    },
    {
      id: 'new-goal',
      title: 'Neues Ziel',
      subtitle: 'Ziel erstellen',
      icon: Target,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      action: () => { onOpenGoalModal(); setIsOpen(false); },
      keywords: ['goal', 'ziel', 'neu', 'erstellen'],
      category: 'action'
    },
    {
      id: 'new-event',
      title: 'Neuer Termin',
      subtitle: 'Kalender-Event erstellen',
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      action: () => { onOpenEventModal(); setIsOpen(false); },
      keywords: ['event', 'termin', 'kalender', 'meeting'],
      category: 'action'
    },
    {
      id: 'start-focus',
      title: 'Fokus starten',
      subtitle: 'Zen Mode aktivieren',
      icon: Zap,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      action: () => { toggleZenMode(); setIsOpen(false); },
      keywords: ['focus', 'fokus', 'zen', 'timer', 'pomodoro'],
      category: 'action'
    },
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Cockpit',
      subtitle: 'Zur Startseite',
      icon: LayoutDashboard,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/'); setIsOpen(false); },
      keywords: ['home', 'start', 'cockpit', 'dashboard'],
      category: 'navigation'
    },
    {
      id: 'nav-tasks',
      title: 'Aufgaben',
      subtitle: 'Alle Aufgaben anzeigen',
      icon: ListTodo,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/tasks'); setIsOpen(false); },
      keywords: ['tasks', 'aufgaben', 'todo', 'list'],
      category: 'navigation'
    },
    {
      id: 'nav-habits',
      title: 'Gewohnheiten',
      subtitle: 'Habits verwalten',
      icon: Repeat,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/habits'); setIsOpen(false); },
      keywords: ['habits', 'gewohnheiten', 'routine'],
      category: 'navigation'
    },
    {
      id: 'nav-goals',
      title: 'Ziele & Projekte',
      subtitle: 'OKRs verwalten',
      icon: FolderKanban,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/goals'); setIsOpen(false); },
      keywords: ['goals', 'ziele', 'projekte', 'okr'],
      category: 'navigation'
    },
    {
      id: 'nav-calendar',
      title: 'Kalender',
      subtitle: 'Termine anzeigen',
      icon: Calendar,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/calendar'); setIsOpen(false); },
      keywords: ['calendar', 'kalender', 'termine'],
      category: 'navigation'
    },
    {
      id: 'nav-progress',
      title: 'Fortschritt',
      subtitle: 'Analytics & Statistiken',
      icon: TrendingUp,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/progress'); setIsOpen(false); },
      keywords: ['progress', 'fortschritt', 'stats', 'analytics'],
      category: 'navigation'
    },
    {
      id: 'nav-journal',
      title: 'Journal',
      subtitle: 'Tagebuch & Reflexion',
      icon: BookOpen,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/journal'); setIsOpen(false); },
      keywords: ['journal', 'tagebuch', 'reflexion'],
      category: 'navigation'
    },
    {
      id: 'nav-notes',
      title: 'Notizen',
      subtitle: 'Ideen & Notizen',
      icon: StickyNote,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      action: () => { router.push('/notes'); setIsOpen(false); },
      keywords: ['notes', 'notizen', 'ideen'],
      category: 'navigation'
    },
  ], [onOpenTaskModal, onOpenGoalModal, onOpenEventModal, toggleZenMode, router]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (isQuickAdd) return [];
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.subtitle?.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some(k => k.includes(lowerQuery))
    );
  }, [query, commands, isQuickAdd]);

  // Recent pending tasks for quick access
  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .slice(0, 3);
  }, [tasks]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle navigation in list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = isQuickAdd ? [] : filteredCommands;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isQuickAdd && quickAddTitle) {
        const configuredTag = settings.quickCaptureDefaultTag.trim();
        const tags = configuredTag ? [configuredTag] : [];
        addTask({
          title: quickAddTitle,
          priority: settings.quickCaptureDefaultPriority,
          status: 'todo',
          tags,
        });
        setQuery('');
        setIsOpen(false);
      } else if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  }, [
    filteredCommands,
    selectedIndex,
    isQuickAdd,
    quickAddTitle,
    addTask,
    settings.quickCaptureDefaultPriority,
    settings.quickCaptureDefaultTag,
  ]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const actionItems = filteredCommands.filter(c => c.category === 'action');
  const navItems = filteredCommands.filter(c => c.category === 'navigation');
  const showRecentTasks = !query && recentTasks.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[14vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden animate-scale-in">

        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Search size={16} className="text-indigo-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isQuickAdd ? `Aufgabe erstellen: "${quickAddTitle || '...'}"` : 'Suchen, navigieren oder + für Quick-Add…'}
            className="flex-1 text-[15px] bg-transparent outline-none text-gray-900 placeholder:text-gray-400 font-medium"
            autoFocus
          />
          <kbd className="flex-shrink-0 px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-md border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Quick Add Banner */}
        {isQuickAdd && (
          <div className="mx-4 mt-3 mb-1 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Plus size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Quick-Add: {quickAddTitle ? `"${quickAddTitle}"` : '…'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Enter drücken um Aufgabe zu erstellen</p>
            </div>
            <ArrowRight size={14} className="text-emerald-400 ml-auto" />
          </div>
        )}

        {/* Results */}
        {!isQuickAdd && (
          <div className="max-h-[420px] overflow-y-auto">

            {/* Actions Section */}
            {actionItems.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Aktionen
                </p>
                <div className="space-y-0.5">
                  {actionItems.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                          isSelected
                            ? 'bg-indigo-600 shadow-md shadow-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-white/20' : cmd.iconBg
                        }`}>
                          <cmd.icon size={15} className={isSelected ? 'text-white' : cmd.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {cmd.title}
                          </p>
                          {cmd.subtitle && (
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {cmd.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          size={13}
                          className={`flex-shrink-0 transition-all ${
                            isSelected ? 'text-indigo-200 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            {actionItems.length > 0 && navItems.length > 0 && (
              <div className="mx-5 my-2 border-t border-gray-100" />
            )}

            {/* Navigation Section */}
            {navItems.length > 0 && (
              <div className="px-3 pb-1">
                {actionItems.length > 0 && (
                  <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Navigation
                  </p>
                )}
                {actionItems.length === 0 && (
                  <p className="px-2 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Navigation
                  </p>
                )}
                <div className="grid grid-cols-2 gap-0.5">
                  {navItems.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                          isSelected
                            ? 'bg-indigo-600 shadow-md shadow-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white/20' : cmd.iconBg
                        }`}>
                          <cmd.icon size={14} className={isSelected ? 'text-white' : cmd.iconColor} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                            {cmd.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            {showRecentTasks && (
              <>
                <div className="mx-5 my-2 border-t border-gray-100" />
                <div className="px-3 pb-3">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Offene Aufgaben
                  </p>
                  <div className="space-y-0.5">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-default"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={14} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-700 truncate flex-1">{task.title}</p>
                        {(task.priority === 'urgent' || task.priority === 'high') && (
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            task.priority === 'urgent' ? 'bg-red-400' : 'bg-orange-400'
                          }`} />
                        )}
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                            <Clock size={10} />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Empty state */}
            {filteredCommands.length === 0 && !isQuickAdd && query && (
              <div className="px-4 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Keine Ergebnisse für „{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Tipp: Tippe <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">+</kbd> vor deinem Text für Quick-Add</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-gray-500">↑↓</kbd>
              Navigieren
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-gray-500">↵</kbd>
              Auswählen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-500">+</span>
              Quick-Add
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Command size={10} />
            <span className="font-medium">K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
