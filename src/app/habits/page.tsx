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
  Repeat,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, subWeeks, addWeeks, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Habit } from '@/types';

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const getSpecificDaysLabel = (days?: number[]) => {
  if (!days || days.length === 0) return 'Flexibel';
  return days.map((d) => dayLabels[d] || '').filter(Boolean).join(', ');
};

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
      const dow = date.getDay();
      const norm = dow === 0 ? 6 : dow - 1;
      return (habit.specificDays || []).includes(norm);
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
  const averageStreak = filteredHabits.length > 0
    ? Math.round(filteredHabits.reduce((s, h) => s + calculateStreak(h), 0) / filteredHabits.length)
    : 0;

  const toggleHabitCompletion = async (habit: Habit, date: Date = new Date()) => {
    const isCompleted = wasCompletedOnDay(habit, date);
    try {
      if (isCompleted) await uncompleteHabit(habit.id, date);
      else await completeHabit(habit.id, date);
    } catch (e) { console.error(e); }
  };

  const statCards = [
    { label: 'Heute erledigt', value: `${completedToday}/${todayHabits.length}`, color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', text: 'text-violet-300' },
    { label: 'Erfüllungsquote', value: `${completionRate}%`, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { label: 'Aktive Routinen', value: filteredHabits.length, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    { label: 'Ø Streak', value: averageStreak, color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: <Flame size={18} className="inline mr-1" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-900/30">
            <Repeat size={22} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gewohnheiten</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tägliche Routinen · Streaks · Wochenansicht</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 text-sm text-slate-600 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.95)' }}
            title="Kategorie"
          >
            <option value="all">Alle Kategorien</option>
            {habitCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => openHabitModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-pink-900/20"
            style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
          >
            <Plus size={16} /> Neue Routine
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} p-4 bg-gradient-to-br ${card.color} card-hover`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.text}`}>
              {card.icon}{card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Today Focus */}
      <div className="rounded-2xl border border-slate-200 p-5" style={{ background: 'rgba(255,255,255,0.88)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-pink-400" />
            Heute im Fokus
          </h2>
          <span className="text-xs text-slate-400">{format(today, 'EEEE, d. MMMM', { locale: de })}</span>
        </div>

        {todayHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-400">Keine aktiven Routinen für heute.</p>
            <button onClick={() => openHabitModal()}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90 mx-auto"
              style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
              <Plus size={14} /> Routine erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayHabits.map((habit) => {
              const category = getCategoryInfo(habit.category);
              const completed = wasCompletedOnDay(habit, today);
              const streak = calculateStreak(habit);
              const linkedGoal = habit.goalId ? goals.find((g) => g.id === habit.goalId) : null;
              const freqLabel = habit.frequency === 'daily' ? 'Täglich' : habit.frequency === 'weekly' ? `${habit.targetPerWeek || 1}x pro Woche` : getSpecificDaysLabel(habit.specificDays);

              return (
                <div
                  key={habit.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${
                    completed ? 'border-emerald-500/25 bg-emerald-500/08' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => void toggleHabitCompletion(habit)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                      title={completed ? 'Offen markieren' : 'Erledigt markieren'}
                    >
                      {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <button onClick={() => openHabitModal(habit)} className="text-left flex-1 min-w-0">
                      <p className={`font-semibold ${completed ? 'text-emerald-300' : 'text-slate-900'}`}>{habit.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{freqLabel}</p>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/15 text-orange-400 text-xs font-medium rounded-lg border border-orange-500/20">
                      <Flame size={11} /> {streak} Tage
                    </span>
                    {category && (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-500 bg-slate-50">
                        {category.emoji} {category.name}
                      </span>
                    )}
                    {linkedGoal && (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-400">
                        <Target size={11} /> {linkedGoal.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Week View */}
      <div className="rounded-2xl border border-slate-200 p-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.88)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-400" />
            Wochenansicht
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all" title="Vorherige Woche">
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm text-slate-600 min-w-[200px] text-center">
              {format(weekStart, 'd. MMM', { locale: de })} – {format(weekEnd, 'd. MMM yyyy', { locale: de })}
            </p>
            <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all" title="Nächste Woche">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
              Diese Woche
            </button>
          </div>
        </div>

        {filteredHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            Keine Routinen für diesen Filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-[240px_repeat(7,minmax(60px,1fr))_100px] pb-2 mb-2 border-b border-slate-200">
                <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Routine</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={`text-center px-2 py-1 rounded-lg ${isToday(day) ? 'bg-violet-500/15' : ''}`}>
                    <p className="text-[11px] uppercase text-slate-400">{format(day, 'EEE', { locale: de })}</p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday(day) ? 'text-violet-400' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
                <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 text-center">Status</div>
              </div>

              {/* Habit Rows */}
              {filteredHabits.map((habit) => {
                const streak = calculateStreak(habit);
                const completionsThisWeek = getCompletionsThisWeek(habit);
                const weeklyTarget = habit.targetPerWeek || 1;
                const weeklyLabel = habit.frequency === 'weekly' ? `${completionsThisWeek}/${weeklyTarget}` : `${streak} d`;

                return (
                  <div key={habit.id} className="grid grid-cols-[240px_repeat(7,minmax(60px,1fr))_100px] py-2 border-b border-slate-200 last:border-b-0 hover:bg-white transition-colors">
                    <div className="px-3 flex items-center">
                      <button onClick={() => openHabitModal(habit)} className="text-left">
                        <p className="font-medium text-slate-700 text-sm">{habit.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {habit.frequency === 'daily' ? 'Täglich' : habit.frequency === 'weekly' ? `${weeklyTarget}x/Woche` : getSpecificDaysLabel(habit.specificDays)}
                        </p>
                      </button>
                    </div>

                    {weekDays.map((day) => {
                      const due = isHabitDueOnDay(habit, day);
                      const completed = due && wasCompletedOnDay(habit, day);
                      const inFuture = day > todayEnd;

                      return (
                        <div key={`${habit.id}-${day.toISOString()}`} className={`flex items-center justify-center ${isToday(day) ? 'bg-violet-500/06' : ''}`}>
                          {due ? (
                            <button
                              onClick={() => !inFuture && void toggleHabitCompletion(habit, day)}
                              disabled={inFuture}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                completed ? 'bg-emerald-500 text-slate-900' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                              } ${inFuture ? 'opacity-30 cursor-not-allowed' : ''}`}
                              title={completed ? 'Offen markieren' : 'Erledigt markieren'}
                            >
                              {completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-sm">–</span>
                          )}
                        </div>
                      );
                    })}

                    <div className="px-3 flex items-center justify-center">
                      <span className="text-sm font-semibold text-slate-500">{weeklyLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
