'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Goal, Task } from '@/types';
import { Button, Card, CardContent, CardHeader, GoalsEmptyState, ProgressBar } from '@/components/ui';

type GoalHealth = 'on-track' | 'at-risk' | 'overdue' | 'done';
type GoalFilter = 'all' | 'on-track' | 'at-risk' | 'overdue' | 'done';

const getTaskGoalIds = (task: Task): string[] =>
  task.goalIds?.length ? task.goalIds : (task.goalId ? [task.goalId] : []);

const getGoalHealth = (goal: Goal): GoalHealth => {
  if (goal.progress >= 100) return 'done';
  if (!goal.deadline) return 'on-track';

  const now = new Date();
  const deadline = new Date(goal.deadline);
  if (isBefore(deadline, now)) return 'overdue';

  const createdAt = new Date(goal.createdAt);
  const totalDays = Math.max(1, differenceInCalendarDays(deadline, createdAt));
  const elapsedDays = Math.max(0, differenceInCalendarDays(now, createdAt));
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return goal.progress >= expectedProgress - 15 ? 'on-track' : 'at-risk';
};

const getSmartScore = (goal: Goal): number => {
  const smart = goal.smartCriteria;
  if (!smart) return 0;
  return [
    smart.specific,
    smart.measurable,
    smart.achievable,
    smart.relevant,
    smart.timeBound,
  ].filter((field) => field && field.trim().length > 0).length;
};

const healthStyles: Record<GoalHealth, string> = {
  'on-track': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'at-risk': 'bg-amber-100 text-amber-800 border-amber-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  done: 'bg-slate-100 text-slate-700 border-slate-200',
};

