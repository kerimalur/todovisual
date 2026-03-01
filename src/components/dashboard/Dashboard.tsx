'use client';

import { useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Link2,
  Play,
  Plus,
  Target,
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  Flame,
  CalendarDays,
  Zap,
  Clock,
} from 'lucide-react';
import { useDataStore, useTimerStore, useAppStore, useSettingsStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { CalendarEvent, Task } from '@/types';
import {
  addDays,
  endOfDay,
  format,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { Button, PriorityBadge } from '@/components/ui';

// ── Priority visual config ──────────────────────────────────────────────────
const priorityConfig = {
  urgent: {
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    glow: 'shadow-red-100',
  },
  high: {
    border: 'border-l-orange-400',
    dot: 'bg-orange-400',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    glow: 'shadow-orange-100',
  },
  medium: {
    border: 'border-l-blue-400',
    dot: 'bg-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    glow: 'shadow-blue-50',
  },
  low: {
    border: 'border-l-gray-300',
    dot: 'bg-gray-300',
    badge: 'bg-gray-50 text-gray-500 border-gray-200',
    glow: '',
  },
};

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

type ExecutionItem =
  | { type: 'task'; id: string; title: string; date: Date; task: Task; overdue: boolean }
  | { type: 'event'; id: string; title: string; date: Date; event: CalendarEvent; linkedTask?: Task };

// ── Priority Task Card ──────────────────────────────────────────────────────
function PriorityTaskCard({
  task,
  onOpen,
  onComplete,
  onFocus,
  timerRunning,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
  onFocus: (t: Task) => void;
  timerRunning: boolean;
}) {
  const cfg = priorityConfig[task.priority];

  return (
    <div
      className={`group flex items-start gap-0 rounded-xl border border-l-4 border-gray-200 bg-white hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${cfg.border} ${cfg.glow}`}
      onClick={() => onOpen(task)}
    >
      {/* Check button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onComplete(task); }}
        className="self-stretch flex-shrink-0 w-12 flex items-center justify-center hover:bg-emerald-50 transition-colors"
        title="Als erledigt markieren"
      >
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
          <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3.5 pr-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
            {task.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                  isBefore(new Date(task.dueDate), startOfDay(new Date())) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  <Calendar size={10} />
                  {isToday(new Date(task.dueDate))
                    ? 'Heute'
                    : isTomorrow(new Date(task.dueDate))
                    ? 'Morgen'
                    : format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                </span>
              )}
              {task.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                  <Clock size={10} />
                  {task.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onFocus(task); }}
              disabled={timerRunning}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <Play size={10} />
              Fokus
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task); }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Date label helper ────────────────────────────────────────────────────────
const dateLabel = (date: Date) => {
  if (isToday(date)) return `Heute, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Morgen, ${format(date, 'HH:mm')}`;
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { tasks, events, completeTask } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();
  const { toggleZenMode } = useAppStore();
  const { startTimer, timer } = useTimerStore();
  const settings = useSettingsStore((s) => s.settings);

  const now = new Date();
  const showTomorrow = now.getHours() >= 22;
  const focusDate = showTomorrow ? addDays(now, 1) : now;
  const focusLabel = showTomorrow ? 'Morgen' : 'Heute';

  const focusStart = startOfDay(focusDate);
  const focusEnd = endOfDay(focusDate);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived'),
    [tasks]
  );

  // Top priority tasks (sorted by urgency+date, top 5)
  const priorityTasks = useMemo(() => {
    return [...activeTasks]
      .sort((a, b) => {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (diff !== 0) return diff;
        if (a.dueDate && b.dueDate)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [activeTasks]);

  // MIT
  const mitTask = priorityTasks[0] || null;

  // Today/tomorrow timeline
  const focusTimeline = useMemo(() => {
    const dueTasks = activeTasks
      .filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return isSameDay(d, focusDate) || (d <= focusEnd && !showTomorrow);
      })
      .map<ExecutionItem>((task) => ({
        type: 'task',
        id: task.id,
        title: task.title,
        date: task.dueDate ? new Date(task.dueDate) : focusStart,
        task,
        overdue: !!task.dueDate && isBefore(new Date(task.dueDate), startOfDay(now)),
      }));

    const eventItems = events
      .filter((e) => isSameDay(new Date(e.startTime), focusDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map<ExecutionItem>((event) => {
        const linkedTaskId = event.taskId || event.linkedTaskId;
        const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : undefined;
        return { type: 'event', id: event.id, title: event.title, date: new Date(event.startTime), event, linkedTask };
      });

    return [...dueTasks, ...eventItems].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeTasks, events, focusDate, focusEnd, focusStart, now, showTomorrow, tasks]);

  // Calendar strip
  const calendarStrip = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        eventCount: events.filter((e) => isSameDay(new Date(e.startTime), day)).length,
        taskCount: activeTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day)).length,
      })),
    [weekDays, events, activeTasks]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startTime) >= startOfDay(now))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5),
    [events, now]
  );

  const handleStartFocus = (task: Task) => {
    if (timer.isRunning) return;
    startTimer(task.estimatedMinutes || 25, task.id);
    toggleZenMode();
  };

  const greetingText = (() => {
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const name = settings.name.trim();
    if (settings.greetingStyle === 'direct')
      return name ? `${name}, Fokus auf das Nächste.` : 'Fokus auf das Nächste.';
    if (settings.greetingStyle === 'motivational')
      return name ? `${greeting}, ${name}. Heute zählt.` : `${greeting}. Heute zählt.`;
    return name ? `${greeting}, ${name}` : greeting;
  })();

  const compactDashboard = settings.dashboardDensity === 'compact';
  const gap = compactDashboard ? 'gap-4' : 'gap-6';

  return (
    <div className={`max-w-7xl mx-auto space-y-6`}>

      {/* ── Greeting Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Cockpit</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {greetingText}
          </h1>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
            <CalendarDays size={14} className="text-indigo-400 flex-shrink-0" />
            <span className="font-medium">{format(now, 'EEEE, d. MMMM yyyy', { locale: de })}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openTaskModal()} variant="primary" leftIcon={<Plus size={16} />}>
            Neue Aufgabe
          </Button>
          <Button onClick={() => openEventModal()} variant="secondary" leftIcon={<CalendarClock size={16} />}>
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 xl:grid-cols-3 ${gap}`}>

        {/* LEFT: Priorities + Timeline ─────────────────────────────────── */}
        <div className={`xl:col-span-2 space-y-6`}>

          {/* Priority Tasks */}
          <section className="animate-fade-in-up stagger-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h2 className="text-base font-bold text-gray-900">Prioritäten</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                  {priorityTasks.length}
                </span>
              </div>
              <Link
                href="/tasks"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                Alle anzeigen
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-2">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task) => (
                  <PriorityTaskCard
                    key={task.id}
                    task={task}
                    onOpen={openTaskDetailModal}
                    onComplete={(t) => completeTask(t.id)}
                    onFocus={handleStartFocus}
                    timerRunning={timer.isRunning}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Keine offenen Aufgaben</p>
                  <p className="text-xs text-gray-400 mt-1">Super gemacht!</p>
                </div>
              )}
            </div>
          </section>

          {/* Today / Tomorrow Timeline */}
          <section className="animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${showTomorrow ? 'bg-purple-500' : 'bg-indigo-500'} animate-pulse`} />
                <h2 className="text-base font-bold text-gray-900">
                  {focusLabel}: Aufgaben & Termine
                </h2>
                {showTomorrow && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    Vorschau
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">{format(focusDate, 'd. MMMM', { locale: de })}</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {focusTimeline.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {focusTimeline.map((item, idx) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors ${idx === 0 ? 'rounded-t-2xl' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.type === 'event' ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          {item.type === 'task' ? (
                            <Target size={14} className="text-gray-500" />
                          ) : (
                            <Calendar size={14} className="text-indigo-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                            {item.type === 'event' && item.linkedTask && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                <Link2 size={9} />
                                Verknüpft
                              </span>
                            )}
                            {item.type === 'task' && item.overdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                <AlertTriangle size={9} />
                                Überfällig
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{dateLabel(item.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.type === 'task' ? (
                          <>
                            <button
                              onClick={() => openTaskDetailModal(item.task)}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => completeTask(item.task.id)}
                              className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            >
                              ✓
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openEventModal(item.event)}
                            className="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            Öffnen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CalendarClock size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500">Für {focusLabel.toLowerCase()} ist nichts geplant.</p>
                  <button
                    onClick={() => openTaskModal()}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Plus size={14} />
                    Aufgabe hinzufügen
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT: MIT Focus + Calendar ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* MIT – Most Important Task */}
          <section className="animate-fade-in-up stagger-2">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Zap size={15} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Most Important Task</h3>
              </div>
              <div className="p-4">
                {mitTask ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{mitTask.title}</p>
                    <PriorityBadge priority={mitTask.priority} />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openTaskDetailModal(mitTask)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors text-center"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleStartFocus(mitTask)}
                        disabled={timer.isRunning}
                        className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Play size={12} />
                        Fokus starten
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-300 mb-2" />
                    <p className="text-sm text-gray-500">Keine Aufgaben offen</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Calendar compact */}
          <section className="animate-fade-in-up stagger-3">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-500" />
                  <h3 className="text-sm font-bold text-gray-900">Kalender</h3>
                </div>
                <Link
                  href="/calendar"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                >
                  Vollansicht
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="p-4 space-y-4">
                {/* Week strip */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarStrip.map((item) => (
                    <div
                      key={item.day.toISOString()}
                      className={`rounded-xl border px-1 py-2.5 text-center transition-colors cursor-default ${
                        isToday(item.day)
                          ? 'border-indigo-300 bg-indigo-600 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-[9px] font-bold uppercase tracking-wide ${isToday(item.day) ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {format(item.day, 'EE', { locale: de })}
                      </p>
                      <p className={`text-sm font-bold mt-0.5 ${isToday(item.day) ? 'text-white' : 'text-gray-900'}`}>
                        {format(item.day, 'd')}
                      </p>
                      {(item.eventCount > 0 || item.taskCount > 0) && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {item.eventCount > 0 && (
                            <span className={`w-1 h-1 rounded-full ${isToday(item.day) ? 'bg-indigo-200' : 'bg-indigo-400'}`} />
                          )}
                          {item.taskCount > 0 && (
                            <span className={`w-1 h-1 rounded-full ${isToday(item.day) ? 'bg-white/60' : 'bg-amber-400'}`} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upcoming events */}
                <div className="space-y-1">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => openEventModal(event)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-2.5 py-2 hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-all duration-150"
                      >
                        <span className="truncate text-sm font-medium text-gray-800">{event.title}</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {dateLabel(new Date(event.startTime))}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">Keine bevorstehenden Termine</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
