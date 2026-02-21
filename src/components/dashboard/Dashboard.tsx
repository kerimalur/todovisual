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
} from 'lucide-react';
import { useDataStore, useTimerStore, useAppStore } from '@/store';
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
}: {
  label: string;
  value: string | number;
  tone?: 'slate' | 'indigo' | 'emerald' | 'amber';
}) {
  const toneClasses = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-current/70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
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
      className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-indigo-200 transition-colors cursor-pointer"
      onClick={() => onOpen(task)}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onComplete(task);
        }}
        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-indigo-600 flex items-center justify-center"
        title="Als erledigt markieren"
      >
        <CheckCircle2 size={12} className="text-indigo-600 opacity-0 group-hover:opacity-100" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
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

  const [adoptingEventId, setAdoptingEventId] = useState<string | null>(null);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived'),
    [tasks]
  );

  const completedToday = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === 'completed' && task.completedAt && isToday(new Date(task.completedAt))
      ).length,
    [tasks]
  );

  const thisWeekEvents = useMemo(
    () =>
      events.filter((event) => {
        const start = new Date(event.startTime);
        return start >= weekStart && start <= weekEnd;
      }).length,
    [events, weekStart, weekEnd]
  );

  const todayEvents = useMemo(() => {
    const nowLocal = new Date();
    return events
      .filter((event) => isSameDay(new Date(event.startTime), nowLocal))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.startTime) >= todayStart)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 8),
    [events, todayStart]
  );

  const orphanEvents = useMemo(
    () => upcomingEvents.filter((event) => !event.taskId && !event.linkedTaskId),
    [upcomingEvents]
  );

  const mitTask = useMemo(() => {
    const priorityOrder: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...activeTasks].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return sorted[0] || null;
  }, [activeTasks]);

  const priorityTasks = useMemo(() => {
    return [...activeTasks]
      .sort((a, b) => {
        const priorityOrder: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })
      .slice(0, 4);
  }, [activeTasks]);

  const todayTimeline = useMemo(() => {
    const dueTasks = activeTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate <= todayEnd;
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
      const linkedTask = linkedTaskId ? tasks.find((task) => task.id === linkedTaskId) : undefined;
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
      weekDays.map((day) => {
        const eventCount = events.filter((event) => isSameDay(new Date(event.startTime), day)).length;
        const taskCount = activeTasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day)).length;
        return { day, eventCount, taskCount };
      }),
    [weekDays, events, activeTasks]
  );

  const goalsOnTrack = useMemo(() => {
    const today = new Date();
    return goals.filter((goal) => {
      const created = new Date(goal.createdAt);
      const deadline = new Date(goal.deadline);
      const total = Math.max(1, Math.floor((deadline.getTime() - created.getTime()) / 86400000));
      const elapsed = Math.max(0, Math.floor((today.getTime() - created.getTime()) / 86400000));
      const expected = Math.min(100, Math.round((elapsed / total) * 100));
      return goal.progress >= expected - 15;
    }).length;
  }, [goals]);

  const dailyHabit = useMemo(
    () => habits.find((habit) => habit.isActive && !habit.isPaused) || null,
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
        description: event.description || `Kalendereintrag ${format(new Date(event.startTime), 'd. MMM HH:mm', { locale: de })}`,
        dueDate: startOfDay(new Date(event.startTime)),
        priority: 'medium',
        status: 'todo',
        tags: ['kalender', 'termin'],
      });

      await updateEvent(event.id, {
        taskId: createdTask.id,
        linkedTaskId: createdTask.id,
      });
    } catch (error) {
      console.error('Failed to adopt event into task:', error);
      alert('Termin konnte nicht als Aufgabe übernommen werden.');
    } finally {
      setAdoptingEventId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cockpit</h1>
          <p className="text-gray-700 mt-1">
            Ein gemeinsamer Arbeitsraum für Aufgaben und Termine.
          </p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Offene Aufgaben" value={activeTasks.length} tone="slate" />
        <StatCard label="Heute erledigt" value={completedToday} tone="emerald" />
        <StatCard label="Termine diese Woche" value={thisWeekEvents} tone="indigo" />
        <StatCard label="Ziele auf Kurs" value={`${goalsOnTrack}/${goals.length}`} tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border border-gray-200">
            <CardHeader
              title="Heute: Aufgaben + Termine"
              subtitle="Gemischte Timeline für deinen Arbeitstag"
              icon={<CalendarClock size={16} className="text-indigo-700" />}
            />
            <CardContent className="space-y-2">
              {todayTimeline.length > 0 ? (
                todayTimeline.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {item.type === 'task' ? (
                          <Target size={14} className="text-gray-700" />
                        ) : (
                          <Calendar size={14} className="text-indigo-700" />
                        )}
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                        {item.type === 'event' && item.linkedTask && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <Link2 size={11} />
                            Aufgabe verknüpft
                          </span>
                        )}
                        {item.type === 'task' && item.overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            <AlertTriangle size={11} />
                            Überfällig
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{dateLabel(item.date)}</p>
                    </div>

                    {item.type === 'task' ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTaskDetailModal(item.task)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 hover:bg-gray-50 text-gray-800"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => completeTask(item.task.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Erledigt
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEventModal(item.event)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 hover:bg-gray-50 text-gray-800"
                      >
                        Öffnen
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-700">Heute sind keine Aufgaben oder Termine geplant.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/70">
            <CardHeader
              title="Zwischenweg: Termine ohne Aufgabe"
              subtitle="Mach aus relevanten Terminen direkt umsetzbare Aufgaben"
              icon={<Sparkles size={16} className="text-indigo-700" />}
            />
            <CardContent className="space-y-2">
              {orphanEvents.length > 0 ? (
                orphanEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-indigo-100 bg-white px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-700 mt-0.5">{dateLabel(new Date(event.startTime))}</p>
                    </div>
                    <button
                      onClick={() => void handleAdoptEvent(event)}
                      disabled={adoptingEventId === event.id}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Plus size={12} />
                      {adoptingEventId === event.id ? 'Übernehme...' : 'Als Aufgabe'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-indigo-200 bg-white/80 p-5 text-center">
                  <p className="text-sm text-gray-700">Alle anstehenden Termine sind bereits mit Aufgaben verknüpft.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/60">
            <CardHeader
              title="Prioritäten"
              subtitle="Deine nächsten umsetzbaren Aufgaben"
              icon={<Flame size={16} className="text-amber-700" />}
              action={
                <Link href="/tasks" className="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1">
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
                <div className="rounded-lg border border-dashed border-amber-200 bg-white p-5 text-center">
                  <p className="text-sm text-gray-700">Keine offenen Prioritäten. Sehr gut.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-gray-200">
            <CardHeader
              title="Kalender kompakt"
              subtitle="Schnellüberblick für die laufende Woche"
              icon={<Calendar size={16} className="text-indigo-700" />}
              action={
                <Link href="/calendar" className="text-sm font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1">
                  Vollansicht
                  <ArrowRight size={14} />
                </Link>
              }
            />
            <CardContent className="space-y-3">
              <div className="grid grid-cols-7 gap-1.5">
                {calendarStrip.map((item) => (
                  <div
                    key={item.day.toISOString()}
                    className={`rounded-lg border px-1.5 py-2 text-center ${isToday(item.day) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                  >
                    <p className="text-[10px] font-semibold uppercase text-gray-700">{format(item.day, 'EE', { locale: de })}</p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday(item.day) ? 'text-indigo-800' : 'text-gray-900'}`}>
                      {format(item.day, 'd')}
                    </p>
                    <p className="text-[10px] text-gray-700 mt-0.5">{item.eventCount}T</p>
                    <p className="text-[10px] text-gray-700">{item.taskCount}A</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => openEventModal(event)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-2 hover:border-indigo-200 hover:bg-indigo-50/40 text-left"
                  >
                    <span className="truncate text-sm font-medium text-gray-900">{event.title}</span>
                    <span className="text-xs text-gray-700 whitespace-nowrap">
                      {dateLabel(new Date(event.startTime))}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader
              title="Fokus-Engine"
              subtitle="MIT, Deep Work, Routine"
              icon={<Play size={16} className="text-emerald-700" />}
            />
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Most Important Task</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {mitTask ? mitTask.title : 'Keine MIT gesetzt'}
                </p>
                {mitTask && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => openTaskDetailModal(mitTask)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 hover:bg-gray-50 text-gray-800"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleStartFocus(mitTask)}
                      disabled={timer.isRunning}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    >
                      Fokus starten
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Routine heute</p>
                <p className="text-sm text-gray-900 mt-1">
                  {dailyHabit ? dailyHabit.title : 'Lege eine tägliche Kerngewohnheit fest.'}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Quick Links</p>
                <div className="mt-2 space-y-1.5">
                  <Link href="/calendar" className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 text-sm text-gray-800">
                    Kalender
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/tasks" className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 text-sm text-gray-800">
                    Aufgaben
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/goals" className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50 text-sm text-gray-800">
                    Ziele
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