function GoalWorkflowCard({ goal }: { goal: Goal }) {
  const { tasks, projects, updateGoal, deleteGoal, createTask } = useDataStore();
  const { openGoalModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const goalTasks = tasks.filter((task) => getTaskGoalIds(task).includes(goal.id));
  const openTasks = goalTasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedTasks = goalTasks.filter((task) => task.status === 'completed');
  const linkedProjects = projects.filter((project) => {
    const linkedGoalIds = project.goalIds?.length ? project.goalIds : (project.goalId ? [project.goalId] : []);
    return linkedGoalIds.includes(goal.id);
  });
  const health = getGoalHealth(goal);
  const smartScore = getSmartScore(goal);
  const weeklyPlan = goal.weeklyPlan || [];
  const milestones = goal.milestones || [];
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;

  const createMilestoneTasks = async () => {
    const pendingMilestones = milestones.filter((milestone) => !milestone.completed);
    if (pendingMilestones.length === 0) return 0;

    const createdTitles = new Set(
      openTasks.map((task) => task.title.trim().toLowerCase())
    );

    let created = 0;
    for (const milestone of pendingMilestones) {
      const title = `Meilenstein: ${milestone.title}`;
      if (createdTitles.has(title.trim().toLowerCase())) continue;

      await createTask({
        title,
        description: `Automatisch erstellt für Ziel "${goal.title}"`,
        dueDate: milestone.targetDate ? new Date(milestone.targetDate) : new Date(goal.deadline),
        priority: 'high',
        status: 'todo',
        tags: ['ziel', 'meilenstein'],
        goalId: goal.id,
        goalIds: [goal.id],
      });
      created += 1;
    }
    return created;
  };

  const createWeeklyTasksForToday = async () => {
    const today = new Date().getDay();
    const todaysActions = weeklyPlan.filter((item) => item.weekday === today);
    if (todaysActions.length === 0) return 0;

    const openTaskTitles = new Set(openTasks.map((task) => task.title.trim().toLowerCase()));
    let created = 0;
    for (const action of todaysActions) {
      const title = `Wochenplan: ${action.title}`;
      if (openTaskTitles.has(title.trim().toLowerCase())) continue;

      await createTask({
        title,
        description: `Wochenplan aus Ziel "${goal.title}"`,
        dueDate: startOfDay(new Date()),
        priority: 'medium',
        status: 'todo',
        tags: ['ziel', 'wochenplan'],
        estimatedMinutes: action.estimatedMinutes,
        goalId: goal.id,
        goalIds: [goal.id],
      });
      created += 1;
    }
    return created;
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
    );
    const nextCompleted = updatedMilestones.filter((milestone) => milestone.completed).length;
    const nextProgress = updatedMilestones.length > 0 ? Math.round((nextCompleted / updatedMilestones.length) * 100) : goal.progress;

    await updateGoal(goal.id, {
      milestones: updatedMilestones,
      progress: nextProgress,
    });
  };

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;
    await createTask({
      title,
      description: `Nächster Schritt für Ziel "${goal.title}"`,
      dueDate: startOfDay(new Date()),
      priority: 'high',
      status: 'todo',
      tags: ['ziel'],
      goalId: goal.id,
      goalIds: [goal.id],
    });
    setQuickTaskTitle('');
  };

  const runAutomation = async () => {
    try {
      setBusy(true);
      const [weeklyCreated, milestoneCreated] = await Promise.all([
        createWeeklyTasksForToday(),
        createMilestoneTasks(),
      ]);
      if (weeklyCreated + milestoneCreated === 0) {
        alert('Keine neuen Automationen nötig.');
      } else {
        alert(`${weeklyCreated + milestoneCreated} Aufgaben automatisch erstellt.`);
      }
    } catch (error) {
      console.error('Ziel-Automation fehlgeschlagen:', error);
      alert('Automation fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={`rounded-xl border bg-white ${expanded ? 'border-indigo-300 shadow-sm' : 'border-gray-200'}`}>
        <button
          onClick={() => setExpanded((value) => !value)}
          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{goal.title}</h3>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${healthStyles[health]}`}>
                  {health === 'on-track' && 'On Track'}
                  {health === 'at-risk' && 'At Risk'}
                  {health === 'overdue' && 'Überfällig'}
                  {health === 'done' && 'Erreicht'}
                </span>
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                  SMART {smartScore}/5
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-1">{goal.description || 'Ohne Beschreibung'}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-semibold text-gray-900">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} max={100} color={goal.color} size="sm" animated />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  <Calendar size={11} />
                  {goal.deadline ? format(new Date(goal.deadline), 'd. MMM yyyy', { locale: de }) : 'Keine Deadline'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  {completedMilestones}/{milestones.length} Meilensteine
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  {weeklyPlan.length} Wochenaktionen
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  {linkedProjects.length} Projekte
                </span>
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openGoalModal(goal)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                <Edit2 size={12} />
                Bearbeiten
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <Trash2 size={12} />
                Löschen
              </button>
              <button
                onClick={() => void runAutomation()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
              >
                <Wand2 size={12} />
                Automationen ausführen
              </button>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 mb-2">Nächster Schritt</p>
              <div className="flex items-center gap-2">
                <input
                  value={quickTaskTitle}
                  onChange={(event) => setQuickTaskTitle(event.target.value)}
                  placeholder="Konkrete nächste Aufgabe"
                  className="flex-1 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => void handleQuickTask()}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={12} />
                  Hinzufügen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">SMART-Fokus</p>
                <ul className="space-y-1 text-xs text-gray-800">
                  <li>Spezifisch: {goal.smartCriteria?.specific ? 'Ja' : 'Nein'}</li>
                  <li>Messbar: {goal.smartCriteria?.measurable ? 'Ja' : 'Nein'}</li>
                  <li>Erreichbar: {goal.smartCriteria?.achievable ? 'Ja' : 'Nein'}</li>
                  <li>Relevant: {goal.smartCriteria?.relevant ? 'Ja' : 'Nein'}</li>
                  <li>Terminiert: {goal.smartCriteria?.timeBound ? 'Ja' : 'Nein'}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">Wochenplan</p>
                {weeklyPlan.length > 0 ? (
                  <div className="space-y-1.5">
                    {weeklyPlan.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-900 truncate">{item.title}</span>
                        <span className="text-gray-700 whitespace-nowrap">
                          {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][item.weekday]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">Kein Wochenplan hinterlegt.</p>
                )}
              </div>
            </div>

            {milestones.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Meilensteine</p>
                <div className="space-y-1.5">
                  {milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => void handleToggleMilestone(milestone.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-left hover:border-indigo-200"
                    >
                      <div className="min-w-0">
                        <span className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {milestone.title}
                        </span>
                        {milestone.targetDate && (
                          <p className="text-xs text-gray-700">{format(new Date(milestone.targetDate), 'd. MMM yyyy', { locale: de })}</p>
                        )}
                      </div>
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
                  {openTasks.slice(0, 6).map((task) => (
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
                  Noch keine aktive Aufgabe. Erstelle oben den nächsten Schritt.
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
  const { goals, tasks, createTask } = useDataStore();
  const { openGoalModal, openTaskModal } = useModals();
  const [filter, setFilter] = useState<GoalFilter>('all');
  const [automationBusy, setAutomationBusy] = useState(false);

  const goalStats = useMemo(() => {
    const healthStates = goals.map((goal) => getGoalHealth(goal));
    const onTrack = healthStates.filter((state) => state === 'on-track').length;
    const atRisk = healthStates.filter((state) => state === 'at-risk').length;
    const overdue = healthStates.filter((state) => state === 'overdue').length;
    const done = healthStates.filter((state) => state === 'done').length;
    const smartReady = goals.filter((goal) => getSmartScore(goal) >= 4).length;
    const weeklyActions = goals.reduce((sum, goal) => sum + (goal.weeklyPlan?.length || 0), 0);

    return { onTrack, atRisk, overdue, done, smartReady, weeklyActions };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((goal) => getGoalHealth(goal) === filter);
  }, [filter, goals]);

  const nextMilestones = useMemo(() => {
    const list = goals.flatMap((goal) =>
      (goal.milestones || [])
        .filter((milestone) => !milestone.completed && milestone.targetDate)
        .map((milestone) => ({
          goalTitle: goal.title,
          milestoneTitle: milestone.title,
          targetDate: new Date(milestone.targetDate as Date),
        }))
    );
    return list
      .filter((item) => item.targetDate <= addDays(new Date(), 14))
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
      .slice(0, 6);
  }, [goals]);

  const runGlobalAutomation = async () => {
    try {
      setAutomationBusy(true);
      const todayWeekday = new Date().getDay();
      const openTaskTitlesByGoal = new Map<string, Set<string>>();

      tasks
        .filter((task) => task.status !== 'completed' && task.status !== 'archived')
        .forEach((task) => {
          const goalIds = getTaskGoalIds(task);
          goalIds.forEach((goalId) => {
            const existing = openTaskTitlesByGoal.get(goalId) || new Set<string>();
            existing.add(task.title.trim().toLowerCase());
            openTaskTitlesByGoal.set(goalId, existing);
          });
        });

      let created = 0;
      for (const goal of goals) {
        const goalTaskTitles = openTaskTitlesByGoal.get(goal.id) || new Set<string>();

        for (const action of goal.weeklyPlan || []) {
          if (action.weekday !== todayWeekday) continue;
          const title = `Wochenplan: ${action.title}`;
          if (goalTaskTitles.has(title.toLowerCase())) continue;

          await createTask({
            title,
            description: `Automatisch aus Wochenplan für Ziel "${goal.title}"`,
            dueDate: startOfDay(new Date()),
            priority: 'medium',
            status: 'todo',
            tags: ['ziel', 'wochenplan'],
            estimatedMinutes: action.estimatedMinutes,
            goalId: goal.id,
            goalIds: [goal.id],
          });
          goalTaskTitles.add(title.toLowerCase());
          created += 1;
        }
      }

      if (created === 0) {
        alert('Heute waren keine neuen Wochenplan-Aufgaben nötig.');
      } else {
        alert(`${created} Wochenplan-Aufgaben wurden erstellt.`);
      }
    } catch (error) {
      console.error('Globale Ziel-Automation fehlgeschlagen:', error);
      alert('Automation fehlgeschlagen.');
    } finally {
      setAutomationBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ziele</h1>
          <p className="text-gray-700 mt-1">SMART + Hybrid-Workflow mit Meilensteinen und Wochenplan.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <Card className="p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">On Track</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{goalStats.onTrack}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">At Risk</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{goalStats.atRisk}</p>
        </Card>
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Überfällig</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{goalStats.overdue}</p>
        </Card>
        <Card className="p-4 border border-indigo-200 bg-indigo-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">SMART Ready</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{goalStats.smartReady}</p>
        </Card>
        <Card className="p-4 border border-sky-200 bg-sky-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Wochenaktionen</p>
          <p className="text-2xl font-bold text-sky-900 mt-1">{goalStats.weeklyActions}</p>
        </Card>
      </div>

      <Card className="border border-indigo-100 bg-indigo-50/70">
        <CardHeader
          title="Goal Automation Board"
          subtitle="Automatisiere wiederkehrende Zielarbeit und halte Momentum"
          icon={<Sparkles size={16} className="text-indigo-700" />}
        />
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-indigo-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Heute automatisch planen</p>
            <p className="text-sm text-gray-800 mb-3">
              Erstellt Aufgaben aus dem Wochenplan für den heutigen Wochentag.
            </p>
            <button
              onClick={() => void runGlobalAutomation()}
              disabled={automationBusy}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Wand2 size={12} />
              Wochenplan ausführen
            </button>
          </div>
          <div className="rounded-lg border border-amber-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Nächste Meilensteine (14 Tage)</p>
            {nextMilestones.length > 0 ? (
              <div className="space-y-1.5">
                {nextMilestones.map((entry) => (
                  <div key={`${entry.goalTitle}-${entry.milestoneTitle}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-900 truncate">{entry.goalTitle}: {entry.milestoneTitle}</span>
                    <span className="text-xs text-amber-800">{format(entry.targetDate, 'd. MMM', { locale: de })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Keine kurzfristigen Meilensteine offen.</p>
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
          { key: 'done', label: 'Erreicht' },
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
            .map((goal) => <GoalWorkflowCard key={goal.id} goal={goal} />)
        ) : (
          <GoalsEmptyState onAdd={() => openGoalModal()} />
        )}
      </div>
    </div>
  );
}
