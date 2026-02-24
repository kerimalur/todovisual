'use client';

import { useMemo } from 'react';
import { ArrowRight, Calendar, CalendarClock, CheckCircle2, Plus, Target } from 'lucide-react';
import { useDataStore, useSettingsStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { Task } from '@/types';
import { addDays, format, isBefore, isSameDay, isToday, startOfDay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, PriorityBadge } from '@/components/ui';

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const formatTaskDueLabel = (date: Date): string => {
  if (isToday(date)) {
    return `Heute, ${format(date, 'HH:mm')}`;
  }
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

const formatEventLabel = (date: Date): string => {
  if (isToday(date)) {
    return `Heute ${format(date, 'HH:mm')}`;
  }
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

export function Dashboard() {
  const { tasks, events, completeTask } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();
  const settings = useSettingsStore((state) => state.settings);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived'),
    [tasks]
  );

  const importantTasks = useMemo(() => {
    const dueTodayOrOverdue = activeTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        return isToday(due) || isBefore(due, todayStart);
      })
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (dateA !== dateB) return dateA - dateB;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    if (dueTodayOrOverdue.length >= 6) {
      return dueTodayOrOverdue.slice(0, 6);
    }

    const noDateTasks = activeTasks
      .filter((task) => !task.dueDate)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return [...dueTodayOrOverdue, ...noDateTasks].slice(0, 6);
  }, [activeTasks, todayStart]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.startTime) >= todayStart)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 6),
    [events, todayStart]
  );

  const calendarStrip = useMemo(
    () =>
      weekDays.map((day) => {
        const taskCount = activeTasks.filter(
          (task) => task.dueDate && isSameDay(new Date(task.dueDate), day)
        ).length;
        const eventCount = events.filter((event) => isSameDay(new Date(event.startTime), day)).length;

        return {
          day,
          taskCount,
          eventCount,
          total: taskCount + eventCount,
        };
      }),
    [activeTasks, events, weekDays]
  );

  const greetingText = (() => {
    const hour = now.getHours();
    const base = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const trimmedName = settings.name.trim();

    if (settings.greetingStyle === 'direct') {
      return trimmedName ? `${trimmedName}, fokus auf heute.` : 'Fokus auf heute.';
    }

    if (settings.greetingStyle === 'motivational') {
      return trimmedName ? `${base}, ${trimmedName}. Heute zaehlt.` : `${base}. Heute zaehlt.`;
    }

    return trimmedName ? `${base}, ${trimmedName}` : base;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{greetingText}</h1>
          <p className="text-gray-700 mt-1">
            Heute im Fokus: {importantTasks.length} Aufgaben und {upcomingEvents.length} Termine.
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          <Card className="border border-gray-200">
            <CardHeader
              title="Wichtige Aufgaben"
              subtitle="Heute faellige oder priorisierte Punkte"
              icon={<Target size={16} className="text-indigo-700" />}
              action={
                <Link
                  href="/tasks"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
                >
                  Alle Aufgaben
                  <ArrowRight size={14} />
                </Link>
              }
            />

            <CardContent className="space-y-2">
              {importantTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-700">Keine wichtigen Aufgaben fuer heute.</p>
                </div>
              ) : (
                importantTasks.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = !!dueDate && isBefore(dueDate, todayStart) && !isToday(dueDate);

                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={task.priority} />
                            {dueDate && (
                              <span className="text-xs text-gray-700">{formatTaskDueLabel(dueDate)}</span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                Ueberfaellig
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              completeTask(task.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={13} />
                            Erledigt
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader
              title="Naechste Termine"
              subtitle="Nur die naechsten Eintraege"
              icon={<Calendar size={16} className="text-indigo-700" />}
              action={
                <Link
                  href="/calendar"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
                >
                  Kalender
                  <ArrowRight size={14} />
                </Link>
              }
            />

            <CardContent className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-700">Keine anstehenden Termine.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const start = new Date(event.startTime);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEventModal(event)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-colors"
                    >
                      <span className="truncate text-sm font-medium text-gray-900">{event.title}</span>
                      <span className="text-xs text-gray-700 whitespace-nowrap">{formatEventLabel(start)}</span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 h-fit">
          <CardHeader
            title="Kalender kompakt"
            subtitle="Woche auf einen Blick"
            icon={<Calendar size={16} className="text-indigo-700" />}
            action={
              <Link
                href="/calendar"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                Vollansicht
                <ArrowRight size={14} />
              </Link>
            }
          />

          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-1.5">
              {calendarStrip.map((item) => (
                <div
                  key={item.day.toISOString()}
                  className={`rounded-lg border px-1.5 py-2 text-center ${
                    isToday(item.day) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase text-gray-700">
                    {format(item.day, 'EE', { locale: de })}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday(item.day) ? 'text-indigo-800' : 'text-gray-900'}`}>
                    {format(item.day, 'd')}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{item.total}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {upcomingEvents.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEventModal(event)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-2 hover:border-indigo-200 hover:bg-indigo-50/30 text-left"
                >
                  <span className="truncate text-sm font-medium text-gray-900">{event.title}</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap">
                    {format(new Date(event.startTime), 'HH:mm')}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
