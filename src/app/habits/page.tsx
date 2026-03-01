'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import {
  Plus,
  Flame,
  Target,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Zap,
  Trophy,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, subWeeks, addWeeks, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Habit } from '@/types';

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const getSpecificDaysLabel = (days?: number[]) => {
  if (!days || days.length === 0) return 'Flexibel';
  return days.map((day) => dayLabels[day] || '').filter(Boolean).join(', ');
};

function CompletionRing({ rate, size = 72 }: { rate: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const color = rate >= 100 ? '#10b981' : rate >= 60 ? '#6366f1' : rate >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

export default function HabitsPage() {
  const { habits, habitCategories, goals, completeHabit, uncompleteHabit, calculateStreak } = useDataStore();
  const { openHabitModal } = useModals();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState('all');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();
  const todayEnd = endOfDay(today);

  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return null;
    return habitCategories.find((c) => c.id === categoryId) || null;
  };

  const isHabitDueOnDay = (habit: Habit, date: Date) => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'specific-days') {
      const dayOfWeek = date.getDay();
      const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return (habit.specificDays || []).includes(normalizedDay);
    }
    return true;
  };

  const wasCompletedOnDay = (habit: Habit, date: Date) =>
    (habit.completions || []).some((c) => isSameDay(new Date(c.date), date));

  const getCompletionsThisWeek = (habit: Habit) =>
    (habit.completions || []).filter((c) => {
      const d = new Date(c.date);
      return d >= weekStart && d <= weekEnd;
    }).length;

  const filteredHabits = useMemo(() => {
    const active = habits.filter((h) => h.isActive && !h.isPaused);
    if (categoryFilter === 'all') return active;
    return active.filter((h) => h.category === categoryFilter);
  }, [habits, categoryFilter]);

  const todayHabits = filteredHabits.filter((h) => isHabitDueOnDay(h, today));
  const completedToday = todayHabits.filter((h) => wasCompletedOnDay(h, today)).length;
  const completionRate = todayHabits.length > 0 ? Math.round((completedToday / todayHabits.length) * 100) : 0;
  const averageStreak =
    filteredHabits.length > 0
      ? Math.round(filteredHabits.reduce((sum, h) => sum + calculateStreak(h), 0) / filteredHabits.length)
      : 0;
  const toggleHabitCompletion = async (habit: Habit, date: Date = new Date()) => {
    const isCompleted = wasCompletedOnDay(habit, date);
    try {
      if (isCompleted) await uncompleteHabit(habit.id, date);
      else await completeHabit(habit.id, date);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gewohnheiten</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(today, 'EEEE, d. MMMM', { locale: de })} · {completedToday}/{todayHabits.length} heute erledigt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer appearance-none"
            >
              <option value="all">Alle Kategorien</option>
              {habitCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openHabitModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            <Plus size={16} />
            Neue Gewohnheit
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today progress with ring */}
        <div className="col-span-2 lg:col-span-1 flex items-center gap-4 px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm animate-fade-in-up stagger-1">
          <div className="relative flex-shrink-0">
            <CompletionRing rate={completionRate} size={72} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800">{completionRate}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Heute</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{completedToday}/{todayHabits.length}</p>
            <p className="text-xs text-gray-500">erledigt</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl animate-fade-in-up stagger-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Flame size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Ø Streak</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{averageStreak} Tage</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl animate-fade-in-up stagger-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Aktiv</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{filteredHabits.length} Habits</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl animate-fade-in-up stagger-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Perfekter Tag</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {completionRate === 100 ? '🎉 Ja!' : `${completedToday < todayHabits.length ? todayHabits.length - completedToday : 0} fehlt`}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Habits */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />
            Heute im Fokus
          </h2>
          {completionRate === 100 && todayHabits.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold animate-fade-in">
              <CheckCircle2 size={12} />
              Alles erledigt!
            </span>
          )}
        </div>

        {todayHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500">Keine aktiven Gewohnheiten für heute.</p>
            <button
              onClick={() => openHabitModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} />
              Erste Gewohnheit anlegen
            </button>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayHabits.map((habit, idx) => {
              const category = getCategoryInfo(habit.category);
              const completed = wasCompletedOnDay(habit, today);
              const streak = calculateStreak(habit);
              const linkedGoal = habit.goalId ? goals.find((g) => g.id === habit.goalId) : null;
              const frequencyLabel =
                habit.frequency === 'daily'
                  ? 'Täglich'
                  : habit.frequency === 'weekly'
                    ? `${habit.targetPerWeek || 1}x pro Woche`
                    : getSpecificDaysLabel(habit.specificDays);

              return (
                <div
                  key={habit.id}
                  className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-300 animate-fade-in-up`}
                  style={{
                    animationDelay: `${idx * 60}ms`,
                    borderColor: completed ? '#10b981' : '#e5e7eb',
                    backgroundColor: completed ? 'rgba(236, 253, 245, 0.6)' : 'white',
                  }}
                >
                  {/* Big check button */}
                  <button
                    onClick={() => void toggleHabitCompletion(habit)}
                    className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                      completed
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={completed ? 'Als offen markieren' : 'Als erledigt markieren'}
                    style={!completed && habit.color ? {
                      backgroundColor: habit.color + '20',
                      color: habit.color,
                    } : undefined}
                  >
                    {completed ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <span className="text-xl">{habit.icon || '💪'}</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openHabitModal(habit)} className="text-left w-full">
                      <p className={`font-semibold text-sm leading-snug ${completed ? 'text-emerald-800 line-through opacity-75' : 'text-gray-900'}`}>
                        {habit.title}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{habit.description}</p>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 text-[11px] font-semibold">
                        <Flame size={11} />
                        {streak} Tage
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-medium">
                        {frequencyLabel}
                      </span>
                      {category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-gray-100 bg-white text-gray-600 text-[11px] font-medium">
                          {category.emoji} {category.name}
                        </span>
                      )}
                      {linkedGoal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                          <Target size={10} />
                          {linkedGoal.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completed checkmark overlay */}
                  {completed && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly View */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays size={16} className="text-indigo-600" />
            Wochenansicht
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <p className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
              {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
            </p>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Diese Woche
            </button>
          </div>
        </div>

        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Keine Gewohnheiten für den aktuellen Filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-[260px_repeat(7,1fr)_100px] bg-gray-50/80 border-b border-gray-100">
                <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Gewohnheit</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`py-3 text-center ${isToday(day) ? 'bg-indigo-50' : ''}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {format(day, 'EEE', { locale: de })}
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
                <div className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">
                  <TrendingUp size={13} className="mx-auto" />
                </div>
              </div>

              {/* Habit rows */}
              {filteredHabits.map((habit, idx) => {
                const streak = calculateStreak(habit);
                const completionsThisWeek = getCompletionsThisWeek(habit);
                const weeklyTarget = habit.targetPerWeek || 1;
                const weeklyLabel =
                  habit.frequency === 'weekly'
                    ? `${completionsThisWeek}/${weeklyTarget}`
                    : `🔥 ${streak}`;

                return (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[260px_repeat(7,1fr)_100px] border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="px-5 py-3 flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: (habit.color || '#6366f1') + '20' }}
                      >
                        {habit.icon || '💪'}
                      </div>
                      <button onClick={() => openHabitModal(habit)} className="text-left min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{habit.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {habit.frequency === 'daily'
                            ? 'Täglich'
                            : habit.frequency === 'weekly'
                              ? `${weeklyTarget}x/Woche`
                              : getSpecificDaysLabel(habit.specificDays)}
                        </p>
                      </button>
                    </div>

                    {weekDays.map((day) => {
                      const due = isHabitDueOnDay(habit, day);
                      const completed = due && wasCompletedOnDay(habit, day);
                      const inFuture = day > todayEnd;

                      return (
                        <div
                          key={`${habit.id}-${day.toISOString()}`}
                          className={`flex items-center justify-center py-3 ${isToday(day) ? 'bg-indigo-50/40' : ''}`}
                        >
                          {due ? (
                            <button
                              onClick={() => !inFuture && void toggleHabitCompletion(habit, day)}
                              disabled={inFuture}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                completed
                                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600'
                                  : inFuture
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:scale-110'
                              }`}
                            >
                              {completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                            </button>
                          ) : (
                            <span className="text-gray-200 text-lg leading-none">·</span>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-center py-3">
                      <span className={`text-sm font-bold ${streak > 7 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {weeklyLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
