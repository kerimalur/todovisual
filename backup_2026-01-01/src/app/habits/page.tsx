'use client';

import { useState, useMemo } from 'react';
import { useDataStore } from '@/store';
import {
  Plus,
  Flame,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Award,
  BarChart3,
  X,
  Check,
  CheckSquare,
  Clock,
  Link2,
  Home,
  Repeat
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks, isToday, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useModals } from '@/components/layout/MainLayout';
import { Habit } from '@/types';

const habitTips = [
  {
    title: 'Die 2-Minuten-Regel',
    description: 'Wenn eine neue Gewohnheit weniger als 2 Minuten dauert, mach sie sofort. Dies senkt die Hürde enorm.',
    icon: Clock,
  },
  {
    title: 'Habit Stacking',
    description: 'Verknüpfe neue Gewohnheiten mit bestehenden. "Nach dem Zähneputzen mache ich 10 Liegestütze."',
    icon: Link2,
  },
  {
    title: 'Umgebung gestalten',
    description: 'Mach gute Gewohnheiten offensichtlich und schlechte unsichtbar. Lege dein Buch neben das Bett.',
    icon: Home,
  },
  {
    title: 'Nie zweimal hintereinander',
    description: 'Ein verpasster Tag ist OK. Zwei niemals. Das ist die Regel, die Streaks am Leben hält.',
    icon: Flame,
  },
  {
    title: 'Klein anfangen',
    description: 'Starte mit 5 Minuten Meditation, nicht 30. Erfolg kommt durch Konsistenz, nicht Intensität.',
    icon: TrendingUp,
  },
];

