'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  Play,
  ChevronRight,
  ChevronDown,
  Plus,
  BarChart3,
  Calendar,
  Clock,
  Inbox,
  Sun,
  Sunrise,
  Moon,
  Star,
  Pin,
  Tag,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Flame,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useDataStore, useTimerStore, useAppStore } from '@/store';
import { useMinimalModals } from '@/components/layout/MinimalLayout';
import { Task } from '@/types';
import { format, isToday, isTomorrow, isPast, startOfDay, startOfWeek, endOfWeek, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { TaskService } from '@/services/taskService';
import Link from 'next/link';

/* ============================================
   ANIMATED PROGRESS RING
   ============================================ */
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3f3f46"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-zinc-100">
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-zinc-500">Tagesziel</span>
      </div>
    </div>
  );
}

/* ============================================
   ANIMATED CHECKBOX
   ============================================ */
function AnimatedCheckbox({ 
  checked, 
  onCheck,
  priority = 'medium'
}: { 
  checked: boolean; 
  onCheck: () => void;
  priority?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    onCheck();
  };

  const priorityColors = {
    urgent: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-violet-500',
    low: 'border-zinc-500',
  };

  const priorityBg = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-violet-500',
    low: 'bg-zinc-500',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
        flex items-center justify-center touch-manipulation
        ${checked 
          ? `${priorityBg[priority as keyof typeof priorityBg]} border-transparent` 
          : `${priorityColors[priority as keyof typeof priorityColors]} bg-transparent`
        }
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
    >
      {checked && (
        <CheckCircle2 size={12} className="text-white" />
      )}
    </button>
  );
}

/* ============================================
   COMPACT TASK ROW
   ============================================ */
