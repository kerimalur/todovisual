'use client';

import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Plus,
  Target,
  LayoutDashboard,
  ListTodo,
} from 'lucide-react';
import { useDataStore, useSettingsStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { Task } from '@/types';
import { addDays, format, isSameDay, isToday, startOfDay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityColors: Record<Task['priority'], string> = {
  urgent: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  low: 'bg-white/10 text-white/60 border-white/15',
};

const priorityLabels: Record<Task['priority'], string> = {
  urgent: 'Dringend',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const formatTaskDueLabel = (date: Date): string => {
  if (isToday(date)) return `Heute, ${format(date, 'HH:mm')}`;
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

const formatEventLabel = (date: Date): string => {
  if (isToday(date)) return `Heute ${format(date, 'HH:mm')}`;
  return format(date, 'EEE, d. MMM HH:mm', { locale: de });
};

export function Dashboard() {
  const { tasks, events, goals, completeTask } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();
  const settings = useSettingsStore((state) => state.settings);

  const now = new Date();
  const todayStartMs = startOfDay(now).getTime();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedToday = tasks.filter((task) => {
    if (task.status !== 'completed') return false;
    const completed = task.completedAt ? new Date(task.completedAt) : null;
    return completed && isToday(completed);
  }).length;

  const dueTodayOrOverdue = activeTasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return isToday(dueDate) || dueDate.getTime() < todayStartMs;
    })
    .sort((taskA, taskB) => {
      const dueA = taskA.dueDate ? new Date(taskA.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dueB = taskB.dueDate ? new Date(taskB.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (dueA !== dueB) return dueA - dueB;
      return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
    });

  const noDateTasks = activeTasks
    .filter((task) => !task.dueDate)
    .sort((taskA, taskB) => priorityOrder[taskA.priority] - priorityOrder[taskB.priority]);

  const importantTasks =
    dueTodayOrOverdue.length >= 8
      ? dueTodayOrOverdue.slice(0, 8)
      : [...dueTodayOrOverdue, ...noDateTasks].slice(0, 8);

  const upcomingEvents = events
    .filter((event) => new Date(event.startTime).getTime() >= todayStartMs)
    .sort((eventA, eventB) => new Date(eventA.startTime).getTime() - new Date(eventB.startTime).getTime());

  const calendarStrip = weekDays.map((day) => {
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
  });

  const activeGoals = goals.filter((goal) => goal.progress < 100);

  const greetingText = (() => {
    const hour = now.getHours();
    const base = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const name = settings.name.trim();

    if (settings.greetingStyle === 'direct') return name ? `${name}, Fokus fuer heute.` : 'Fokus fuer heute.';
    if (settings.greetingStyle === 'motivational') return name ? `${base}, ${name}. Heute zaehlt.` : `${base}. Heute zaehlt.`;
    return name ? `${base}, ${name}` : base;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-950/35">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#f4f6ff]">{greetingText}</h1>
          </div>
          <p className="text-white/55 text-sm pl-[52px]">
            {importantTasks.length} priorisierte Aufgaben und {upcomingEvents.length} kommende Termine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-lg shadow-indigo-950/35"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b7cff)' }}
          >
            <Plus size={15} /> Neue Aufgabe
          </button>
          <button
            onClick={() => openEventModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/14 text-white/75 hover:bg-white/8 hover:text-white transition-colors"
          >
            <CalendarClock size={15} /> Neuer Termin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Aktive Aufgaben',
            value: activeTasks.length,
            icon: ListTodo,
            color: 'from-emerald-500/24 to-emerald-500/8',
            border: 'border-emerald-300/25',
            text: 'text-emerald-200',
          },
          {
            label: 'Heute erledigt',
            value: completedToday,
            icon: CheckCircle2,
            color: 'from-violet-500/24 to-violet-500/8',
            border: 'border-violet-300/25',
            text: 'text-violet-200',
          },
          {
            label: 'Termine heute',
            value: upcomingEvents.filter((event) => isToday(new Date(event.startTime))).length,
            icon: Calendar,
            color: 'from-sky-500/24 to-sky-500/8',
            border: 'border-sky-300/25',
            text: 'text-sky-200',
          },
          {
            label: 'Aktive Ziele',
            value: activeGoals.length,
            icon: Target,
            color: 'from-amber-500/24 to-amber-500/8',
            border: 'border-amber-300/25',
            text: 'text-amber-200',
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className={`rounded-2xl border ${stat.border} p-4 bg-gradient-to-br ${stat.color} card-hover`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={stat.text} />
                <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{stat.label}</p>
              </div>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-white/10 p-5 bg-white/5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-sky-300" />
              <p className="font-semibold text-[#f2f4ff]">Diese Woche</p>
            </div>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-violet-200 hover:text-white font-medium transition-colors">
              Kalender oeffnen <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {calendarStrip.map((item) => (
              <div
                key={item.day.toISOString()}
                className={`rounded-xl border px-2.5 py-3.5 min-h-[108px] transition-colors ${
                  isToday(item.day)
                    ? 'border-violet-300/45 bg-violet-300/20'
                    : 'border-white/10 bg-white/4'
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase ${isToday(item.day) ? 'text-violet-100' : 'text-white/45'}`}>
                  {format(item.day, 'EE', { locale: de })}
                </p>
                <p className={`text-xl font-bold mt-1 ${isToday(item.day) ? 'text-white' : 'text-white/85'}`}>
                  {format(item.day, 'd')}
                </p>
                <div className="mt-3 space-y-1 text-[11px] text-white/55">
                  <p>{item.taskCount} Aufgaben</p>
                  <p>{item.eventCount} Termine</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {upcomingEvents.slice(0, 4).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => openEventModal(event)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3.5 py-3 text-left hover:border-violet-300/35 hover:bg-white/7 transition-colors"
              >
                <span className="text-sm text-white/85 truncate">{event.title}</span>
                <span className="text-xs text-white/50 whitespace-nowrap">{formatEventLabel(new Date(event.startTime))}</span>
              </button>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-white/45 col-span-full">Keine Termine in den naechsten Tagen.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-amber-300" />
              <p className="font-semibold text-[#f2f4ff] text-sm">Wichtige Aufgaben</p>
            </div>
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-violet-200 hover:text-white font-medium transition-colors">
              Alle Aufgaben <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-3 space-y-2.5">
            {importantTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/12 p-6 text-center text-sm text-white/45">
                Keine priorisierten Aufgaben fuer heute.
              </div>
            ) : (
              importantTasks.map((task) => {
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = !!dueDate && dueDate.getTime() < todayStartMs && !isToday(dueDate);
                const priorityClass = priorityColors[task.priority];
                const priorityLabel = priorityLabels[task.priority];

                return (
                  <div
                    key={task.id}
                    onClick={() => openTaskDetailModal(task)}
                    className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 hover:border-violet-300/35 hover:bg-white/7 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate mb-1.5">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityClass}`}>
                            {priorityLabel}
                          </span>
                          {dueDate && <span className="text-xs text-white/55">{formatTaskDueLabel(dueDate)}</span>}
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                              Ueberfaellig
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          completeTask(task.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 transition-colors flex-shrink-0"
                      >
                        <CheckCircle2 size={12} /> Erledigt
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-sky-300" />
              <p className="font-semibold text-[#f2f4ff] text-sm">Naechste Termine</p>
            </div>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-violet-200 hover:text-white font-medium transition-colors">
              Zum Kalender <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-3 space-y-2.5">
            {upcomingEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/12 p-6 text-center text-sm text-white/45">
                Keine anstehenden Termine.
              </div>
            ) : (
              upcomingEvents.slice(0, 8).map((event) => {
                const start = new Date(event.startTime);
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEventModal(event)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3 hover:border-violet-300/35 hover:bg-white/7 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-sky-300 flex-shrink-0" />
                      <span className="truncate text-sm text-white/85">{event.title}</span>
                    </div>
                    <span className="text-xs text-white/50 whitespace-nowrap flex-shrink-0">{formatEventLabel(start)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {activeGoals.length > 0 && (
          <section className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-amber-300" />
                <p className="font-semibold text-[#f2f4ff] text-sm">Aktive Ziele</p>
              </div>
              <Link href="/goals" className="flex items-center gap-1 text-xs text-violet-200 hover:text-white font-medium transition-colors">
                Alle Ziele <ArrowRight size={12} />
              </Link>
            </div>

            <div className="p-4 space-y-3">
              {activeGoals.slice(0, 6).map((goal) => (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80 truncate">{goal.title}</span>
                    <span className="text-xs text-white/55 ml-2 flex-shrink-0">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${goal.progress}%`, background: goal.color || '#7c3aed' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
