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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Goal, Task } from '@/types';

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
  return [smart.specific, smart.measurable, smart.achievable, smart.relevant, smart.timeBound]
    .filter((f) => f && f.trim().length > 0).length;
};

const healthConfig: Record<GoalHealth, { label: string; color: string; dot: string }> = {
  'on-track': { label: 'Im Plan', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  'at-risk': { label: 'Gefährdet', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  overdue: { label: 'Überfällig', color: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  done: { label: 'Erreicht', color: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-white/30' },
};

function DarkProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || '#7c3aed';
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-50 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { tasks, projects, updateGoal, deleteGoal, createTask } = useDataStore();
  const { openGoalModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const goalTasks = tasks.filter((task) => getTaskGoalIds(task).includes(goal.id));
  const openTasks = goalTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
  const completedTasks = goalTasks.filter((t) => t.status === 'completed');
  const linkedProjects = projects.filter((p) => {
    const ids = p.goalIds?.length ? p.goalIds : (p.goalId ? [p.goalId] : []);
    return ids.includes(goal.id);
  });
  const health = getGoalHealth(goal);
  const smartScore = getSmartScore(goal);
  const weeklyPlan = goal.weeklyPlan || [];
  const milestones = goal.milestones || [];
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const hConfig = healthConfig[health];

  const handleToggleMilestone = async (milestoneId: string) => {
    const updatedMilestones = milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const nextCompleted = updatedMilestones.filter((m) => m.completed).length;
    const nextProgress = updatedMilestones.length > 0 ? Math.round((nextCompleted / updatedMilestones.length) * 100) : goal.progress;
    await updateGoal(goal.id, { milestones: updatedMilestones, progress: nextProgress });
  };

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;
    await createTask({ title, description: `Nächster Schritt für "${goal.title}"`, dueDate: startOfDay(new Date()), priority: 'high', status: 'todo', tags: ['ziel'], goalId: goal.id, goalIds: [goal.id] });
    setQuickTaskTitle('');
  };

  const runAutomation = async () => {
    try {
      setBusy(true);
      const pendingMilestones = milestones.filter((m) => !m.completed);
      const openTaskTitles = new Set(openTasks.map((t) => t.title.trim().toLowerCase()));
      let created = 0;
      for (const m of pendingMilestones) {
        const title = `Meilenstein: ${m.title}`;
        if (openTaskTitles.has(title.toLowerCase())) continue;
        await createTask({ title, dueDate: m.targetDate ? new Date(m.targetDate) : new Date(goal.deadline), priority: 'high', status: 'todo', tags: ['ziel', 'meilenstein'], goalId: goal.id, goalIds: [goal.id] });
        created++;
      }
      if (created === 0) alert('Keine neuen Automationen nötig.');
      else alert(`${created} Aufgaben erstellt.`);
    } catch (e) { alert('Automatisierung fehlgeschlagen.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden card-hover ${
        expanded ? 'border-violet-500/30' : 'border-slate-200'
      }`} style={{ background: expanded ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.92)' }}>

        {/* Clickable header */}
        <button onClick={() => setExpanded((v) => !v)} className="w-full text-left p-5 hover:bg-white transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-base font-semibold text-slate-900 truncate">{goal.title}</h3>
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${hConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hConfig.dot}`} />
                  {hConfig.label}
                </span>
                <span className="inline-flex items-center rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400">
                  SMART {smartScore}/5
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-1 mb-3">{goal.description || 'Keine Beschreibung'}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-bold text-slate-900">{goal.progress}%</span>
                </div>
                <DarkProgressBar value={goal.progress} max={100} color={goal.color} />
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                  <Calendar size={11} />
                  {goal.deadline ? format(new Date(goal.deadline), 'd. MMM yyyy', { locale: de }) : 'Keine Deadline'}
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                  {completedMilestones}/{milestones.length} Meilensteine
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                  {linkedProjects.length} Projekte
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-200 p-5 space-y-4 animate-fade-in">
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => openGoalModal(goal)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Edit2 size={12} /> Bearbeiten
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 size={12} /> Löschen
              </button>
              <button onClick={() => void runAutomation()} disabled={busy}
                className="flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/15 disabled:opacity-40 transition-all">
                <Wand2 size={12} /> Automationen
              </button>
            </div>

            {/* Quick Task */}
            <div className="rounded-xl border border-violet-500/20 p-4" style={{ background: 'rgba(124,58,237,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400 mb-2">Nächster Schritt</p>
              <div className="flex items-center gap-2">
                <input
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Konkrete nächste Aufgabe..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500/50 transition-all"
                  style={{ background: 'rgba(148,163,184,0.2)' }}
                />
                <button onClick={() => void handleQuickTask()}
                  className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-all">
                  <Plus size={12} /> Hinzufügen
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-4" style={{ background: 'rgba(255,255,255,0.88)' }}>
                <p className="text-sm font-semibold text-slate-900 mb-3">SMART-Kriterien</p>
                <ul className="space-y-1.5 text-xs">
                  {(['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const).map((key) => {
                    const labels: Record<string, string> = { specific: 'Spezifisch', measurable: 'Messbar', achievable: 'Erreichbar', relevant: 'Relevant', timeBound: 'Terminiert' };
                    const has = !!(goal.smartCriteria?.[key]);
                    return (
                      <li key={key} className={`flex items-center gap-2 ${has ? 'text-slate-600' : 'text-slate-400'}`}>
                        <CheckCircle2 size={13} className={has ? 'text-emerald-400' : 'text-slate-300'} />
                        {labels[key]}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-4" style={{ background: 'rgba(255,255,255,0.88)' }}>
                <p className="text-sm font-semibold text-slate-900 mb-3">Wochenplan</p>
                {weeklyPlan.length > 0 ? (
                  <div className="space-y-2">
                    {weeklyPlan.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 truncate">{item.title}</span>
                        <span className="text-slate-400 whitespace-nowrap flex-shrink-0">
                          {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][item.weekday]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400">Kein Wochenplan.</p>}
              </div>
            </div>

            {/* Milestones */}
            {milestones.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">Meilensteine</p>
                <div className="space-y-2">
                  {milestones.map((milestone) => (
                    <button key={milestone.id} onClick={() => void handleToggleMilestone(milestone.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-violet-500/25 hover:bg-white transition-all">
                      <div className="min-w-0">
                        <span className={`text-sm ${milestone.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {milestone.title}
                        </span>
                        {milestone.targetDate && (
                          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(milestone.targetDate), 'd. MMM yyyy', { locale: de })}</p>
                        )}
                      </div>
                      <CheckCircle2 size={16} className={milestone.completed ? 'text-emerald-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Open Tasks */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Aktive Aufgaben</p>
              {openTasks.length > 0 ? (
                <div className="space-y-2">
                  {openTasks.slice(0, 6).map((task) => (
                    <button key={task.id} onClick={() => openTaskDetailModal(task)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-violet-500/25 hover:bg-white transition-all">
                      <span className="text-sm text-slate-700 truncate">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                  Noch keine Aufgabe. Erstelle oben den nächsten Schritt.
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
    const healthStates = goals.map(getGoalHealth);
    return {
      onTrack: healthStates.filter((s) => s === 'on-track').length,
      atRisk: healthStates.filter((s) => s === 'at-risk').length,
      overdue: healthStates.filter((s) => s === 'overdue').length,
      done: healthStates.filter((s) => s === 'done').length,
      smartReady: goals.filter((g) => getSmartScore(g) >= 4).length,
      weeklyActions: goals.reduce((sum, g) => sum + (g.weeklyPlan?.length || 0), 0),
    };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((g) => getGoalHealth(g) === filter);
  }, [filter, goals]);

  const nextMilestones = useMemo(() => {
    const list = goals.flatMap((g) =>
      (g.milestones || [])
        .filter((m) => !m.completed && m.targetDate)
        .map((m) => ({ goalTitle: g.title, milestoneTitle: m.title, targetDate: new Date(m.targetDate as Date) }))
    );
    return list.filter((m) => m.targetDate <= addDays(new Date(), 14)).sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime()).slice(0, 6);
  }, [goals]);

  const runGlobalAutomation = async () => {
    try {
      setAutomationBusy(true);
      const todayWeekday = new Date().getDay();
      const openTaskTitlesByGoal = new Map<string, Set<string>>();
      tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').forEach((t) => {
        getTaskGoalIds(t).forEach((gid) => {
          const s = openTaskTitlesByGoal.get(gid) || new Set<string>();
          s.add(t.title.trim().toLowerCase());
          openTaskTitlesByGoal.set(gid, s);
        });
      });
      let created = 0;
      for (const g of goals) {
        const titles = openTaskTitlesByGoal.get(g.id) || new Set<string>();
        for (const action of g.weeklyPlan || []) {
          if (action.weekday !== todayWeekday) continue;
          const title = `Wochenplan: ${action.title}`;
          if (titles.has(title.toLowerCase())) continue;
          await createTask({ title, dueDate: startOfDay(new Date()), priority: 'medium', status: 'todo', tags: ['ziel', 'wochenplan'], estimatedMinutes: action.estimatedMinutes, goalId: g.id, goalIds: [g.id] });
          titles.add(title.toLowerCase());
          created++;
        }
      }
      if (created === 0) alert('Keine neuen Aufgaben nötig.');
      else alert(`${created} Wochenplan-Aufgaben erstellt.`);
    } catch { alert('Automatisierung fehlgeschlagen.'); }
    finally { setAutomationBusy(false); }
  };

  const statCards = [
    { label: 'Im Plan', value: goalStats.onTrack, color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { label: 'Gefährdet', value: goalStats.atRisk, color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    { label: 'Überfällig', value: goalStats.overdue, color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20', text: 'text-red-400' },
    { label: 'SMART bereit', value: goalStats.smartReady, color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', text: 'text-violet-400' },
    { label: 'Wochenaktionen', value: goalStats.weeklyActions, color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-900/30">
            <Target size={22} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ziele</h1>
            <p className="text-slate-500 text-sm mt-0.5">SMART · Meilensteine · Wochenplan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Plus size={15} /> Aufgabe
          </button>
          <button onClick={() => openGoalModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-orange-900/20"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Target size={15} /> Neues Ziel
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.border} p-4 bg-gradient-to-br ${card.color} card-hover`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Automationszentrale */}
      <div className="rounded-2xl border border-violet-500/20 p-5" style={{ background: 'rgba(124,58,237,0.05)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-400" />
          <p className="font-semibold text-slate-900">Automationszentrale</p>
          <p className="text-slate-400 text-sm">— Wochenplan & Meilensteine automatisch planen</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4" style={{ background: 'rgba(255,255,255,0.88)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-400 mb-2">Heute automatisch planen</p>
            <p className="text-sm text-slate-500 mb-3">Erstellt Aufgaben aus dem Wochenplan für den heutigen Tag.</p>
            <button onClick={() => void runGlobalAutomation()} disabled={automationBusy}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40 transition-all">
              <Wand2 size={12} /> Wochenplan ausführen
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 p-4" style={{ background: 'rgba(255,255,255,0.88)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-2">Nächste Meilensteine (14 Tage)</p>
            {nextMilestones.length > 0 ? (
              <div className="space-y-2">
                {nextMilestones.map((entry) => (
                  <div key={`${entry.goalTitle}-${entry.milestoneTitle}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-600 truncate">{entry.goalTitle}: {entry.milestoneTitle}</span>
                    <span className="text-xs text-amber-400 whitespace-nowrap flex-shrink-0">{format(entry.targetDate, 'd. MMM', { locale: de })}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">Keine kurzfristigen Meilensteine.</p>}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1">
        {([
          { key: 'all', label: 'Alle' },
          { key: 'on-track', label: 'Im Plan' },
          { key: 'at-risk', label: 'Gefährdet' },
          { key: 'overdue', label: 'Überfällig' },
          { key: 'done', label: 'Erreicht' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === tab.key ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goal List */}
      <div className="space-y-3">
        {filteredGoals.length > 0 ? (
          filteredGoals
            .slice()
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .map((goal) => <GoalCard key={goal.id} goal={goal} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
              <Target size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm mb-4">Noch keine Ziele definiert.</p>
            <button onClick={() => openGoalModal()}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-900 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              Erstes Ziel erstellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
