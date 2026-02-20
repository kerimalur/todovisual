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
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, subWeeks, addWeeks, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Habit } from '@/types';

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const getSpecificDaysLabel = (days?: number[]) => {
  if (!days || days.length === 0) return 'Flexibel';
  return days.map((day) => dayLabels[day] || '').filter(Boolean).join(', ');
};

export default function HabitsPage() {
  const {
    habits,
    habitCategories,
    goals,
    completeHabit,
    uncompleteHabit,
    calculateStreak,
  } = useDataStore();
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
    return habitCategories.find((category) => category.id === categoryId) || null;
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

  const wasCompletedOnDay = (habit: Habit, date: Date) => {
    return (habit.completions || []).some((completion) => {
      const completionDate = new Date(completion.date);
      return isSameDay(completionDate, date);
    });
  };

  const getCompletionsThisWeek = (habit: Habit) => {
    return (habit.completions || []).filter((completion) => {
      const completionDate = new Date(completion.date);
      return completionDate >= weekStart && completionDate <= weekEnd;
    }).length;
  };

  const filteredHabits = useMemo(() => {
    const activeHabits = habits.filter((habit) => habit.isActive && !habit.isPaused);
    if (categoryFilter === 'all') return activeHabits;
    return activeHabits.filter((habit) => habit.category === categoryFilter);
  }, [habits, categoryFilter]);

  const todayHabits = filteredHabits.filter((habit) => isHabitDueOnDay(habit, today));

  const completedToday = todayHabits.filter((habit) => wasCompletedOnDay(habit, today)).length;
  const completionRate = todayHabits.length > 0 ? Math.round((completedToday / todayHabits.length) * 100) : 0;
  const activeHabitsCount = filteredHabits.length;
  const averageStreak = filteredHabits.length > 0
    ? Math.round(filteredHabits.reduce((sum, habit) => sum + calculateStreak(habit), 0) / filteredHabits.length)
    : 0;

  const toggleHabitCompletion = async (habit: Habit, date: Date = new Date()) => {
    const isCompleted = wasCompletedOnDay(habit, date);
    try {
      if (isCompleted) {
        await uncompleteHabit(habit.id, date);
      } else {
        await completeHabit(habit.id, date);
      }
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gewohnheiten</h1>
          <p className="text-gray-500 mt-1">Heute abhaken, diese Woche stabil halten, Streaks sichern.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Kategorie Filter"
          >
            <option value="all">Alle Kategorien</option>
            {habitCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openHabitModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} />
            Neue Gewohnheit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Heute erledigt</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {completedToday}/{todayHabits.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Erfuellungsquote</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completionRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aktive Gewohnheiten</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {activeHabitsCount}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ø Streak</p>
          <p className="text-2xl font-bold text-orange-600 mt-1 flex items-center gap-1">
            <Flame size={20} />
            {averageStreak}
          </p>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            Heute im Fokus
          </h2>
          <span className="text-xs text-gray-500">{format(today, 'EEEE, d. MMMM', { locale: de })}</span>
        </div>

        {todayHabits.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-600">Keine aktiven Gewohnheiten fuer heute.</p>
            <button
              onClick={() => openHabitModal()}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus size={14} />
              Gewohnheit erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayHabits.map((habit) => {
              const category = getCategoryInfo(habit.category);
              const completed = wasCompletedOnDay(habit, today);
              const streak = calculateStreak(habit);
              const linkedGoal = habit.goalId ? goals.find((goal) => goal.id === habit.goalId) : null;
              const frequencyLabel =
                habit.frequency === 'daily'
                  ? 'Taeglich'
                  : habit.frequency === 'weekly'
                  ? `${habit.targetPerWeek || 1}x pro Woche`
                  : getSpecificDaysLabel(habit.specificDays);

              return (
                <div
                  key={habit.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    completed ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void toggleHabitCompletion(habit)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={completed ? 'Als offen markieren' : 'Als erledigt markieren'}
                        >
                          {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <button
                          onClick={() => openHabitModal(habit)}
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900">{habit.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{frequencyLabel}</p>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          <Flame size={12} />
                          {streak} Tage
                        </span>
                        {category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                            {category.emoji} {category.name}
                          </span>
                        )}
                        {linkedGoal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700">
                            <Target size={11} />
                            {linkedGoal.title}
                          </span>
                        )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays size={18} className="text-indigo-600" />
            Wochenansicht
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Vorherige Woche"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-medium text-gray-700 min-w-[210px] text-center">
              {format(weekStart, 'd. MMM', { locale: de })} - {format(weekEnd, 'd. MMM yyyy', { locale: de })}
            </p>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Naechste Woche"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Diese Woche
            </button>
          </div>
        </div>

        {filteredHabits.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-600">
            Keine Gewohnheiten fuer den aktuellen Filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[280px_repeat(7,minmax(68px,1fr))_120px] border-b border-gray-100">
                <div className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Gewohnheit</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={`p-3 text-center ${isToday(day) ? 'bg-indigo-50' : ''}`}>
                    <p className="text-[11px] text-gray-500 uppercase">{format(day, 'EEE', { locale: de })}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${isToday(day) ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
                <div className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-center">Status</div>
              </div>

              {filteredHabits.map((habit) => {
                const streak = calculateStreak(habit);
                const completionsThisWeek = getCompletionsThisWeek(habit);
                const weeklyTarget = habit.targetPerWeek || 1;
                const weeklyLabel =
                  habit.frequency === 'weekly'
                    ? `${completionsThisWeek}/${weeklyTarget}`
                    : `${streak} Tage`;

                return (
                  <div key={habit.id} className="grid grid-cols-[280px_repeat(7,minmax(68px,1fr))_120px] border-b border-gray-50 last:border-b-0">
                    <div className="p-3">
                      <button
                        onClick={() => openHabitModal(habit)}
                        className="text-left"
                      >
                        <p className="font-medium text-gray-900">{habit.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {habit.frequency === 'daily'
                            ? 'Taeglich'
                            : habit.frequency === 'weekly'
                            ? `${weeklyTarget}x pro Woche`
                            : getSpecificDaysLabel(habit.specificDays)}
                        </p>
                      </button>
                    </div>

                    {weekDays.map((day) => {
                      const due = isHabitDueOnDay(habit, day);
                      const completed = due && wasCompletedOnDay(habit, day);
                      const inFuture = day > todayEnd;

                      return (
                        <div key={`${habit.id}-${day.toISOString()}`} className={`flex items-center justify-center ${isToday(day) ? 'bg-indigo-50/40' : ''}`}>
                          {due ? (
                            <button
                              onClick={() => !inFuture && void toggleHabitCompletion(habit, day)}
                              disabled={inFuture}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                completed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              } ${inFuture ? 'opacity-40 cursor-not-allowed' : ''}`}
                              title={completed ? 'Als offen markieren' : 'Als erledigt markieren'}
                            >
                              {completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </div>
                      );
                    })}

                    <div className="p-3 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">{weeklyLabel}</span>
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