export default function HabitsPage() {
  const { habits, completeHabit, uncompleteHabit, pauseHabit, resumeHabit, isHabitCompletedToday, getHabitCompletionsThisWeek, calculateStreak, goals, habitCategories } = useDataStore();
  const { openHabitModal } = useModals();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Helper to get category info
  const getCategoryInfo = (categoryId: string) => {
    return habitCategories.find(c => c.id === categoryId);
  };

  // Week calculations
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter habits
  const filteredHabits = useMemo(() => {
    let result = habits.filter(h => h.isActive);
    if (categoryFilter !== 'all') {
      result = result.filter(h => h.category === categoryFilter);
    }
    return result;
  }, [habits, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const activeHabits = habits.filter(h => h.isActive && !h.isPaused);
    const completedToday = activeHabits.filter(h => isHabitCompletedToday(h.id)).length;
    const totalToday = activeHabits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'specific-days') {
        const dayOfWeek = new Date().getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0
        return h.specificDays?.includes(adjustedDay);
      }
      return true; // Weekly habits count
    }).length;

    const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
    const totalCompletions = habits.reduce((acc, h) => acc + h.totalCompletions, 0);

    return { completedToday, totalToday, longestStreak, totalCompletions, activeHabits: activeHabits.length };
  }, [habits, isHabitCompletedToday]);

  // Check if habit should be shown for a specific day
  const isHabitDueOnDay = (habit: Habit, date: Date) => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'specific-days') {
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return habit.specificDays?.includes(adjustedDay);
    }
    return true; // Weekly
  };

  // Check if habit was completed on a specific day
  const wasCompletedOnDay = (habit: Habit, date: Date) => {
    return habit.completions.some(c => {
      const compDate = new Date(c.date);
      return isSameDay(compDate, date);
    });
  };

  // Toggle habit completion
  const toggleHabitCompletion = (habitId: string, date: Date = new Date()) => {
    if (wasCompletedOnDay(habits.find(h => h.id === habitId)!, date)) {
      uncompleteHabit(habitId, date);
    } else {
      completeHabit(habitId, date);
    }
  };

  // Get progress for weekly habits
  const getWeeklyProgress = (habit: Habit) => {
    const completionsThisWeek = getHabitCompletionsThisWeek(habit.id);
    const target = habit.targetPerWeek || 1;
    return { current: completionsThisWeek, target, percentage: Math.min(100, (completionsThisWeek / target) * 100) };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Repeat size={24} className="text-white" />
              </div>
              Gewohnheiten
            </h1>
            <p className="text-gray-500 mt-1">Kleine tägliche Aktionen führen zu großen Veränderungen</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTips(!showTips)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showTips 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Lightbulb size={16} />
              Tipps
            </button>
            <button
              onClick={() => openHabitModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={16} />
              Neue Gewohnheit
            </button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      {showTips && (
        <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
              <BookOpen size={20} />
              Wie du erfolgreich Gewohnheiten aufbaust
            </h2>
            <button onClick={() => setShowTips(false)} className="text-amber-600 hover:text-amber-800">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {habitTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <div key={index} className="bg-white/70 rounded-xl p-4 hover:bg-white transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                    <IconComponent size={20} className="text-amber-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedToday}/{stats.totalToday}</div>
              <div className="text-sm text-gray-500">Heute erledigt</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame size={24} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.longestStreak}</div>
              <div className="text-sm text-gray-500">Längster Streak</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeHabits}</div>
              <div className="text-sm text-gray-500">Aktive Gewohnheiten</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Award size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCompletions}</div>
              <div className="text-sm text-gray-500">Gesamt erledigt</div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="text-lg font-semibold text-gray-900">
            {format(weekStart, 'd. MMM', { locale: de })} - {format(weekEnd, 'd. MMM yyyy', { locale: de })}
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Diese Woche
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Alle Kategorien</option>
            {habitCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Habits Grid with Week View */}
      {filteredHabits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Gewohnheiten</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Starte mit kleinen, erreichbaren Gewohnheiten. Schon 5 Minuten täglich können dein Leben verändern.
          </p>
          <button
            onClick={() => openHabitModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Erste Gewohnheit erstellen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Week Header */}
          <div className="grid grid-cols-[1fr_repeat(7,minmax(60px,1fr))_100px] border-b border-gray-100 bg-gray-50">
            <div className="p-4 text-sm font-medium text-gray-500">Gewohnheit</div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center ${isToday(day) ? 'bg-indigo-50' : ''}`}
              >
                <div className="text-xs text-gray-500">{format(day, 'EEE', { locale: de })}</div>
                <div className={`text-sm font-medium ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
            <div className="p-4 text-sm font-medium text-gray-500 text-center">Fortschritt</div>
          </div>

          {/* Habits Rows */}
          {filteredHabits.map((habit) => {
            const streak = calculateStreak(habit);
            const weeklyProgress = habit.frequency === 'weekly' ? getWeeklyProgress(habit) : null;
            const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;

            return (
              <div
                key={habit.id}
                className="grid grid-cols-[1fr_repeat(7,minmax(60px,1fr))_100px] border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                {/* Habit Info */}
                <div className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => openHabitModal(habit)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform hover:scale-110"
                    style={{ backgroundColor: habit.color + '20' }}
                  >
                    {habit.icon || getCategoryInfo(habit.category)?.emoji || <Target size={18} />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{habit.title}</span>
                      {streak >= 3 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          <Flame size={12} /> {streak}
                        </span>
                      )}
                      {habit.isPaused && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Pausiert</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {linkedGoal && (
                        <span className="text-xs text-indigo-600 flex items-center gap-1">
                          <Target size={10} />
                          {linkedGoal.title}
                        </span>
                      )}
                      {habit.frequency === 'weekly' && (
                        <span className="text-xs text-gray-500">
                          {habit.targetPerWeek}x/Woche
                        </span>
                      )}
                      {habit.frequency === 'specific-days' && (
                        <span className="text-xs text-gray-500">
                          {habit.specificDays?.map(d => ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][d]).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day Checkboxes */}
                {weekDays.map((day) => {
                  const isDue = isHabitDueOnDay(habit, day);
                  const isCompleted = wasCompletedOnDay(habit, day);
                  const isFuture = day > new Date();
                  const isPast = day < subDays(new Date(), 1);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex items-center justify-center ${isToday(day) ? 'bg-indigo-50/50' : ''}`}
                    >
                      {isDue ? (
                        <button
                          onClick={() => !isFuture && toggleHabitCompletion(habit.id, day)}
                          disabled={isFuture || habit.isPaused}
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                            ${habit.isPaused ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isCompleted 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : isPast && !isFuture
                              ? 'bg-red-50 border-2 border-red-200 text-red-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                            }
                          `}
                          style={isCompleted ? { backgroundColor: habit.color } : undefined}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center text-gray-200">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Progress */}
                <div className="p-4 flex items-center justify-center">
                  {weeklyProgress ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{weeklyProgress.current}/{weeklyProgress.target}</span>
                        <span className="font-medium text-gray-700">{Math.round(weeklyProgress.percentage)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${weeklyProgress.percentage}%`,
                            backgroundColor: habit.color 
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{streak}</div>
                      <div className="text-[10px] text-gray-500">Tage</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Visualizations */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        {/* Today's Habits with Checkboxes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckSquare size={20} className="text-emerald-600" />
            Heute abhaken
          </h3>
          <div className="space-y-2">
            {filteredHabits
              .filter(h => !h.isPaused && isHabitDueOnDay(h, new Date()))
              .map((habit) => {
                const isCompleted = isHabitCompletedToday(habit.id);
                return (
                  <label
                    key={habit.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleHabitCompletion(habit.id)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-lg">{habit.icon || getCategoryInfo(habit.category)?.emoji}</span>
                    <span className={`flex-1 font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                      {habit.title}
                    </span>
                    {habit.targetValue && (
                      <span className="text-xs text-gray-500">
                        {habit.targetValue} {habit.targetUnit}
                      </span>
                    )}
                    {isCompleted && <Check size={16} className="text-emerald-600" />}
                  </label>
                );
              })}
            {filteredHabits.filter(h => !h.isPaused && isHabitDueOnDay(h, new Date())).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Keine Gewohnheiten für heute geplant
              </p>
            )}
          </div>
        </div>

        {/* Completion Progress Ring */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Tagesfortschritt
          </h3>
          <div className="flex flex-col items-center">
            {/* Progress Ring */}
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#progressGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.completedToday / Math.max(stats.totalToday, 1)) * 440} 440`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-gray-900">{stats.completedToday}</div>
                <div className="text-sm text-gray-500">von {stats.totalToday}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {stats.totalToday > 0 
                  ? Math.round((stats.completedToday / stats.totalToday) * 100) 
                  : 0}% erledigt
              </div>
              {stats.completedToday === stats.totalToday && stats.totalToday > 0 && (
                <div className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full inline-flex items-center gap-1">
                  <Award size={14} />
                  Perfekter Tag!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Overview Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" />
            Wochenübersicht
          </h3>
          <div className="space-y-3">
            {weekDays.map((day) => {
              const dayHabits = filteredHabits.filter(h => !h.isPaused && isHabitDueOnDay(h, day));
              const completedOnDay = dayHabits.filter(h => wasCompletedOnDay(h, day)).length;
              const percentage = dayHabits.length > 0 ? (completedOnDay / dayHabits.length) * 100 : 0;
              const isTodayDay = isToday(day);
              const isPast = day < new Date() && !isTodayDay;
              
              return (
                <div key={day.toISOString()} className="flex items-center gap-3">
                  <div className={`w-8 text-xs font-medium ${isTodayDay ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentage === 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                          : isPast && percentage < 100
                          ? 'bg-gradient-to-r from-orange-400 to-amber-400'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className={`w-12 text-xs text-right ${
                    percentage === 100 ? 'text-emerald-600 font-medium' : 'text-gray-500'
                  }`}>
                    {completedOnDay}/{dayHabits.length}
                  </div>
                  {percentage === 100 && dayHabits.length > 0 && (
                    <Check size={14} className="text-emerald-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Streaks Leaderboard */}
      <div className="mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Flame size={20} className="text-orange-500" />
            Streak Bestenliste
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...habits]
              .filter(h => h.isActive)
              .sort((a, b) => calculateStreak(b) - calculateStreak(a))
              .slice(0, 5)
              .map((habit, index) => {
                const streak = calculateStreak(habit);
                return (
                  <div
                    key={habit.id}
                    className={`flex flex-col items-center p-4 rounded-xl ${
                      index === 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' :
                      index === 1 ? 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200' :
                      index === 2 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200' :
                      'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2
                      ${index === 0 ? 'bg-amber-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-200 text-gray-600'}
                    `}>
                      {index + 1}
                    </div>
                    <span className="text-2xl mb-1">{habit.icon || getCategoryInfo(habit.category)?.emoji}</span>
                    <span className="text-sm font-medium text-gray-900 text-center truncate w-full">{habit.title}</span>
                    <div className="flex items-center gap-1 mt-2 text-orange-600 font-bold">
                      <Flame size={14} />
                      {streak}
                    </div>
                  </div>
                );
              })}
            {habits.filter(h => h.isActive).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4 col-span-5">
                Noch keine Streaks
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
