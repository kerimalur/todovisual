'use client';

import { ArrowRight, Calendar, CalendarClock, CheckCircle2, Plus, Target, LayoutDashboard, TrendingUp, ListTodo } from 'lucide-react';
import { useDataStore, useSettingsStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { Task } from '@/types';
import { addDays, format, isSameDay, isToday, startOfDay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0, high: 1, medium: 2, low: 3,
};

const priorityColors: Record<Task['priority'], string> = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  low: 'bg-white/6 text-white/35 border-white/10',
};

const priorityLabels: Record<Task['priority'], string> = {
  urgent: 'Dringend', high: 'Hoch', medium: 'Mittel', low: 'Niedrig',
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
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
  const completedToday = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completed = t.completedAt ? new Date(t.completedAt) : null;
    return completed && isToday(completed);
  }).length;

  const dueTodayOrOverdue = activeTasks
    .filter((t) => { if (!t.dueDate) return false; const d = new Date(t.dueDate); return isToday(d) || d.getTime() < todayStartMs; })
    .sort((a, b) => {
      const dA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (dA !== dB) return dA - dB;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const noDateTasks = activeTasks.filter((t) => !t.dueDate).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const importantTasks = dueTodayOrOverdue.length >= 6 ? dueTodayOrOverdue.slice(0, 6) : [...dueTodayOrOverdue, ...noDateTasks].slice(0, 6);

  const upcomingEvents = events
    .filter((e) => new Date(e.startTime).getTime() >= todayStartMs)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const calendarStrip = weekDays.map((day) => ({
    day,
    taskCount: activeTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day)).length,
    eventCount: events.filter((e) => isSameDay(new Date(e.startTime), day)).length,
    get total() { return this.taskCount + this.eventCount; },
  }));

  const activeGoals = goals.filter((g) => g.progress < 100);

  const greetingText = (() => {
    const hour = now.getHours();
    const base = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const name = settings.name.trim();
    if (settings.greetingStyle === 'direct') return name ? `${name}, fokus auf heute.` : 'Fokus auf heute.';
    if (settings.greetingStyle === 'motivational') return name ? `${base}, ${name}. Heute zaehlt.` : `${base}. Heute zaehlt.`;
    return name ? `${base}, ${name}` : base;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/30">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{greetingText}</h1>
          </div>
          <p className="text-white/40 text-sm ml-13 mt-1 pl-[52px]">
            {importantTasks.length} Aufgaben · {upcomingEvents.length} Termine heute
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-violet-900/20"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus size={15} /> Neue Aufgabe
          </button>
          <button
            onClick={() => openEventModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-white/70 hover:bg-white/06 hover:text-white transition-all"
          >
            <CalendarClock size={15} /> Neuer Termin
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Aktive Aufgaben', value: activeTasks.length, icon: ListTodo, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
          { label: 'Heute erledigt', value: completedToday, icon: CheckCircle2, color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', text: 'text-violet-400' },
          { label: 'Termine heute', value: upcomingEvents.filter((e) => isToday(new Date(e.startTime))).length, icon: Calendar, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
          { label: 'Aktive Ziele', value: activeGoals.length, icon: Target, color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl border ${stat.border} p-4 bg-gradient-to-br ${stat.color} card-hover`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={stat.text} />
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{stat.label}</p>
              </div>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">

        {/* Left Column */}
        <div className="space-y-5">
          {/* Important Tasks */}
          <div className="rounded-2xl border border-white/08 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-orange-400" />
                <p className="font-semibold text-white text-sm">Wichtige Aufgaben</p>
                <p className="text-white/30 text-xs">Heute fällige oder priorisierte Punkte</p>
              </div>
              <Link href="/tasks" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Alle <ArrowRight size={12} />
              </Link>
            </div>

            <div className="p-3 space-y-2">
              {importantTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/08 p-6 text-center">
                  <p className="text-sm text-white/30">Keine wichtigen Aufgaben für heute.</p>
                </div>
              ) : (
                importantTasks.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = !!dueDate && dueDate.getTime() < todayStartMs && !isToday(dueDate);
                  const pConfig = priorityColors[task.priority];
                  const pLabel = priorityLabels[task.priority];

                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className="cursor-pointer rounded-xl border border-white/06 px-4 py-3 hover:border-violet-500/25 hover:bg-white/02 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate mb-1.5">{task.title}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pConfig}`}>{pLabel}</span>
                            {dueDate && <span className="text-xs text-white/35">{formatTaskDueLabel(dueDate)}</span>}
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">Überfällig</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-all flex-shrink-0"
                        >
                          <CheckCircle2 size={12} /> Erledigt
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-2xl border border-white/08 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-blue-400" />
                <p className="font-semibold text-white text-sm">Nächste Termine</p>
              </div>
              <Link href="/calendar" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Kalender <ArrowRight size={12} />
              </Link>
            </div>

            <div className="p-3 space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/08 p-6 text-center">
                  <p className="text-sm text-white/30">Keine anstehenden Termine.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const start = new Date(event.startTime);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEventModal(event)}
                      className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/06 px-4 py-3 hover:border-violet-500/25 hover:bg-white/02 text-left transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="truncate text-sm text-white/80">{event.title}</span>
                      </div>
                      <span className="text-xs text-white/35 whitespace-nowrap flex-shrink-0">{formatEventLabel(start)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar Strip */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/08 overflow-hidden h-fit" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-blue-400" />
                <p className="font-semibold text-white text-sm">Diese Woche</p>
              </div>
              <Link href="/calendar" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Vollansicht <ArrowRight size={12} />
              </Link>
            </div>

            <div className="p-4 space-y-4">
              {/* Week Strip */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarStrip.map((item) => (
                  <div
                    key={item.day.toISOString()}
                    className={`rounded-xl border px-1 py-2.5 text-center transition-all ${
                      isToday(item.day) ? 'border-violet-500/40 bg-violet-500/15' : 'border-white/06 bg-white/02'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase" style={{ color: isToday(item.day) ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.3)' }}>
                      {format(item.day, 'EE', { locale: de })}
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday(item.day) ? 'text-violet-300' : 'text-white/60'}`}>
                      {format(item.day, 'd')}
                    </p>
                    {item.total > 0 && (
                      <p className="text-[10px] mt-0.5 text-white/25">{item.total}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Mini event list */}
              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEventModal(event)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/06 px-3 py-2 hover:border-violet-500/25 hover:bg-white/02 text-left transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="truncate text-sm text-white/70">{event.title}</span>
                    </div>
                    <span className="text-xs text-white/30 whitespace-nowrap flex-shrink-0">
                      {format(new Date(event.startTime), 'HH:mm')}
                    </span>
                  </button>
                ))}
                {upcomingEvents.length === 0 && (
                  <p className="text-xs text-center text-white/25 py-2">Keine Termine</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Goals mini */}
          {activeGoals.length > 0 && (
            <div className="rounded-2xl border border-white/08 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-orange-400" />
                  <p className="font-semibold text-white text-sm">Aktive Ziele</p>
                </div>
                <Link href="/goals" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Alle <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {activeGoals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70 truncate">{goal.title}</span>
                      <span className="text-xs text-white/35 ml-2 flex-shrink-0">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress}%`, background: goal.color || '#7c3aed' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