function CompactTaskRow({ 
  task, 
  onComplete,
  onOpen,
  showTags = true 
}: { 
  task: Task; 
  onComplete: () => void;
  onOpen: () => void;
  showTags?: boolean;
}) {
  const { timer } = useTimerStore();
  const { toggleZenMode } = useAppStore();
  const { startTimer } = useTimerStore();

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.isRunning) {
      startTimer(task.estimatedMinutes || 25, task.id);
      toggleZenMode();
    }
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isRecurring = task.recurring?.isActive;

  const priorityBar = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-violet-500',
    low: 'bg-zinc-600',
  };

  return (
    <div
      onClick={onOpen}
      className={`
        group relative flex items-center gap-3 py-3 px-4 
        bg-zinc-800/50 hover:bg-zinc-800
        border-b border-zinc-700/50 cursor-pointer
        transition-colors
        ${isOverdue ? 'bg-red-900/20' : ''}
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${priorityBar[task.priority]}`} />

      {/* Checkbox */}
      <div className="ml-2">
        <AnimatedCheckbox 
          checked={task.status === 'completed'} 
          onCheck={onComplete}
          priority={task.priority}
        />
      </div>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-400' : 'text-zinc-200'}`}>
            {task.title}
          </p>
          {isRecurring && (
            <RotateCcw size={12} className="text-violet-400 flex-shrink-0" />
          )}
        </div>
        
        {/* Meta info row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {hasSubtasks && (
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          
          {showTags && task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map(tag => (
                <span 
                  key={tag} 
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-violet-900/50 text-violet-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - date & actions */}
      <div className="flex items-center gap-2">
        {task.dueDate && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            isOverdue 
              ? 'bg-red-900/50 text-red-400' 
              : isDueToday 
                ? 'bg-violet-900/50 text-violet-400'
                : 'bg-zinc-700 text-zinc-400'
          }`}>
            {isOverdue 
              ? 'Überfällig' 
              : isDueToday 
                ? 'Heute' 
                : format(new Date(task.dueDate), 'd.M.', { locale: de })
            }
          </span>
        )}

        {!timer.isRunning && (
          <button
            type="button"
            onClick={handleFocus}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded bg-violet-600 text-white transition-opacity"
            title="Fokus starten"
          >
            <Play size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================
   VIEW TABS (Inbox/Today/Upcoming/Someday)
   ============================================ */
type ViewType = 'inbox' | 'today' | 'upcoming' | 'someday';

function ViewTabs({ 
  activeView, 
  onViewChange,
  counts 
}: { 
  activeView: ViewType; 
  onViewChange: (view: ViewType) => void;
  counts: Record<ViewType, number>;
}) {
  const tabs = [
    { id: 'inbox' as ViewType, label: 'Inbox', icon: Inbox },
    { id: 'today' as ViewType, label: 'Heute', icon: Sun },
    { id: 'upcoming' as ViewType, label: 'Demnächst', icon: Sunrise },
    { id: 'someday' as ViewType, label: 'Irgendwann', icon: Moon },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-800 rounded-lg">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-violet-600 text-white' 
                : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }
            `}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
            {counts[tab.id] > 0 && (
              <span className={`
                px-1.5 py-0.5 text-xs rounded
                ${isActive ? 'bg-white/20' : 'bg-zinc-700'}
              `}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================
   WEEKLY GOALS WIDGET - DYNAMISCH
   ============================================ */
function WeeklyGoalsWidget() {
  const { goals, tasks } = useDataStore();
  
  const weeklyStats = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Erledigte Aufgaben diese Woche
    const completedThisWeek = tasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      new Date(t.completedAt) >= weekStart &&
      new Date(t.completedAt) <= weekEnd
    ).length;

    // DYNAMISCHES ZIEL: Basiert auf geplanten Aufgaben für diese Woche
    const plannedThisWeek = tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'archived') return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= weekStart && due <= weekEnd;
    }).length;

    // Ziel = erledigte + noch offene geplante (mindestens 7, max 50)
    const dynamicTarget = Math.max(7, Math.min(50, completedThisWeek + plannedThisWeek));
    
    // Für Anzeige: wie viele noch zu erledigen
    const remaining = plannedThisWeek;
    
    return {
      completed: completedThisWeek,
      target: dynamicTarget,
      remaining: remaining,
      progress: Math.min((completedThisWeek / dynamicTarget) * 100, 100)
    };
  }, [tasks]);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-violet-400" />
        <span className="text-sm font-medium text-zinc-300">Wochenziel</span>
      </div>
      
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-zinc-100">{weeklyStats.completed}</span>
        <span className="text-lg text-zinc-500 mb-0.5">/ {weeklyStats.target}</span>
      </div>

      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${weeklyStats.progress}%` }}
        />
      </div>
      
      <p className="text-xs text-zinc-500 mt-2">
        {weeklyStats.remaining > 0 
          ? `${weeklyStats.remaining} geplante Aufgaben offen`
          : weeklyStats.completed > 0 
            ? 'Alle geplanten Aufgaben erledigt'
            : 'Plane Aufgaben für diese Woche'
        }
      </p>
    </div>
  );
}

/* ============================================
   PINNED TASKS SECTION
   ============================================ */
function PinnedTasks({ tasks, onComplete, onOpen }: { 
  tasks: Task[]; 
  onComplete: (id: string) => void;
  onOpen: (task: Task) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Pin size={14} className="text-orange-400" />
        <h3 className="font-medium text-zinc-300 text-sm">Angepinnt</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => onOpen(task)}
            className="group p-3 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-750 transition-colors"
          >
            <div className="flex items-start gap-3">
              <AnimatedCheckbox 
                checked={task.status === 'completed'} 
                onCheck={() => onComplete(task.id)}
                priority={task.priority}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-200 text-sm truncate">{task.title}</p>
                {task.dueDate && (
                  <p className="text-xs text-zinc-500 mt-1">
                    <Calendar size={10} className="inline mr-1" />
                    {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   QUICK ADD FIELD
   ============================================ */
function QuickAddField({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-4">
      <div className={`
        relative flex items-center gap-3 px-4 py-3 
        bg-zinc-800 border rounded-lg transition-colors
        ${isFocused 
          ? 'border-violet-500' 
          : 'border-zinc-700 hover:border-zinc-600'
        }
      `}>
        <Plus size={18} className={`transition-colors ${isFocused ? 'text-violet-400' : 'text-zinc-500'}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Neue Aufgabe hinzufügen..."
          className="flex-1 text-sm bg-transparent outline-none text-zinc-200 placeholder:text-zinc-500"
        />
        {value && (
          <button
            type="submit"
            className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded hover:bg-violet-500 transition-colors"
          >
            Hinzufügen
          </button>
        )}
      </div>
    </form>
  );
}

/* ============================================
   MAIN MODERN DASHBOARD
   ============================================ */
