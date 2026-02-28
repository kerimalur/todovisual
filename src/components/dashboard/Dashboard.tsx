'use client';

import { useMemo, useState } from 'react';
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
  Sparkles,
  ListTodo,
  Star,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { useDataStore, useTimerStore, useAppStore, useSettingsStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { CalendarEvent, Task } from '@/types';
import {
  addDays,
  endOfDay,
  endOfWeek,
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
import { Button, Card, CardContent, CardHeader, PriorityBadge } from '@/components/ui';

type ExecutionItem =
  | {
      type: 'task';
      id: string;
      title: string;
      date: Date;
      task: Task;
      overdue: boolean;
    }
  | {
      type: 'event';
      id: string;
      title: string;
      date: Date;
      event: CalendarEvent;
      linkedTask?: Task;
    };

function StatCard({
  label,
  value,
  tone = 'slate',
  icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  tone?: 'slate' | 'indigo' | 'emerald' | 'amber';
  icon?: React.ReactNode;
  index?: number;
}) {
  const staggerClass = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'][index] ?? 'stagger-4';

  const toneConfig = {
    slate: {
      wrap: 'border-slate-200 bg-white hover:border-slate-300',
      label: 'text-slate-500',
      value: 'text-slate-900',
      iconWrap: 'bg-slate-100 text-slate-500',
    },
    indigo: {
      wrap: 'border-indigo-200 bg-indigo-50/60 hover:border-indigo-300',
      label: 'text-indigo-600',
      value: 'text-indigo-900',
      iconWrap: 'bg-indigo-100 text-indigo-600',
    },
    emerald: {
      wrap: 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300',
      label: 'text-emerald-600',
      value: 'text-emerald-900',
      iconWrap: 'bg-emerald-100 text-emerald-600',
    },
    amber: {
      wrap: 'border-amber-200 bg-amber-50/60 hover:border-amber-300',
      label: 'text-amber-600',
      value: 'text-amber-900',
      iconWrap: 'bg-amber-100 text-amber-600',
    },
  };

  const cfg = toneConfig[tone];

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 card-hover animate-fade-in-up ${staggerClass} ${cfg.wrap}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wide leading-tight ${cfg.label}`}>
          {label}
        </p>
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconWrap}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${cfg.value}`}>{value}</p>
    </div>
  );
}

