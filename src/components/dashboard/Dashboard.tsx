'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Play,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useDataStore, useTimerStore, useMotivationStore, useAppStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { Task } from '@/types';
import { format, isToday, isBefore, startOfDay, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { TaskService } from '@/services/taskService';
import Link from 'next/link';
import { Button, Card, CardHeader, CardContent, PriorityBadge } from '@/components/ui';

/* Task Item Component */
function TaskItem({ task }: { task: Task }) {
  const { completeTask } = useDataStore();
  const { triggerMotivation } = useMotivationStore();
  const { openTaskModal } = useModals();
  const { toggleZenMode } = useAppStore();
  const { startTimer, timer } = useTimerStore();

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
    triggerMotivation('task-complete');
  };

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.isRunning) {
      startTimer(task.estimatedMinutes || 25, task.id);
      toggleZenMode();
    }
  };

  return (
    <div
      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-100 animate-fade-in"
      onClick={() => openTaskModal(task)}
    >
      <button
        type="button"
        onClick={handleComplete}
        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0"
        title="Als erledigt markieren"
      >
        <CheckCircle2 size={12} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        <div className="flex items-center gap-2.5 mt-1.5">
          {task.dueDate && (
            <span className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded">
              <Calendar size={11} />
              {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
            </span>
          )}
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {!timer.isRunning && (
        <button
          type="button"
          onClick={handleStartFocus}
          className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
          title="Fokus starten"
        >
          <Play size={14} />
        </button>
      )}
    </div>
  );
}

/* Stat Card Component */
function StatCard({ label, value, icon: Icon, trend, color = 'gray' }: {
  label: string;
  value: number;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'gray' | 'emerald' | 'amber' | 'blue';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-600 border border-gray-200',
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200',
  };

  return (
    <Card variant="bordered" className="p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        {trend && trend.value > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full animate-fade-in">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">+{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      {trend && <div className="text-xs text-gray-400 mt-1">{trend.label}</div>}
    </Card>
  );
}

