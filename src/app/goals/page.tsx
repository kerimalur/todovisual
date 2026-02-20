'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit2,
  Plus,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Goal } from '@/types';
import { differenceInCalendarDays, format, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button, Card, CardContent, CardHeader, ProgressBar, GoalsEmptyState } from '@/components/ui';

type GoalHealth = 'on-track' | 'at-risk' | 'overdue' | 'done';
type GoalFilter = 'all' | 'on-track' | 'at-risk' | 'overdue';

const getGoalHealth = (goal: Goal): GoalHealth => {
  if (goal.progress >= 100) return 'done';

  const today = new Date();
  const deadline = new Date(goal.deadline);
  if (isBefore(deadline, today)) return 'overdue';

  const createdAt = new Date(goal.createdAt);
  const totalDays = Math.max(1, differenceInCalendarDays(deadline, createdAt));
  const elapsedDays = Math.max(0, differenceInCalendarDays(today, createdAt));
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return goal.progress >= expectedProgress - 15 ? 'on-track' : 'at-risk';
};

const healthStyle: Record<GoalHealth, string> = {
  'on-track': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'at-risk': 'bg-amber-100 text-amber-800 border-amber-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  done: 'bg-slate-100 text-slate-700 border-slate-200',
};

function GoalCard({ goal }: { goal: Goal }) {
  const { tasks, deleteGoal, updateGoal, createTask } = useDataStore();
  const { openGoalModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskBusy, setQuickTaskBusy] = useState(false);

  const goalTasks = tasks.filter((task) => task.goalId === goal.id);
  const openTasks = goalTasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedTasks = goalTasks.filter((task) => task.status === 'completed');

  const health = getGoalHealth(goal);
  const daysLeft = differenceInCalendarDays(new Date(goal.deadline), new Date());
  const completedMilestones = (goal.milestones || []).filter((milestone) => milestone.completed).length;
  const totalMilestones = goal.milestones?.length || 0;

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!goal.milestones || goal.milestones.length === 0) return;

    const updatedMilestones = goal.milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
    );
    const nextCompleted = updatedMilestones.filter((milestone) => milestone.completed).length;
    const nextProgress = Math.round((nextCompleted / updatedMilestones.length) * 100);

    try {
      await updateGoal(goal.id, {
        milestones: updatedMilestones,
        progress: nextProgress,
      });
    } catch (error) {
      console.error('Milestone update failed:', error);
      alert('Meilenstein konnte nicht aktualisiert werden.');
    }
  };

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;

    setQuickTaskBusy(true);
    try {
      await createTask({
        title,
        description: `Ziel: ${goal.title}`,
        dueDate: startOfDay(new Date()),
        priority: 'high',
        goalId: goal.id,
        status: 'todo',
        tags: ['ziel'],
      });
      setQuickTaskTitle('');
    } catch (error) {
      console.error('Quick task creation failed:', error);
      alert('Aufgabe konnte nicht erstellt werden.');
    } finally {
      setQuickTaskBusy(false);
    }
  };

  return (
    <>
      <div className={`rounded-xl border bg-white ${expanded ? 'border-indigo-300 shadow-sm' : 'border-gray-200'}`}>
        <button
          onClick={() => setExpanded((value) => !value)}
          className="w-full text-left p-4 hover:bg-gray-50/60 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{goal.title}</h3>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${healthStyle[health]}`}>
                  {health === 'on-track' && 'On Track'}
                  {health === 'at-risk' && 'At Risk'}
                  {health === 'overdue' && 'Überfällig'}
                  {health === 'done' && 'Erreicht'}
                </span>
              </div>
              {goal.description && <p className="text-sm text-gray-700 line-clamp-1">{goal.description}</p>}

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-semibold text-gray-900">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} max={100} color={goal.color} size="sm" animated />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  <Calendar size={11} />
                  Deadline {format(new Date(goal.deadline), 'd. MMM yyyy', { locale: de })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  {totalMilestones > 0 ? `${completedMilestones}/${totalMilestones} Meilensteine` : 'Keine Meilensteine'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${daysLeft < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} Tage drüber` : `${daysLeft} Tage offen`}
                </span>
              </div>
            </div>

            <ChevronRight size={18} className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openGoalModal(goal)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                <Edit2 size={12} />
                Ziel bearbeiten
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <Trash2 size={12} />
                Löschen
              </button>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Nächste Aufgabe</p>
              <div className="flex items-center gap-2">
                <input
                  value={quickTaskTitle}
                  onChange={(event) => setQuickTaskTitle(event.target.value)}
                  placeholder="Nächsten Schritt formulieren..."
                  className="flex-1 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => void handleQuickTask()}
                  disabled={quickTaskBusy}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus size={12} />
                  Hinzufügen
                </button>
              </div>
            </div>

            {goal.milestones && goal.milestones.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Meilensteine</p>
                <div className="space-y-1.5">
                  {goal.milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => void handleToggleMilestone(milestone.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-left hover:border-indigo-200"
                    >
                      <span className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {milestone.title}
                      </span>
                      <CheckCircle2 size={15} className={milestone.completed ? 'text-emerald-600' : 'text-gray-400'} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Aktive Aufgaben</p>
              {openTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {openTasks.slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className="w-full flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-left hover:border-indigo-200"
                    >
                      <span className="text-sm font-medium text-gray-900 truncate">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-700 whitespace-nowrap">
                          {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                  Kein nächster Schritt definiert. Lege oben direkt eine Aufgabe an.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteGoal(goal.id)}
        title="Ziel löschen"
        message={`Möchtest du "${goal.title}" wirklich löschen?`}
      />
    </>
  );
}

export default function GoalsPage() {
  const { goals, tasks } = useDataStore();
  const { openGoalModal, openTaskModal } = useModals();
  const [filter, setFilter] = useState<GoalFilter>('all');

  const stats = useMemo(() => {
    const health = goals.map((goal) => getGoalHealth(goal));
    const overdue = health.filter((state) => state === 'overdue').length;
    const atRisk = health.filter((state) => state === 'at-risk').length;
    const onTrack = health.filter((state) => state === 'on-track').length;
    const done = health.filter((state) => state === 'done').length;

    const openGoalTasks = tasks.filter(
      (task) => task.goalId && task.status !== 'completed' && task.status !== 'archived'
    ).length;
    const goalTasksDueToday = tasks.filter(
      (task) =>
        task.goalId &&
        task.status !== 'completed' &&
        task.dueDate &&
        isBefore(new Date(task.dueDate), new Date(new Date().setHours(23, 59, 59, 999)))
    ).length;

    return {
      overdue,
      atRisk,
      onTrack,
      done,
      openGoalTasks,
      goalTasksDueToday,
    };
  }, [goals, tasks]);

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((goal) => getGoalHealth(goal) === filter);
  }, [filter, goals]);

  const goalBacklog = useMemo(() => {
    return goals
      .map((goal) => {
        const openTasks = tasks.filter(
          (task) => task.goalId === goal.id && task.status !== 'completed' && task.status !== 'archived'
        );
        return { goal, openTasks };
      })
      .filter((entry) => entry.openTasks.length === 0 && getGoalHealth(entry.goal) !== 'done')
      .slice(0, 5);
  }, [goals, tasks]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ziele</h1>
          <p className="text-gray-700 mt-1">Steuere Fortschritt über den gesamten Zielzeitraum.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openTaskModal()} variant="secondary" leftIcon={<Plus size={16} />}>
            Aufgabe erstellen
          </Button>
          <Button onClick={() => openGoalModal()} variant="primary" leftIcon={<Target size={16} />}>
            Neues Ziel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">On Track</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.onTrack}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">At Risk</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.atRisk}</p>
        </Card>
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Überfällig</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.overdue}</p>
        </Card>
        <Card className="p-4 border border-indigo-200 bg-indigo-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Offene Ziel-Aufgaben</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.openGoalTasks}</p>
        </Card>
      </div>

      <Card className="border border-indigo-100 bg-indigo-50/60">
        <CardHeader
          title="Goal Execution Board"
          subtitle="Wo du jetzt eingreifen solltest"
          icon={<Zap size={16} className="text-indigo-700" />}
        />
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-indigo-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Heute fällige Ziel-Aufgaben</p>
            <p className="text-sm text-gray-900 font-semibold">{stats.goalTasksDueToday}</p>
            <p className="text-xs text-gray-700 mt-1">Halte den Tagesfluss eng an deinen Zielen.</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Ziele ohne nächsten Schritt</p>
            {goalBacklog.length > 0 ? (
              <div className="space-y-1.5">
                {goalBacklog.map((entry) => (
                  <div key={entry.goal.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-900 truncate">{entry.goal.title}</span>
                    <span className="text-xs text-amber-800">0 Aufgaben</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Alle aktiven Ziele haben bereits konkrete Aufgaben.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'on-track', label: 'On Track' },
          { key: 'at-risk', label: 'At Risk' },
          { key: 'overdue', label: 'Überfällig' },
        ].map((entry) => (
          <button
            key={entry.key}
            onClick={() => setFilter(entry.key as GoalFilter)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              filter === entry.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-700 hover:text-gray-900'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredGoals.length > 0 ? (
          filteredGoals
            .slice()
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map((goal) => <GoalCard key={goal.id} goal={goal} />)
        ) : (
          <GoalsEmptyState onAdd={() => openGoalModal()} />
        )}
      </div>
    </div>
  );
}