function TaskRow({
  task,
  onOpen,
  onComplete,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => void;
}) {
  return (
    <div
      className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 cursor-pointer card-hover"
      onClick={() => onOpen(task)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task);
        }}
        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-500 flex items-center justify-center flex-shrink-0 transition-colors duration-150"
        title="Als erledigt markieren"
      >
        <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              <Calendar size={11} />
              {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const dateLabel = (date: Date) => {
  if (isToday(date)) return `Heute, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Morgen, ${format(date, 'HH:mm')}`;
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

export function Dashboard() {
  const { tasks, goals, habits, events, completeTask, createTask, updateEvent } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();
  const { toggleZenMode } = useAppStore();
  const { startTimer, timer } = useTimerStore();
  const settings = useSettingsStore((state) => state.settings);

  const [adoptingEventId, setAdoptingEventId] = useState<string | null>(null);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived'),
    [tasks]
  );

  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
      ).length,
    [tasks]
  );

  const thisWeekEvents = useMemo(
    () =>
      events.filter((e) => {
        const s = new Date(e.startTime);
        return s >= weekStart && s <= weekEnd;
      }).length,
    [events, weekStart, weekEnd]
  );

  const todayEvents = useMemo(() => {
    const nowLocal = new Date();
    return events
      .filter((e) => isSameDay(new Date(e.startTime), nowLocal))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startTime) >= todayStart)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 8),
    [events, todayStart]
  );

  const orphanEvents = useMemo(
    () => upcomingEvents.filter((e) => !e.taskId && !e.linkedTaskId),
    [upcomingEvents]
  );

  const mitTask = useMemo(() => {
    const order: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (
      [...activeTasks].sort((a, b) => {
        const diff = order[a.priority] - order[b.priority];
        if (diff !== 0) return diff;
        if (a.dueDate && b.dueDate)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })[0] || null
    );
  }, [activeTasks]);

  const priorityTasks = useMemo(() => {
    const order: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...activeTasks]
      .sort((a, b) => {
        const diff = order[a.priority] - order[b.priority];
        if (diff !== 0) return diff;
        if (a.dueDate && b.dueDate)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })
      .slice(0, 4);
  }, [activeTasks]);

  const todayTimeline = useMemo(() => {
    const dueTasks = activeTasks
      .filter((t) => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) <= todayEnd;
      })
      .map<ExecutionItem>((task) => ({
        type: 'task',
        id: task.id,
        title: task.title,
        date: task.dueDate ? new Date(task.dueDate) : todayStart,
        task,
        overdue: !!task.dueDate && isBefore(new Date(task.dueDate), todayStart),
      }));

    const eventItems = todayEvents.map<ExecutionItem>((event) => {
      const linkedTaskId = event.taskId || event.linkedTaskId;
      const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : undefined;
      return {
        type: 'event',
        id: event.id,
        title: event.title,
        date: new Date(event.startTime),
        event,
        linkedTask,
      };
    });

    return [...dueTasks, ...eventItems].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeTasks, tasks, todayEnd, todayEvents, todayStart]);

  const calendarStrip = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        eventCount: events.filter((e) => isSameDay(new Date(e.startTime), day)).length,
        taskCount: activeTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day)).length,
      })),
    [weekDays, events, activeTasks]
  );

  const goalsOnTrack = useMemo(() => {
    const today = new Date();
    return goals.filter((g) => {
      const created = new Date(g.createdAt);
      const deadline = new Date(g.deadline);
      const total = Math.max(1, Math.floor((deadline.getTime() - created.getTime()) / 86400000));
      const elapsed = Math.max(0, Math.floor((today.getTime() - created.getTime()) / 86400000));
      const expected = Math.min(100, Math.round((elapsed / total) * 100));
      return g.progress >= expected - 15;
    }).length;
  }, [goals]);

  const dailyHabit = useMemo(
    () => habits.find((h) => h.isActive && !h.isPaused) || null,
    [habits]
  );

  const handleStartFocus = (task: Task) => {
    if (timer.isRunning) return;
    startTimer(task.estimatedMinutes || 25, task.id);
    toggleZenMode();
  };

  const handleAdoptEvent = async (event: CalendarEvent) => {
    setAdoptingEventId(event.id);
    try {
      const createdTask = await createTask({
        title: `Termin: ${event.title}`,
        description:
          event.description ||
          `Kalendereintrag ${format(new Date(event.startTime), 'd. MMM HH:mm', { locale: de })}`,
        dueDate: startOfDay(new Date(event.startTime)),
        priority: settings.defaultTaskPriority,
        status: 'todo',
        tags: ['kalender', 'termin'],
      });
      await updateEvent(event.id, {
        taskId: createdTask.id,
        linkedTaskId: createdTask.id,
      });
    } catch (err) {
      console.error('Failed to adopt event:', err);
      alert('Termin konnte nicht als Aufgabe übernommen werden.');
    } finally {
      setAdoptingEventId(null);
    }
  };

  const compactDashboard = settings.dashboardDensity === 'compact';
  const dailyGoal = Math.max(1, settings.dailyTaskGoal);
  const dailyGoalProgress = Math.min(100, Math.round((completedToday / dailyGoal) * 100));

  const greetingText = (() => {
    const hour = now.getHours();
    const dayGreeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const name = settings.name.trim();
    if (settings.greetingStyle === 'direct')
      return name ? `${name}, Fokus auf das Nächste.` : 'Fokus auf das Nächste.';
    if (settings.greetingStyle === 'motivational')
      return name ? `${dayGreeting}, ${name}. Heute zählt.` : `${dayGreeting}. Heute zählt.`;
    return name ? `${dayGreeting}, ${name}` : dayGreeting;
  })();

  const subtitleText =
    settings.personalMotto.trim() || 'Ein gemeinsamer Arbeitsraum für Aufgaben und Termine.';

  return (
    <div className={`max-w-7xl mx-auto ${compactDashboard ? 'space-y-4' : 'space-y-6'}`}>

      {/* ── Greeting Header ── */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 animate-fade-in-up">
        <div>
          {/* Cockpit label */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Cockpit
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {greetingText}
          </h1>
          <p className="text-gray-500 mt-1 text-sm leading-relaxed">{subtitleText}</p>

          {/* Current date */}
          <div className="flex items-center gap-1.5 mt-2.5 text-sm text-gray-400">
            <CalendarDays size={14} className="text-indigo-400 flex-shrink-0" />
            <span className="font-medium">
              {format(now, 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openTaskModal()} variant="primary" leftIcon={<Plus size={16} />}>
            Neue Aufgabe
          </Button>
          <Button
            onClick={() => openEventModal()}
            variant="secondary"
            leftIcon={<CalendarClock size={16} />}
          >
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${
          compactDashboard ? 'gap-2' : 'gap-3'
        }`}
      >
        <StatCard
          label="Offene Aufgaben"
          value={activeTasks.length}
          tone="slate"
          icon={<ListTodo size={15} />}
          index={0}
        />
        <StatCard
          label={`Heute erledigt (Ziel ${dailyGoal})`}
          value={`${completedToday}/${dailyGoal}`}
          tone={completedToday >= dailyGoal ? 'emerald' : 'indigo'}
          icon={<CheckCircle2 size={15} />}
          index={1}
        />
        <StatCard
          label="Termine diese Woche"
          value={thisWeekEvents}
          tone="indigo"
          icon={<CalendarDays size={15} />}
          index={2}
        />
        <StatCard
          label="Ziele auf Kurs"
          value={`${goalsOnTrack}/${goals.length}`}
          tone="amber"
          icon={<Star size={15} />}
          index={3}
        />
      </div>

      {/* ── Daily Goal Progress Bar ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-fade-in-up stagger-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
            <TrendingUp size={13} className="text-emerald-500" />
            Tagesziel Fortschritt
          </div>
          <span className={`font-bold ${dailyGoalProgress >= 100 ? 'text-emerald-600' : 'text-gray-700'}`}>
            {dailyGoalProgress}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              dailyGoalProgress >= 100
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${dailyGoalProgress}%` }}
          />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div
        className={`grid grid-cols-1 xl:grid-cols-3 ${
          compactDashboard ? 'gap-4' : 'gap-6'
        }`}
      >
        {/* Left column (2/3) */}
        <div className={`xl:col-span-2 ${compactDashboard ? 'space-y-4' : 'space-y-6'}`}>

          {/* Today timeline */}
          <div className="animate-fade-in-up stagger-3">
            <Card className="border border-gray-200 card-hover">
              <CardHeader
                title="Heute: Aufgaben + Termine"
                subtitle="Gemischte Timeline für deinen Arbeitstag"
                icon={<CalendarClock size={16} className="text-indigo-600" />}
              />
              <CardContent className="space-y-2">
                {todayTimeline.length > 0 ? (
                  todayTimeline.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-150"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.type === 'task' ? (
                            <Target size={14} className="text-gray-500 flex-shrink-0" />
                          ) : (
                            <Calendar size={14} className="text-indigo-600 flex-shrink-0" />
                          )}
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.title}
                          </p>
                          {item.type === 'event' && item.linkedTask && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <Link2 size={11} />
                              Verknüpft
                            </span>
                          )}
                          {item.type === 'task' && item.overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              <AlertTriangle size={11} />
                              Überfällig
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{dateLabel(item.date)}</p>
                      </div>

                      {item.type === 'task' ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openTaskDetailModal(item.task)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => completeTask(item.task.id)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            Erledigt
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openEventModal(item.event)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors flex-shrink-0"
                        >
                          Öffnen
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                    <CalendarClock size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      Heute sind keine Aufgaben oder Termine geplant.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Orphan events */}
          <div className="animate-fade-in-up stagger-4">
            <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 card-hover">
              <CardHeader
                title="Termine ohne Aufgabe"
                subtitle="Mach aus relevanten Terminen direkt umsetzbare Aufgaben"
                icon={<Sparkles size={16} className="text-indigo-600" />}
              />
              <CardContent className="space-y-2">
                {orphanEvents.length > 0 ? (
                  orphanEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {dateLabel(new Date(event.startTime))}
                        </p>
                      </div>
                      <button
                        onClick={() => void handleAdoptEvent(event)}
                        disabled={adoptingEventId === event.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        <Plus size={12} />
                        {adoptingEventId === event.id ? 'Übernehme…' : 'Als Aufgabe'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-indigo-200 bg-white/80 p-5 text-center">
                    <CheckCircle2 size={20} className="mx-auto text-indigo-300 mb-1.5" />
                    <p className="text-sm text-gray-500">
                      Alle Termine sind bereits mit Aufgaben verknüpft.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Priority tasks */}
          <div className="animate-fade-in-up stagger-5">
            <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 card-hover">
              <CardHeader
                title="Prioritäten"
                subtitle="Deine nächsten umsetzbaren Aufgaben"
                icon={<Flame size={16} className="text-amber-600" />}
                action={
                  <Link
                    href="/tasks"
                    className="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
                  >
                    Alle Aufgaben
                    <ArrowRight size={14} />
                  </Link>
                }
              />
              <CardContent className="space-y-2">
                {priorityTasks.length > 0 ? (
                  priorityTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onOpen={openTaskDetailModal}
                      onComplete={(t) => completeTask(t.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-white/80 p-5 text-center">
                    <Star size={20} className="mx-auto text-amber-300 mb-1.5" />
                    <p className="text-sm text-gray-500">Keine offenen Prioritäten. Sehr gut.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className={compactDashboard ? 'space-y-4' : 'space-y-6'}>

          {/* Calendar strip */}
          <div className="animate-fade-in-up stagger-4">
            <Card className="border border-gray-200 card-hover">
              <CardHeader
                title="Kalender kompakt"
                subtitle="Schnellüberblick für die laufende Woche"
                icon={<Calendar size={16} className="text-indigo-600" />}
                action={
                  <Link
                    href="/calendar"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                  >
                    Vollansicht
                    <ArrowRight size={14} />
                  </Link>
                }
              />
              <CardContent className="space-y-3">
                <div className="grid grid-cols-7 gap-1">
                  {calendarStrip.map((item) => (
                    <div
                      key={item.day.toISOString()}
                      className={`rounded-lg border px-1 py-2 text-center transition-colors ${
                        isToday(item.day)
                          ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <p
                        className={`text-[9px] font-bold uppercase tracking-wide ${
                          isToday(item.day) ? 'text-indigo-200' : 'text-gray-500'
                        }`}
                      >
                        {format(item.day, 'EE', { locale: de })}
                      </p>
                      <p
                        className={`text-sm font-bold mt-0.5 ${
                          isToday(item.day) ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {format(item.day, 'd')}
                      </p>
                      {(item.eventCount > 0 || item.taskCount > 0) && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {item.eventCount > 0 && (
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isToday(item.day) ? 'bg-indigo-200' : 'bg-indigo-400'
                              }`}
                            />
                          )}
                          {item.taskCount > 0 && (
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isToday(item.day) ? 'bg-white/60' : 'bg-amber-400'
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openEventModal(event)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-2 hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-all duration-150"
                    >
                      <span className="truncate text-sm font-medium text-gray-800">
                        {event.title}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {dateLabel(new Date(event.startTime))}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Focus Engine */}
          <div className="animate-fade-in-up stagger-5">
            <Card className="border border-gray-200 card-hover">
              <CardHeader
                title="Fokus-Engine"
                subtitle="MIT, Deep Work, Routine"
                icon={<Play size={16} className="text-emerald-600" />}
              />
              <CardContent className="space-y-3">
                {/* MIT */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Most Important Task
                  </p>
                  {mitTask ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {mitTask.title}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          onClick={() => openTaskDetailModal(mitTask)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleStartFocus(mitTask)}
                          disabled={timer.isRunning}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          <Play size={11} />
                          Fokus starten
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Keine MIT gesetzt</p>
                  )}
                </div>

                {/* Daily habit */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Routine heute
                  </p>
                  <p className="text-sm text-gray-700">
                    {dailyHabit ? dailyHabit.title : 'Lege eine tägliche Kerngewohnheit fest.'}
                  </p>
                </div>

                {/* Quick links */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Quick Links
                  </p>
                  <div className="space-y-0.5">
                    {[
                      { href: '/calendar', label: 'Kalender' },
                      { href: '/tasks', label: 'Aufgaben' },
                      { href: '/goals', label: 'Ziele' },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-gray-100 text-sm text-gray-700 transition-colors group"
                      >
                        {link.label}
                        <ArrowRight
                          size={13}
                          className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