/* Main Dashboard */
export function Dashboard() {
  const { tasks, goals, habits, events } = useDataStore();
  const { openTaskModal } = useModals();
  const { toggleZenMode } = useAppStore();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = subDays(todayStart, 7);
    const lastWeekStart = subDays(weekStart, 7);

    const activeTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in-progress');
    const completedToday = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    );
    const completedThisWeek = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= weekStart
    );
    const completedLastWeek = tasks.filter(
      (t) =>
        t.status === 'completed' &&
        t.completedAt &&
        new Date(t.completedAt) >= lastWeekStart &&
        new Date(t.completedAt) < weekStart
    );

    const activeGoals = goals.filter((g) => g.progress < 100);
    const overdueTasks = activeTasks.filter((t) => t.dueDate && isBefore(new Date(t.dueDate), todayStart));
    const dueTodayTasks = activeTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));

    const weekTrend =
      completedLastWeek.length > 0
        ? Math.round(((completedThisWeek.length - completedLastWeek.length) / completedLastWeek.length) * 100)
        : completedThisWeek.length > 0
        ? 100
        : 0;

    return {
      activeTasks: activeTasks.length,
      completedToday: completedToday.length,
      completedThisWeek: completedThisWeek.length,
      activeGoals: activeGoals.length,
      overdueTasks: overdueTasks.length,
      dueTodayTasks: dueTodayTasks.length,
      weekTrend,
    };
  }, [tasks, goals]);

  const mitTask = useMemo(() => TaskService.getMIT(tasks), [tasks]);

  const priorityTasks = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
    return TaskService.prioritizeTasks(activeTasks).slice(0, 5);
  }, [tasks]);

  const dailyExecution = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
    const nextActions = TaskService.prioritizeTasks(activeTasks)
      .filter((t) => !mitTask || t.id !== mitTask.id)
      .slice(0, 2);

    const activeHabits = habits.filter((h) => h.isActive && !h.isPaused);
    const mustWinHabit = activeHabits[0] || null;

    return {
      mit: mitTask,
      nextActions,
      mustWinHabit,
    };
  }, [tasks, habits, mitTask]);

  const calendarPreview = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
    const dayCards = days.map((day) => {
      const eventCount = events.filter((event) => isSameDay(new Date(event.startTime), day)).length;
      const taskCount = activeTasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day)).length;

      return {
        day,
        eventCount,
        taskCount,
      };
    });

    const upcomingEvents = events
      .filter((event) => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);

    return {
      dayCards,
      upcomingEvents,
    };
  }, [events, tasks]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dein Cockpit</h1>
            <p className="text-gray-500 mt-1">
              Behalte den Überblick über deine wichtigsten Aufgaben und Ziele
            </p>
          </div>
          <Button onClick={() => openTaskModal()} variant="primary">
            Neue Aufgabe
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Offene Aufgaben" value={stats.activeTasks} icon={Circle} color="gray" />
        <StatCard label="Heute erledigt" value={stats.completedToday} icon={CheckCircle2} color="emerald" />
        <StatCard
          label="Diese Woche"
          value={stats.completedThisWeek}
          icon={Flame}
          color="amber"
          trend={{ value: stats.weekTrend, label: 'vs. letzte Woche' }}
        />
        <StatCard label="Aktive Ziele" value={stats.activeGoals} icon={Target} color="blue" />
      </div>

      {/* Alerts */}
      {stats.overdueTasks > 0 && (
        <div className="flex items-center gap-4 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-red-800">
              {stats.overdueTasks} überfällige {stats.overdueTasks === 1 ? 'Aufgabe' : 'Aufgaben'}
            </div>
            <div className="text-sm text-red-600">Diese Aufgaben sollten dringend bearbeitet werden</div>
          </div>
          <Link href="/tasks" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Anzeigen
          </Link>
        </div>
      )}

      {stats.dueTodayTasks > 0 && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-blue-800">
              {stats.dueTodayTasks} {stats.dueTodayTasks === 1 ? 'Aufgabe' : 'Aufgaben'} heute fällig
            </div>
            <div className="text-sm text-blue-600">Plane deine Zeit entsprechend ein</div>
          </div>
        </div>
      )}

      <Card className="mb-6 border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/60">
        <CardHeader
          title="Kalender kompakt"
          icon={<Calendar size={16} className="text-sky-600" />}
          action={
            <Link href="/calendar" className="text-sm text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1 interactive">
              Vollansicht
              <ArrowRight size={14} />
            </Link>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {calendarPreview.dayCards.map((item) => (
              <div
                key={item.day.toISOString()}
                className={`rounded-lg border px-2 py-3 text-center ${
                  isToday(item.day) ? 'border-sky-300 bg-white shadow-sm' : 'border-sky-100 bg-white/80'
                }`}
              >
                <p className="text-[10px] uppercase tracking-wide text-gray-500">{format(item.day, 'EEE', { locale: de })}</p>
                <p className={`text-base font-semibold mt-0.5 ${isToday(item.day) ? 'text-sky-700' : 'text-gray-900'}`}>
                  {format(item.day, 'd')}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">{item.eventCount} Termine</p>
                <p className="text-[11px] text-gray-500">{item.taskCount} Aufgaben</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-sky-100 bg-white/90 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 mb-2">Naechste Termine</p>
            {calendarPreview.upcomingEvents.length > 0 ? (
              <div className="space-y-1.5">
                {calendarPreview.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-gray-800">{event.title}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(event.startTime), 'EEE, HH:mm', { locale: de })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Keine anstehenden Termine in den naechsten Tagen.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MIT Card */}
      {mitTask && (
        <Card 
          onClick={() => openTaskModal(mitTask)}
          className="border-l-4 border-l-indigo-500 p-6 mb-6 cursor-pointer card-hover animate-fade-in-up"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-semibold text-indigo-600 mb-3">
                <Target size={12} />
                MOST IMPORTANT TASK
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{mitTask.title}</h2>
              {mitTask.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{mitTask.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleZenMode();
              }}
              variant="primary"
              leftIcon={<Play size={16} />}
            >
              Fokus starten
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                openTaskModal(mitTask);
              }}
              variant="secondary"
              rightIcon={<ArrowRight size={16} />}
            >
              Details
            </Button>
            {mitTask.dueDate && (
              <span className="ml-auto text-sm text-gray-500 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Calendar size={14} />
                {format(new Date(mitTask.dueDate), 'd. MMMM', { locale: de })}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Priority Tasks - Full Width */}
      <Card className="mb-6 border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40">
        <CardHeader
          title="Tages-Execution"
          icon={<Target size={16} className="text-indigo-600" />}
        />
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-white border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">1 MIT</p>
            <p className="text-sm font-medium text-gray-900">
              {dailyExecution.mit ? dailyExecution.mit.title : 'Kein MIT gesetzt – lege eine wichtige Aufgabe fest.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">2 Next Actions</p>
            {dailyExecution.nextActions.length > 0 ? (
              <ul className="space-y-1.5">
                {dailyExecution.nextActions.map((task) => (
                  <li key={task.id} className="text-sm text-gray-700">• {task.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Keine weiteren offenen Prioritäten.</p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-white border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">1 Habit-Pflicht</p>
            <p className="text-sm text-gray-700">
              {dailyExecution.mustWinHabit
                ? dailyExecution.mustWinHabit.title
                : 'Lege eine tägliche Kerngewohnheit an (z. B. Bewegung, Lesen, Planung).'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Prioritäten"
          icon={<Flame size={16} className="text-amber-600" />}
          action={
            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 interactive">
              Alle anzeigen
              <ArrowRight size={14} />
            </Link>
          }
        />
        <CardContent className="p-2">
          {priorityTasks.length > 0 ? (
            priorityTasks.map((task) => <TaskItem key={task.id} task={task} />)
          ) : (
            <div className="p-8 text-center animate-fade-in">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <p className="text-sm text-gray-500">Alles erledigt! Zeit für eine Pause.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
