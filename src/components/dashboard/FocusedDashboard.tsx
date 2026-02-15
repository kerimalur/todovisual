'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Play,
  ChevronRight,
  ChevronDown,
  Plus,
  BarChart3,
  Calendar,
  Clock,
} from 'lucide-react';
import { useDataStore, useTimerStore, useAppStore } from '@/store';
import { useMinimalModals } from '@/components/layout/MinimalLayout';
import { Task } from '@/types';
import { format, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { TaskService } from '@/services/taskService';

/* Minimale Task-Komponente - Fokussiert auf das Wesentliche */
function TaskRow({ task, showSubtasks = false }: { task: Task; showSubtasks?: boolean }) {
  const { completeTask } = useDataStore();
  const { openTaskDetailModal } = useMinimalModals();
  const { toggleZenMode } = useAppStore();
  const { startTimer, timer } = useTimerStore();
  const [expanded, setExpanded] = useState(false);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!timer.isRunning) {
      startTimer(task.estimatedMinutes || 25, task.id);
      toggleZenMode();
    }
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  return (
    <div className="group">
      <div
        className={`flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg ${
          isOverdue ? 'bg-red-50/50' : ''
        }`}
        onClick={() => openTaskDetailModal(task)}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleComplete}
          className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-all group/check"
          title="Erledigt"
        >
          <CheckCircle2 size={14} className="text-emerald-500 opacity-0 group-hover/check:opacity-100 transition-opacity" />
        </button>

        {/* Expand arrow for subtasks */}
        {hasSubtasks && showSubtasks && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'} truncate`}>
            {task.title}
          </p>
          
          {/* Subtask progress inline */}
          {hasSubtasks && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-gray-200 rounded-full max-w-[80px]">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>

        {/* Due date badge */}
        {task.dueDate && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            isOverdue 
              ? 'bg-red-100 text-red-700' 
              : isDueToday 
                ? 'bg-blue-100 text-blue-700'
                : isDueTomorrow
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
          }`}>
            {isOverdue 
              ? 'Überfällig' 
              : isDueToday 
                ? 'Heute' 
                : isDueTomorrow 
                  ? 'Morgen'
                  : format(new Date(task.dueDate), 'd. MMM', { locale: de })
            }
          </span>
        )}

        {/* Focus button - only visible on hover */}
        {!timer.isRunning && (
          <button
            type="button"
            onClick={handleFocus}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
            title="Fokus starten"
          >
            <Play size={14} />
          </button>
        )}
      </div>

      {/* Subtasks expanded view */}
      {hasSubtasks && expanded && showSubtasks && (
        <div className="ml-12 mb-2 space-y-1">
          {task.subtasks?.map((subtask) => (
            <div 
              key={subtask.id}
              className={`flex items-center gap-2 py-1.5 px-3 rounded text-sm ${
                subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600'
              }`}
            >
              <div className={`w-3 h-3 rounded-sm border ${
                subtask.completed 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-gray-300'
              }`}>
                {subtask.completed && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span>{subtask.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* MIT - Most Important Task Card */
function MITCard({ task }: { task: Task }) {
  const { openTaskDetailModal } = useMinimalModals();
  const { toggleZenMode } = useAppStore();
  const { timer } = useTimerStore();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={() => openTaskDetailModal(task)}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Wichtigste Aufgabe
          </span>
          <h2 className="text-lg font-semibold text-gray-900 mt-1">{task.title}</h2>
          
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Subtask progress */}
          {hasSubtasks && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-1.5 bg-indigo-100 rounded-full max-w-[120px]">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-indigo-600 font-medium">
                {completedSubtasks} von {totalSubtasks} Schritten
              </span>
            </div>
          )}
        </div>

        {!timer.isRunning && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleZenMode(); }}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play size={14} />
            Fokus
          </button>
        )}
      </div>
    </div>
  );
}

/* Stats Panel - Versteckt, nur auf Abruf */
function StatsPanel({ onClose }: { onClose: () => void }) {
  const { tasks, goals } = useDataStore();

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
    const completedToday = tasks.filter(t => 
      t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    ).length;
    const activeGoals = goals.filter(g => g.progress < 100).length;
    const overdueTasks = activeTasks.filter(t => 
      t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
    ).length;

    return { activeTasks: activeTasks.length, completedToday, activeGoals, overdueTasks };
  }, [tasks, goals]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 size={16} className="text-gray-500" />
          Übersicht
        </h3>
        <button 
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Schließen
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.activeTasks}</div>
          <div className="text-xs text-gray-500">Offen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.completedToday}</div>
          <div className="text-xs text-gray-500">Heute erledigt</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.activeGoals}</div>
          <div className="text-xs text-gray-500">Aktive Ziele</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats.overdueTasks}
          </div>
          <div className="text-xs text-gray-500">Überfällig</div>
        </div>
      </div>
    </div>
  );
}

/* Main Focused Dashboard */
export function FocusedDashboard() {
  const { tasks } = useDataStore();
  const { openTaskModal } = useMinimalModals();
  const [showStats, setShowStats] = useState(false);

  // Get MIT (Most Important Task)
  const mitTask = useMemo(() => TaskService.getMIT(tasks), [tasks]);

  // Active tasks for today or without date, excluding MIT
  const todaysTasks = useMemo(() => {
    const activeTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.status !== 'archived' &&
      t.id !== mitTask?.id
    );

    // Prioritize: Due today, then overdue, then upcoming
    const dueTodayOrOverdue = activeTasks.filter(t => 
      t.dueDate && (isToday(new Date(t.dueDate)) || isPast(new Date(t.dueDate)))
    );

    const withoutDate = activeTasks.filter(t => !t.dueDate);
    
    const upcoming = activeTasks.filter(t => 
      t.dueDate && !isToday(new Date(t.dueDate)) && !isPast(new Date(t.dueDate))
    );

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortByPriority = (a: Task, b: Task) => 
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);

    return [
      ...dueTodayOrOverdue.sort(sortByPriority),
      ...withoutDate.sort(sortByPriority),
      ...upcoming.sort(sortByPriority)
    ].slice(0, 10); // Nur die wichtigsten 10
  }, [tasks, mitTask]);

  const today = new Date();
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }, [today]);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{greeting}</h1>
          <p className="text-sm text-gray-500">
            {format(today, 'EEEE, d. MMMM', { locale: de })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Stats toggle button */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition-colors ${
              showStats 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Statistiken anzeigen"
          >
            <BarChart3 size={18} />
          </button>
          
          {/* Add task button */}
          <button
            onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Neue Aufgabe</span>
          </button>
        </div>
      </div>

      {/* Stats Panel - Versteckt by default */}
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}

      {/* MIT Card */}
      {mitTask && (
        <div className="mb-6">
          <MITCard task={mitTask} />
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Deine Aufgaben</h2>
          <span className="text-xs text-gray-500">{todaysTasks.length} offen</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {todaysTasks.length > 0 ? (
            todaysTasks.map(task => (
              <TaskRow key={task.id} task={task} showSubtasks />
            ))
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
              <p className="text-gray-600 font-medium">Alles erledigt!</p>
              <p className="text-sm text-gray-400 mt-1">Zeit für eine Pause</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick hints - Minimal */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">⌘K</kbd>
          Schnellbefehle
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">N</kbd>
          Neue Aufgabe
        </span>
      </div>
    </div>
  );
}
