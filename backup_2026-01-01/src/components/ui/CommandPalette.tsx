'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Target, 
  Calendar, 
  Timer, 
  Moon,
  ListTodo,
  TrendingUp,
  BookOpen,
  Archive,
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Command
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore, useDataStore } from '@/store';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
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
      action: () => { onOpenTaskModal(); setIsOpen(false); },
      keywords: ['task', 'aufgabe', 'neu', 'erstellen', 'add'],
      category: 'action'
    },
    { 
      id: 'new-goal', 
      title: 'Neues Ziel', 
      subtitle: 'Ziel erstellen',
      icon: Target, 
      action: () => { onOpenGoalModal(); setIsOpen(false); },
      keywords: ['goal', 'ziel', 'neu', 'erstellen'],
      category: 'action'
    },
    { 
      id: 'new-event', 
      title: 'Neuer Termin', 
      subtitle: 'Kalender-Event erstellen',
      icon: Calendar, 
      action: () => { onOpenEventModal(); setIsOpen(false); },
      keywords: ['event', 'termin', 'kalender', 'meeting'],
      category: 'action'
    },
    { 
      id: 'start-focus', 
      title: 'Fokus starten', 
      subtitle: 'Zen Mode aktivieren',
      icon: Zap, 
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
      action: () => { router.push('/'); setIsOpen(false); },
      keywords: ['home', 'start', 'cockpit', 'dashboard'],
      category: 'navigation'
    },
    { 
      id: 'nav-tasks', 
      title: 'Aufgaben', 
      subtitle: 'Alle Aufgaben anzeigen',
      icon: ListTodo, 
      action: () => { router.push('/tasks'); setIsOpen(false); },
      keywords: ['tasks', 'aufgaben', 'todo', 'list'],
      category: 'navigation'
    },
    { 
      id: 'nav-goals', 
      title: 'Ziele & Projekte', 
      subtitle: 'OKRs verwalten',
      icon: Target, 
      action: () => { router.push('/goals'); setIsOpen(false); },
      keywords: ['goals', 'ziele', 'projekte', 'okr'],
      category: 'navigation'
    },
    { 
      id: 'nav-calendar', 
      title: 'Kalender', 
      subtitle: 'Termine anzeigen',
      icon: Calendar, 
      action: () => { router.push('/calendar'); setIsOpen(false); },
      keywords: ['calendar', 'kalender', 'termine'],
      category: 'navigation'
    },
    { 
      id: 'nav-progress', 
      title: 'Fortschritt', 
      subtitle: 'Analytics & Statistiken',
      icon: TrendingUp, 
      action: () => { router.push('/progress'); setIsOpen(false); },
      keywords: ['progress', 'fortschritt', 'stats', 'analytics'],
      category: 'navigation'
    },
    { 
      id: 'nav-journal', 
      title: 'Journal', 
      subtitle: 'Tagebuch & Reflexion',
      icon: BookOpen, 
      action: () => { router.push('/journal'); setIsOpen(false); },
      keywords: ['journal', 'tagebuch', 'reflexion'],
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

  // Recent tasks for quick access
  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .slice(0, 5)
      .map(t => ({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: t.priority === 'urgent' ? '🔴 Dringend' : t.priority === 'high' ? '🟠 Hoch' : '',
        icon: CheckCircle2,
        action: () => {
          // Could open task modal here
          setIsOpen(false);
        },
        keywords: [],
        category: 'task' as const
      }));
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
        // Quick add task
        addTask({
          title: quickAddTitle,
          priority: 'medium',
          status: 'todo',
          tags: [],
        });
        setQuery('');
        setIsOpen(false);
      } else if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  }, [filteredCommands, selectedIndex, isQuickAdd, quickAddTitle, addTask]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#e9e9e7] overflow-hidden animate-slideUp">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e9e9e7]">
          <Search size={18} className="text-[#9b9a97]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suchen oder + für Quick-Add..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#9b9a97]"
            autoFocus
          />
          <kbd className="px-2 py-1 text-[10px] bg-[#f7f6f3] text-[#9b9a97] rounded border border-[#e9e9e7]">
            ESC
          </kbd>
        </div>

        {/* Quick Add Mode */}
        {isQuickAdd && (
          <div className="px-4 py-3 bg-[#f0fdf4] border-b border-[#bbf7d0]">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#16a34a]" />
              <span className="text-sm text-[#16a34a] font-medium">
                Quick-Add: "{quickAddTitle || '...'}"
              </span>
            </div>
            <p className="text-xs text-[#22c55e] mt-1">Enter drücken um Aufgabe zu erstellen</p>
          </div>
        )}

        {/* Results */}
        {!isQuickAdd && (
          <div className="max-h-80 overflow-y-auto py-2">
            {/* Actions */}
            {filteredCommands.filter(c => c.category === 'action').length > 0 && (
              <div className="px-3 py-1">
                <p className="text-[10px] font-medium text-[#9b9a97] uppercase tracking-wider mb-1">Aktionen</p>
                {filteredCommands.filter(c => c.category === 'action').map((cmd, idx) => {
                  const globalIdx = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        globalIdx === selectedIndex ? 'bg-[#2383e2] text-white' : 'hover:bg-[#f7f6f3]'
                      }`}
                    >
                      <cmd.icon size={16} className={globalIdx === selectedIndex ? 'text-white' : 'text-[#9b9a97]'} />
                      <div>
                        <p className="text-sm font-medium">{cmd.title}</p>
                        {cmd.subtitle && (
                          <p className={`text-xs ${globalIdx === selectedIndex ? 'text-blue-100' : 'text-[#9b9a97]'}`}>
                            {cmd.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            {filteredCommands.filter(c => c.category === 'navigation').length > 0 && (
              <div className="px-3 py-1 mt-2">
                <p className="text-[10px] font-medium text-[#9b9a97] uppercase tracking-wider mb-1">Navigation</p>
                {filteredCommands.filter(c => c.category === 'navigation').map((cmd) => {
                  const globalIdx = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                        globalIdx === selectedIndex ? 'bg-[#2383e2] text-white' : 'hover:bg-[#f7f6f3]'
                      }`}
                    >
                      <cmd.icon size={16} className={globalIdx === selectedIndex ? 'text-white' : 'text-[#9b9a97]'} />
                      <div>
                        <p className="text-sm font-medium">{cmd.title}</p>
                        {cmd.subtitle && (
                          <p className={`text-xs ${globalIdx === selectedIndex ? 'text-blue-100' : 'text-[#9b9a97]'}`}>
                            {cmd.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredCommands.length === 0 && !isQuickAdd && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#9b9a97]">Keine Ergebnisse für "{query}"</p>
                <p className="text-xs text-[#9b9a97] mt-1">Tipp: Tippe "+" vor deinem Text für Quick-Add</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 bg-[#f7f6f3] border-t border-[#e9e9e7] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-[#9b9a97]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#e9e9e7]">↑↓</kbd>
              Navigieren
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#e9e9e7]">↵</kbd>
              Auswählen
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#9b9a97]">
            <Command size={10} />
            <span>+ K zum Öffnen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