export function ModernDashboard() {
  const { tasks, addTask, completeTask } = useDataStore();
  const { openTaskModal, openTaskDetailModal } = useMinimalModals();
  const [activeView, setActiveView] = useState<ViewType>('today');
  const [showStats, setShowStats] = useState(false);

  // Calculate task categories
  const taskCategories = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
    
    return {
      inbox: active.filter(t => !t.dueDate && !t.tags?.length),
      today: active.filter(t => t.dueDate && (isToday(new Date(t.dueDate)) || isPast(new Date(t.dueDate)))),
      upcoming: active.filter(t => t.dueDate && !isToday(new Date(t.dueDate)) && !isPast(new Date(t.dueDate)) && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 })),
      someday: active.filter(t => t.dueDate && !isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }) || (!t.dueDate && t.tags?.length)),
      pinned: active.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 4),
    };
  }, [tasks]);

  const counts: Record<ViewType, number> = {
    inbox: taskCategories.inbox.length,
    today: taskCategories.today.length,
    upcoming: taskCategories.upcoming.length,
    someday: taskCategories.someday.length,
  };

  // Stats
  const stats = useMemo(() => {
    const completedToday = tasks.filter(t => 
      t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    ).length;
    
    // Calculate streak
    let streak = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasCompletion = tasks.some(t => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const completedDate = startOfDay(new Date(t.completedAt));
        return completedDate.getTime() === checkDate.getTime();
      });
      if (hasCompletion || i === 0) streak++;
      else break;
    }

    const totalActive = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length;
    const dailyGoal = 5;
    const progress = Math.min((completedToday / dailyGoal) * 100, 100);

    return { completedToday, streak, totalActive, progress };
  }, [tasks]);

  // Current view tasks
  const currentTasks = taskCategories[activeView];

  // MIT
  const mitTask = useMemo(() => TaskService.getMIT(tasks), [tasks]);

  // Quick add handler
  const handleQuickAdd = (title: string) => {
    addTask({
      title,
      priority: 'medium',
      status: 'todo',
      tags: [],
      dueDate: activeView === 'today' ? new Date() : undefined,
    } as any);
  };

  const today = new Date();
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }, [today]);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-zinc-100">{greeting}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {format(today, 'EEEE, d. MMMM yyyy', { locale: de })}
          </p>
          
          {/* Stats row */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 text-green-400 rounded text-sm">
              <CheckCircle2 size={12} />
              <span className="font-medium">{stats.completedToday}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded text-sm">
              <Clock size={12} />
              <span className="font-medium">{stats.totalActive} offen</span>
            </div>
            {stats.streak > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-900/30 text-orange-400 rounded text-sm">
                <Flame size={12} />
                <span className="font-medium">{stats.streak}d</span>
              </div>
            )}
          </div>
        </div>

        <ProgressRing progress={stats.progress} size={80} strokeWidth={6} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2">
          {/* Pinned Tasks */}
          <PinnedTasks 
            tasks={taskCategories.pinned} 
            onComplete={completeTask}
            onOpen={openTaskDetailModal}
          />

          {/* View Tabs */}
          <div className="mb-4">
            <ViewTabs 
              activeView={activeView} 
              onViewChange={setActiveView}
              counts={counts}
            />
          </div>

          {/* Quick Add */}
          <QuickAddField onAdd={handleQuickAdd} />

          {/* Task List */}
          <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden">
            {currentTasks.length > 0 ? (
              <div>
                {currentTasks.map(task => (
                  <CompactTaskRow 
                    key={task.id} 
                    task={task}
                    onComplete={() => completeTask(task.id)}
                    onOpen={() => openTaskDetailModal(task)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-zinc-700 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <p className="text-zinc-300 font-medium">
                  {activeView === 'inbox' ? 'Inbox ist leer' : 'Alles erledigt'}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {activeView === 'inbox' 
                    ? 'Neue Aufgaben landen hier' 
                    : 'Gut gemacht!'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Weekly Goals */}
          <WeeklyGoalsWidget />

          {/* MIT Card */}
          {mitTask && (
            <div 
              onClick={() => openTaskDetailModal(mitTask)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 cursor-pointer hover:bg-zinc-750 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-violet-400" />
                <span className="text-xs font-medium text-violet-400 uppercase">Wichtigste Aufgabe</span>
              </div>
              <p className="font-medium text-zinc-200">{mitTask.title}</p>
              
              <button
                onClick={(e) => { e.stopPropagation(); openTaskDetailModal(mitTask); }}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-violet-600 text-white text-sm font-medium rounded hover:bg-violet-500 transition-colors"
              >
                <Play size={12} />
                Starten
              </button>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Schnellzugriff</h3>
            <div className="space-y-1">
              <Link href="/tasks" className="flex items-center justify-between p-2 hover:bg-zinc-700 rounded transition-colors">
                <span className="text-sm text-zinc-400">Alle Aufgaben</span>
                <ArrowRight size={12} className="text-zinc-600" />
              </Link>
              <Link href="/calendar" className="flex items-center justify-between p-2 hover:bg-zinc-700 rounded transition-colors">
                <span className="text-sm text-zinc-400">Kalender</span>
                <ArrowRight size={12} className="text-zinc-600" />
              </Link>
              <Link href="/goals" className="flex items-center justify-between p-2 hover:bg-zinc-700 rounded transition-colors">
                <span className="text-sm text-zinc-400">Ziele</span>
                <ArrowRight size={12} className="text-zinc-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
