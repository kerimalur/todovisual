'use client';

import { useMemo, useState } from 'react';
import {
  TrendingUp, AlertCircle, Target, CheckCircle2, Calendar, Info, X, Zap, BarChart3, Rocket, HelpCircle,
  Clock, Timer, Coffee, Activity, FileText, Download, ChevronRight, Flame, Award, PlayCircle, Pause, CalendarDays, Tag, FolderOpen
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { useDataStore } from '@/store';
import { format, subDays, startOfWeek, getWeek, subWeeks, startOfDay, endOfDay, isThisWeek, differenceInMinutes, parseISO, isSameDay, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isThisMonth, subMonths, getMonth, getYear } from 'date-fns';
import { de } from 'date-fns/locale';

// Tab types for navigation
type ProgressTab = 'overview' | 'focus' | 'weekly';

export default function ProgressPage() {
  const { tasks, goals, projects, timeEntries = [], tags = [] } = useDataStore();
  const [showVelocityModal, setShowVelocityModal] = useState(false);
  const [showGoalExplanation, setShowGoalExplanation] = useState(false);
  const [activeTab, setActiveTab] = useState<ProgressTab>('overview');
  const [selectedWeek, setSelectedWeek] = useState<number>(0); // 0 = current week, 1 = last week, etc.

  // Calculate tasks completed per day (last 7 days)
  const dailyCompletedData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const completedCount = tasks.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      }).length;

      data.push({
        day: format(date, 'EEE', { locale: de }),
        completed: completedCount,
        fullDate: format(date, 'dd.MM', { locale: de }),
      });
    }
    return data;
  }, [tasks]);

  // REAL Goal velocity data - calculated from actual completed tasks per week
  const goalVelocityData = useMemo(() => {
    const data = [];
    const completedTasks = tasks.filter(t => t.completedAt);

    // Calculate for the last 5 weeks
    for (let i = 4; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });

      const completedInWeek = completedTasks.filter(t => {
        const completedDate = new Date(t.completedAt!);
        return completedDate >= weekStart && completedDate <= weekEnd;
      }).length;

      // Calculate average as target (rolling average of previous weeks)
      const avgTarget = Math.round(completedTasks.length / 5) || 5;

      data.push({
        week: `KW ${weekNum}`,
        actual: completedInWeek,
        target: avgTarget,
      });
    }

    return data;
  }, [tasks]);

  // Check if we have any velocity data
  const hasVelocityData = goalVelocityData.some(d => d.actual > 0);

  // Stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const avgCompletionRate = dailyCompletedData.reduce((sum, d) => sum + d.completed, 0) / 7;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      avgCompletionRate: avgCompletionRate.toFixed(1),
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks, dailyCompletedData]);

  // Berechne wie sich das Tagesziel zusammensetzt
  const dailyGoalBreakdown = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Aufgaben für heute
    const todaysTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= todayStart && due <= todayEnd && t.status !== 'completed';
    });

    // Überfällige Aufgaben
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < todayStart;
    });

    // Ziel-verbundene Aufgaben
    const goalTasks = todaysTasks.filter(t => t.goalId);
    const projectTasks = todaysTasks.filter(t => t.projectId && !t.goalId);
    const freeTasks = todaysTasks.filter(t => !t.goalId && !t.projectId);

    // Gestern erledigte
    const yesterday = subDays(today, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const yesterdayCompleted = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed >= yesterdayStart && completed <= yesterdayEnd;
    }).length;

    // Heute erledigte
    const todayCompleted = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed >= todayStart && completed <= todayEnd;
    }).length;

    return {
      total: todaysTasks.length + overdueTasks.length,
      todayDue: todaysTasks.length,
      overdue: overdueTasks.length,
      goalTasks: goalTasks.length,
      projectTasks: projectTasks.length,
      freeTasks: freeTasks.length,
      yesterdayCompleted,
      todayCompleted,
    };
  }, [tasks]);

  // Active goals (all goals are active unless explicitly archived)
  const activeGoals = goals;

  // ===== FOKUS-STATISTIKEN =====
  const focusStats = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);

    // Zeit-Tracking Auswertung
    const todayEntries = timeEntries.filter(e => {
      const start = new Date(e.startTime);
      return start >= todayStart && start <= todayEnd;
    });

    const weekEntries = timeEntries.filter(e => {
      const start = new Date(e.startTime);
      return start >= weekStart && start <= todayEnd;
    });

    const monthEntries = timeEntries.filter(e => {
      const start = new Date(e.startTime);
      return start >= monthStart && start <= todayEnd;
    });

    // Berechne Gesamtzeit in Minuten
    const calculateTotalMinutes = (entries: typeof timeEntries) => {
      return entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    };

    const todayMinutes = calculateTotalMinutes(todayEntries);
    const weekMinutes = calculateTotalMinutes(weekEntries);
    const monthMinutes = calculateTotalMinutes(monthEntries);

    // Fokus-Sessions (Einträge mit mehr als 25 Minuten = Pomodoro-ähnlich)
    const focusSessions = weekEntries.filter(e => (e.duration || 0) >= 25).length;

    // Durchschnittliche Session-Länge
    const avgSessionLength = weekEntries.length > 0
      ? Math.round(weekMinutes / weekEntries.length)
      : 0;

    // Streak: Aufeinanderfolgende Tage mit erledigten Aufgaben
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const dayStart = startOfDay(checkDate);
      const dayEnd = endOfDay(checkDate);

      const hasCompletedTask = tasks.some(t => {
        if (!t.completedAt) return false;
        const completed = new Date(t.completedAt);
        return completed >= dayStart && completed <= dayEnd;
      });

      if (hasCompletedTask) {
        streak++;
      } else if (i > 0) { // Skip today if no tasks yet
        break;
      }
    }

    // Produktivste Stunde berechnen
    const hourCounts: Record<number, number> = {};
    tasks.filter(t => t.completedAt).forEach(t => {
      const hour = new Date(t.completedAt!).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Tägliche Fokuszeit für Chart (letzte 7 Tage)
    const dailyFocusData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayEntries = timeEntries.filter(e => {
        const start = new Date(e.startTime);
        return start >= dayStart && start <= dayEnd;
      });

      const minutes = calculateTotalMinutes(dayEntries);

      dailyFocusData.push({
        day: format(date, 'EEE', { locale: de }),
        minutes: minutes,
        hours: (minutes / 60).toFixed(1),
        fullDate: format(date, 'dd.MM', { locale: de }),
      });
    }

    return {
      todayMinutes,
      weekMinutes,
      monthMinutes,
      focusSessions,
      avgSessionLength,
      streak,
      mostProductiveHour: mostProductiveHour ? parseInt(mostProductiveHour[0]) : null,
      mostProductiveCount: mostProductiveHour ? mostProductiveHour[1] : 0,
      dailyFocusData,
    };
  }, [tasks, timeEntries]);

  // ===== WOCHENREPORT =====
  const weeklyReport = useMemo(() => {
    const today = new Date();
    const targetWeekStart = startOfWeek(subWeeks(today, selectedWeek), { weekStartsOn: 1 });
    const targetWeekEnd = addDays(targetWeekStart, 6);
    targetWeekEnd.setHours(23, 59, 59, 999);

    // Aufgaben in dieser Woche erledigt
    const completedThisWeek = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed >= targetWeekStart && completed <= targetWeekEnd;
    });

    // Aufgaben erstellt in dieser Woche
    const createdThisWeek = tasks.filter(t => {
      const created = new Date(t.createdAt);
      return created >= targetWeekStart && created <= targetWeekEnd;
    });

    // Zeit getrackt
    const weekTimeEntries = timeEntries.filter(e => {
      const start = new Date(e.startTime);
      return start >= targetWeekStart && start <= targetWeekEnd;
    });
    const totalMinutes = weekTimeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

    // Nach Projekt gruppieren
    const byProject: Record<string, number> = {};
    completedThisWeek.forEach(t => {
      const projectName = t.projectId
        ? (projects.find(p => p.id === t.projectId)?.title || 'Unbekannt')
        : 'Ohne Projekt';
      byProject[projectName] = (byProject[projectName] || 0) + 1;
    });

    // Nach Ziel gruppieren
    const byGoal: Record<string, number> = {};
    completedThisWeek.forEach(t => {
      const goalName = t.goalId
        ? (goals.find(g => g.id === t.goalId)?.title || 'Unbekannt')
        : 'Ohne Ziel';
      byGoal[goalName] = (byGoal[goalName] || 0) + 1;
    });

    // Nach Priorität
    const byPriority = {
      high: completedThisWeek.filter(t => t.priority === 'high').length,
      medium: completedThisWeek.filter(t => t.priority === 'medium').length,
      low: completedThisWeek.filter(t => t.priority === 'low').length,
      none: completedThisWeek.filter(t => !t.priority).length,
    };

    // Nach Tag gruppieren
    const byTag: Record<string, number> = {};
    completedThisWeek.forEach(t => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach(tagId => {
          const tag = tags.find(tg => tg.id === tagId);
          const tagName = tag?.name || tagId;
          byTag[tagName] = (byTag[tagName] || 0) + 1;
        });
      }
    });

    // Täglich erledigte Aufgaben
    const dailyData = eachDayOfInterval({ start: targetWeekStart, end: targetWeekEnd }).map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const completed = tasks.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      }).length;

      const created = tasks.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= dayStart && createdDate <= dayEnd;
      }).length;

      return {
        day: format(date, 'EEE', { locale: de }),
        fullDate: format(date, 'dd.MM'),
        completed,
        created,
      };
    });

    // Vergleich zur Vorwoche
    const prevWeekStart = subWeeks(targetWeekStart, 1);
    const prevWeekEnd = addDays(prevWeekStart, 6);
    prevWeekEnd.setHours(23, 59, 59, 999);

    const prevWeekCompleted = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed >= prevWeekStart && completed <= prevWeekEnd;
    }).length;

    const weekOverWeekChange = prevWeekCompleted > 0
      ? Math.round(((completedThisWeek.length - prevWeekCompleted) / prevWeekCompleted) * 100)
      : completedThisWeek.length > 0 ? 100 : 0;

    return {
      weekStart: targetWeekStart,
      weekEnd: targetWeekEnd,
      weekNumber: getWeek(targetWeekStart, { weekStartsOn: 1 }),
      completed: completedThisWeek.length,
      created: createdThisWeek.length,
      totalMinutes,
      byProject,
      byGoal,
      byPriority,
      byTag,
      dailyData,
      weekOverWeekChange,
      prevWeekCompleted,
    };
  }, [tasks, projects, goals, tags, timeEntries, selectedWeek]);

  // Pie Chart Daten für Projekte
  const projectPieData = useMemo(() => {
    return Object.entries(weeklyReport.byProject)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [weeklyReport.byProject]);

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e', none: '#9ca3af' };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <TrendingUp size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fortschritt</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }} className="mt-1 ml-12">Deine Statistiken, Fokuszeit und Trends</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
              : 'hover:bg-white/5'
          }`}
          style={activeTab !== 'overview' ? { color: 'rgba(255,255,255,0.4)' } : undefined}
        >
          <BarChart3 size={16} />
          Übersicht
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'focus'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
              : 'hover:bg-white/5'
          }`}
          style={activeTab !== 'focus' ? { color: 'rgba(255,255,255,0.4)' } : undefined}
        >
          <Timer size={16} />
          Fokus-Statistik
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'weekly'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
              : 'hover:bg-white/5'
          }`}
          style={activeTab !== 'weekly' ? { color: 'rgba(255,255,255,0.4)' } : undefined}
        >
          <FileText size={16} />
          Wochenreport
        </button>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Erledigt</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>von {stats.totalTasks}</p>
            </div>

            {/* Tagesziel mit Erklärung */}
            <div
              className="relative p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setShowGoalExplanation(!showGoalExplanation)}
            >
              <div className="flex items-center justify-between mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <div className="flex items-center gap-2">
                  <Target size={16} />
                  <span className="text-sm font-medium">Tagesziel</span>
                </div>
                <HelpCircle size={12} className="opacity-0 group-hover:opacity-100 text-violet-400 transition-opacity" />
              </div>
              <p className="text-2xl font-semibold text-white">{dailyGoalBreakdown.total}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {dailyGoalBreakdown.todayCompleted} erledigt
              </p>

              {/* Hover Tooltip */}
              {showGoalExplanation && (
                <div className="absolute left-0 top-full mt-2 z-50 w-80 p-4 rounded-xl shadow-2xl animate-fadeIn" style={{ background: 'rgba(20,22,40,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Target size={16} className="text-violet-400" />
                      Tagesziel-Zusammensetzung
                    </h4>
                    <button onClick={(e) => { e.stopPropagation(); setShowGoalExplanation(false); }} title="Schließen">
                      <X size={14} style={{ color: 'rgba(255,255,255,0.4)' }} className="hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>📅 Heute fällig:</span>
                      <span className="font-medium text-white">{dailyGoalBreakdown.todayDue}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>⚠️ Überfällig:</span>
                      <span className="font-medium text-red-400">{dailyGoalBreakdown.overdue}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>🎯 Für Ziele:</span>
                      <span className="font-medium text-emerald-400">{dailyGoalBreakdown.goalTasks}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>📁 Für Projekte:</span>
                      <span className="font-medium text-blue-400">{dailyGoalBreakdown.projectTasks}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>📝 Freie Aufgaben:</span>
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{dailyGoalBreakdown.freeTasks}</span>
                    </div>
                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-between items-center text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Gestern erledigt:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{dailyGoalBreakdown.yesterdayCompleted}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Heute erledigt:</span>
                        <span className="text-emerald-400 font-medium">{dailyGoalBreakdown.todayCompleted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <p className="text-xs text-violet-300">
                      💡 <strong>Tipp:</strong> Fokussiere dich auf ziel- und projektgebundene Aufgaben für maximale Produktivität!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <TrendingUp size={14} />
                <span className="text-xs font-medium">Ø pro Tag</span>
              </div>
              <p className="text-2xl font-semibold text-white">{stats.avgCompletionRate}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>letzte 7 Tage</p>
            </div>

            <div className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <AlertCircle size={14} />
                <span className="text-xs font-medium">Überfällig</span>
              </div>
              <p className="text-2xl font-semibold text-red-400">{stats.overdueTasks}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>offen</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Daily Completed Tasks */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-medium text-white mb-4">
                Erledigte Aufgaben pro Tag
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCompletedData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20,22,40,0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#ffffff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      formatter={(value) => [`${value} Aufgaben`, 'Erledigt']}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                    />
                    <Bar
                      dataKey="completed"
                      fill="#7c3aed"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Goal Velocity - Clickable */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 group hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setShowVelocityModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">
                  Ziel-Velocity (Aufgaben/Woche)
                </h3>
                <div className="flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info size={14} />
                  <span>Mehr erfahren</span>
                </div>
              </div>

              {hasVelocityData ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={goalVelocityData}>
                      <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(20,22,40,0.95)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#ffffff',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#velocityGradient)"
                        name="Tatsächlich"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Ziel"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Empty State */
                <div className="h-[200px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.15)' }}>
                    <Rocket size={28} className="text-violet-400" />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Noch keine Velocity-Daten</p>
                  <p className="text-xs max-w-[200px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Erledige Aufgaben, um deine wöchentliche Geschwindigkeit zu tracken
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Velocity Explanation Modal */}
          {showVelocityModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" style={{ background: 'rgba(0,0,0,0.7)' }}>
              <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp" style={{ background: 'rgba(20,22,40,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Velocity erklärt</h3>
                        <p className="text-white/70 text-sm">Deine Produktivitäts-Metrik</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVelocityModal(false)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/20"
                      title="Schließen"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg mt-0.5" style={{ background: 'rgba(124,58,237,0.2)' }}>
                      <BarChart3 size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Was ist Velocity?</h4>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Velocity misst, wie viele Aufgaben du pro Woche erledigst.
                        Sie hilft dir, deine Produktivität zu verstehen und realistische Ziele zu setzen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg mt-0.5" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">So wird sie berechnet</h4>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Wir zählen alle abgeschlossenen Aufgaben pro Kalenderwoche.
                        Die gestrichelte Linie zeigt deinen Durchschnitt als Zielwert.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg mt-0.5" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <Target size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Warum ist das wichtig?</h4>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Eine stabile Velocity hilft dir, Projekte besser zu planen.
                        Schwankungen zeigen, wann du überlastet warst oder freie Kapazität hattest.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <p className="text-sm text-violet-300 font-medium">
                      💡 Tipp: Versuche, deine Velocity stabil zu halten statt sie zu maximieren.
                      Konsistenz schlägt Intensität!
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => setShowVelocityModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
                  >
                    Verstanden!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Goal Progress */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-medium text-white">Ziel-Fortschritt</h3>
            </div>

            {activeGoals.length === 0 ? (
              <div className="p-8 text-center">
                <Target size={32} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Keine aktiven Ziele</p>
              </div>
            ) : (
              <div>
                {activeGoals.map((goal, idx) => {
                  const goalTasks = tasks.filter(t => t.goalId === goal.id);
                  const completedGoalTasks = goalTasks.filter(t => t.status === 'completed').length;
                  const progress = goalTasks.length > 0
                    ? Math.round((completedGoalTasks / goalTasks.length) * 100)
                    : 0;

                  return (
                    <div
                      key={goal.id}
                      className="p-4"
                      style={idx < activeGoals.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : undefined}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                          <span className="text-sm font-medium text-white">{goal.title}</span>
                        </div>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: goal.color
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {completedGoalTasks} von {goalTasks.length} Aufgaben erledigt
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== FOKUS-STATISTIK TAB ===== */}
      {activeTab === 'focus' && (
        <>
          {/* Fokus Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Timer size={16} />
                <span className="text-sm font-medium">Heute</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {focusStats.todayMinutes >= 60
                  ? `${Math.floor(focusStats.todayMinutes / 60)}h ${focusStats.todayMinutes % 60}m`
                  : `${focusStats.todayMinutes}m`
                }
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Fokuszeit</p>
            </div>

            <div className="p-5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Clock size={16} />
                <span className="text-sm font-medium">Diese Woche</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {focusStats.weekMinutes >= 60
                  ? `${Math.floor(focusStats.weekMinutes / 60)}h`
                  : `${focusStats.weekMinutes}m`
                }
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Gesamt</p>
            </div>

            <div className="p-5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Flame size={16} />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{focusStats.streak}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Tage in Folge</p>
            </div>

            <div className="p-5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <PlayCircle size={16} />
                <span className="text-sm font-medium">Sessions</span>
              </div>
              <p className="text-2xl font-bold text-white">{focusStats.focusSessions}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Diese Woche (≥25min)</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Tägliche Fokuszeit */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Fokuszeit pro Tag</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={focusStats.dailyFocusData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20,22,40,0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#ffffff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      formatter={(value) => [`${value} Minuten`, 'Fokuszeit']}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="#7c3aed"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Produktivitäts-Insights */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Produktivitäts-Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.2)' }}>
                    <Clock size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ø Session-Länge</p>
                    <p className="text-xl font-bold text-white">{focusStats.avgSessionLength} Minuten</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Zap size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Produktivste Stunde</p>
                    <p className="text-xl font-bold text-white">
                      {focusStats.mostProductiveHour !== null
                        ? `${focusStats.mostProductiveHour}:00 - ${focusStats.mostProductiveHour + 1}:00 Uhr`
                        : 'Noch keine Daten'
                      }
                    </p>
                    {focusStats.mostProductiveCount > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{focusStats.mostProductiveCount} Aufgaben erledigt</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.15)' }}>
                    <CalendarDays size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Monatliche Fokuszeit</p>
                    <p className="text-xl font-bold text-white">
                      {focusStats.monthMinutes >= 60
                        ? `${Math.floor(focusStats.monthMinutes / 60)}h ${focusStats.monthMinutes % 60}m`
                        : `${focusStats.monthMinutes}m`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tipps */}
          <div className="p-5 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Activity size={24} className="text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">💡 Fokus-Tipp</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {focusStats.streak >= 7
                    ? `Fantastisch! Du hast einen ${focusStats.streak}-Tage-Streak. Halte diesen Momentum aufrecht!`
                    : focusStats.focusSessions >= 5
                    ? 'Du hast diese Woche gute Fokus-Sessions absolviert. Versuche, mindestens 4 Stunden pro Woche zu fokussieren.'
                    : 'Starte den Zeittracker bei deiner nächsten Aufgabe, um deine Fokuszeit zu messen und deine Produktivität zu steigern.'
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== WOCHENREPORT TAB ===== */}
      {activeTab === 'weekly' && (
        <>
          {/* Week Selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedWeek(prev => prev + 1)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                title="Vorherige Woche"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="text-center">
                <h2 className="font-semibold text-white">
                  KW {weeklyReport.weekNumber}
                </h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {format(weeklyReport.weekStart, 'dd.MM.', { locale: de })} - {format(weeklyReport.weekEnd, 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
              <button
                onClick={() => setSelectedWeek(prev => Math.max(0, prev - 1))}
                disabled={selectedWeek === 0}
                className={`p-2 rounded-lg transition-colors ${
                  selectedWeek === 0 ? 'cursor-not-allowed opacity-30' : 'hover:bg-white/5'
                }`}
                style={{ color: 'rgba(255,255,255,0.6)' }}
                title="Nächste Woche"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {selectedWeek === 0 && (
              <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                Aktuelle Woche
              </span>
            )}
          </div>

          {/* Week Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Erledigt</span>
              </div>
              <p className="text-2xl font-bold text-white">{weeklyReport.completed}</p>
              <div className="flex items-center gap-1 mt-1">
                {weeklyReport.weekOverWeekChange !== 0 && (
                  <span className={`text-xs font-medium ${
                    weeklyReport.weekOverWeekChange > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {weeklyReport.weekOverWeekChange > 0 ? '+' : ''}{weeklyReport.weekOverWeekChange}%
                  </span>
                )}
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>vs. Vorwoche</span>
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Target size={16} />
                <span className="text-sm font-medium">Erstellt</span>
              </div>
              <p className="text-2xl font-bold text-white">{weeklyReport.created}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>neue Aufgaben</p>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Timer size={16} />
                <span className="text-sm font-medium">Fokuszeit</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {weeklyReport.totalMinutes >= 60
                  ? `${Math.floor(weeklyReport.totalMinutes / 60)}h`
                  : `${weeklyReport.totalMinutes}m`
                }
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>getrackt</p>
            </div>

            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Balance</span>
              </div>
              <p className={`text-2xl font-bold ${
                weeklyReport.completed >= weeklyReport.created ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                {weeklyReport.completed >= weeklyReport.created ? '+' : ''}{weeklyReport.completed - weeklyReport.created}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Erledigt vs. Erstellt</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Daily Breakdown */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Täglicher Verlauf</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyReport.dailyData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20,22,40,0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#ffffff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                    />
                    <Bar dataKey="completed" name="Erledigt" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="created" name="Erstellt" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Legend
                      formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{value}</span>}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By Project Pie */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4">Nach Projekt</h3>
              {projectPieData.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {projectPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(20,22,40,0.95)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#ffffff',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}
                        formatter={(value) => [`${value} Aufgaben`, '']}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Keine Daten</p>
                </div>
              )}
            </div>
          </div>

          {/* Priority & Tags Breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* By Priority */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                Nach Priorität
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'high', label: 'Hoch', color: PRIORITY_COLORS.high },
                  { key: 'medium', label: 'Mittel', color: PRIORITY_COLORS.medium },
                  { key: 'low', label: 'Niedrig', color: PRIORITY_COLORS.low },
                  { key: 'none', label: 'Keine', color: PRIORITY_COLORS.none },
                ].map(({ key, label, color }) => {
                  const value = weeklyReport.byPriority[key as keyof typeof weeklyReport.byPriority];
                  const percentage = weeklyReport.completed > 0 ? Math.round((value / weeklyReport.completed) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                        <span className="text-sm font-medium text-white">{value}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Goal */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                Nach Ziel
              </h3>
              {Object.keys(weeklyReport.byGoal).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(weeklyReport.byGoal)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => {
                      const goal = goals.find(g => g.title === name);
                      return (
                        <div key={name} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: goal?.color || 'rgba(255,255,255,0.3)' }}
                            />
                            <span className="text-sm truncate max-w-[150px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{name}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">{count}</span>
                        </div>
                      );
                    })
                  }
                </div>
              ) : (
                <div className="h-[140px] flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Keine ziel-gebundenen Aufgaben</p>
                </div>
              )}
            </div>
          </div>

          {/* Tags Overview */}
          {Object.keys(weeklyReport.byTag).length > 0 && (
            <div className="p-5 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Tag size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                Verwendete Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(weeklyReport.byTag)
                  .sort(([,a], [,b]) => b - a)
                  .map(([tagName, count]) => {
                    const tag = tags.find(t => t.name === tagName);
                    return (
                      <span
                        key={tagName}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                        style={{
                          backgroundColor: tag?.color ? `${tag.color}25` : 'rgba(255,255,255,0.08)',
                          color: tag?.color || 'rgba(255,255,255,0.6)'
                        }}
                      >
                        {tagName}
                        <span className="font-semibold">{count}</span>
                      </span>
                    );
                  })
                }
              </div>
            </div>
          )}

          {/* Weekly Summary */}
          <div className="p-5 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Award size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Wochenzusammenfassung</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {weeklyReport.completed === 0
                    ? 'In dieser Woche wurden noch keine Aufgaben erledigt.'
                    : weeklyReport.weekOverWeekChange > 0
                    ? `Super! Du hast ${weeklyReport.completed} Aufgaben erledigt - das sind ${weeklyReport.weekOverWeekChange}% mehr als letzte Woche!`
                    : weeklyReport.weekOverWeekChange < 0
                    ? `Du hast ${weeklyReport.completed} Aufgaben erledigt. Letzte Woche waren es ${weeklyReport.prevWeekCompleted}.`
                    : `Du hast ${weeklyReport.completed} Aufgaben erledigt - genau so viele wie letzte Woche!`
                  }
                  {weeklyReport.completed > weeklyReport.created && (
                    ` Deine Task-Balance ist positiv: Du arbeitest deine Liste ab! 🎉`
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
