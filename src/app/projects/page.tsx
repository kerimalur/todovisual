'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Milestone,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Search,
  FolderKanban,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Project, ProjectCategory, Task } from '@/types';

type ProjectFilterStatus = 'all' | 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

const categoryConfig: Record<ProjectCategory, { label: string; color: string }> = {
  trading: { label: 'Trading', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  finance: { label: 'Finanzen', color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  fitness: { label: 'Fitness', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  health: { label: 'Gesundheit', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  wealth: { label: 'Vermögen', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  programming: { label: 'Tech', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  improvement: { label: 'Verbesserung', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  other: { label: 'Sonstiges', color: 'bg-white/8 text-white/40 border-white/10' },
};

const statusConfig: Record<Project['status'], { label: string; color: string }> = {
  planning: { label: 'Planung', color: 'bg-white/8 text-white/50 border-white/10' },
  active: { label: 'Aktiv', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'on-hold': { label: 'Pausiert', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { label: 'Abgeschlossen', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  archived: { label: 'Archiviert', color: 'bg-white/5 text-white/25 border-white/8' },
};

const getTaskProjectIds = (task: Task): string[] =>
  task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);

function DarkProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { tasks, goals, createTask, updateProject, deleteProject } = useDataStore();
  const { openProjectModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const projectTasks = tasks.filter((t) => getTaskProjectIds(t).includes(project.id));
  const openTasks = projectTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
  const completedTasks = projectTasks.filter((t) => t.status === 'completed');
  const phases = project.timelinePhases?.length ? project.timelinePhases : (project.milestones || []);
  const completedPhases = phases.filter((p) => p.completed).length;
  const phaseProgress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const taskProgress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
  const progress = phases.length > 0 ? phaseProgress : taskProgress;
  const cat = categoryConfig[project.category] || categoryConfig.other;
  const stat = statusConfig[project.status];

  const linkedGoalIds = project.goalIds?.length ? project.goalIds : (project.goalId ? [project.goalId] : []);
  const linkedGoals = goals.filter((g) => linkedGoalIds.includes(g.id));
  const nextPhase = phases.find((p) => !p.completed) || null;
  const daysLeft = project.deadline ? differenceInCalendarDays(new Date(project.deadline), new Date()) : null;
  const deadlineRisk = daysLeft !== null && daysLeft <= 7 && project.status !== 'completed' && project.status !== 'archived';

  const handleTogglePhase = async (phaseId: string) => {
    const updated = phases.map((p) => p.id === phaseId ? { ...p, completed: !p.completed, completedAt: p.completed ? undefined : new Date() } : p);
    await updateProject(project.id, { milestones: updated, timelinePhases: updated });
  };

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;
    await createTask({ title, dueDate: startOfDay(new Date()), priority: 'medium', status: 'todo', tags: ['projekt'], projectId: project.id, projectIds: [project.id], goalId: linkedGoalIds[0], goalIds: linkedGoalIds });
    setQuickTaskTitle('');
  };

  const runTimelineAutomation = async () => {
    if (!nextPhase) { alert('Keine offene Phase.'); return; }
    const title = `Zeitplan: ${nextPhase.title}`;
    if (openTasks.some((t) => t.title.toLowerCase() === title.toLowerCase())) { alert('Aufgabe existiert bereits.'); return; }
    try {
      setBusy(true);
      await createTask({ title, dueDate: nextPhase.targetDate ? new Date(nextPhase.targetDate) : (project.deadline ? new Date(project.deadline) : undefined), priority: project.riskLevel === 'high' ? 'high' : 'medium', status: 'todo', tags: ['projekt', 'timeline'], projectId: project.id, projectIds: [project.id], goalId: linkedGoalIds[0], goalIds: linkedGoalIds });
      alert('Zeitplan-Aufgabe erstellt.');
    } catch { alert('Automatisierung fehlgeschlagen.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden card-hover ${expanded ? 'border-violet-500/30' : 'border-white/8'}`}
        style={{ background: expanded ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.03)' }}>

        <button onClick={() => setExpanded((v) => !v)} className="w-full text-left p-5 hover:bg-white/2 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
                <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${stat.color}`}>{stat.label}</span>
                {project.workflowMode === 'timeline' && (
                  <span className="inline-flex items-center rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400">Zeitplan</span>
                )}
              </div>
              <p className="text-sm mb-3 line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{project.description || 'Keine Beschreibung'}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-bold text-white">{progress}%</span>
                </div>
                <DarkProgressBar value={progress} max={100} />
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  <Milestone size={11} /> {completedPhases}/{phases.length} Phasen
                </span>
                {project.deadline && (
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${deadlineRisk ? 'bg-red-500/15 text-red-400 border border-red-500/20' : ''}`}
                    style={!deadlineRisk ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' } : {}}>
                    <Calendar size={11} />
                    {format(new Date(project.deadline), 'd. MMM yyyy', { locale: de })}
                    {daysLeft !== null && ` · ${daysLeft >= 0 ? `${daysLeft}d` : `${Math.abs(daysLeft)}d drüber`}`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  <Target size={11} /> {linkedGoals.length} Ziele
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t p-5 space-y-4 animate-fade-in" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => openProjectModal(project)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = ''; }}>
                <Edit2 size={12} /> Bearbeiten
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 size={12} /> Löschen
              </button>
              <button onClick={() => void runTimelineAutomation()} disabled={busy}
                className="flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/15 disabled:opacity-40 transition-all">
                <Wand2 size={12} /> Nächste Phase
              </button>
            </div>

            <div className="rounded-xl border border-violet-500/20 p-4" style={{ background: 'rgba(124,58,237,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400 mb-2">Nächster Schritt</p>
              <div className="flex items-center gap-2">
                <input value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} placeholder="Konkrete nächste Aufgabe..."
                  className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                <button onClick={() => void handleQuickTask()}
                  className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-all">
                  <Plus size={12} /> Hinzufügen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm font-semibold text-white mb-3">Zeitplan-Phasen</p>
                {phases.length > 0 ? (
                  <div className="space-y-2">
                    {phases.map((phase) => (
                      <button key={phase.id} onClick={() => void handleTogglePhase(phase.id)}
                        className="w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left hover:bg-white/2 transition-all"
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="min-w-0">
                          <p className={`text-sm ${phase.completed ? 'line-through' : ''}`} style={{ color: phase.completed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)' }}>{phase.title}</p>
                          {phase.targetDate && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{format(new Date(phase.targetDate), 'd. MMM yyyy', { locale: de })}</p>}
                        </div>
                        <CheckCircle2 size={16} className={phase.completed ? 'text-emerald-400' : ''} style={!phase.completed ? { color: 'rgba(255,255,255,0.2)' } : {}} />
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Keine Phasen definiert.</p>}
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm font-semibold text-white mb-3">Verknüpfte Ziele</p>
                {linkedGoals.length > 0 ? (
                  <div className="space-y-2">
                    {linkedGoals.map((g) => (
                      <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{g.title}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{g.progress}%</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Kein Ziel verknüpft.</p>}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-3">Aktive Aufgaben</p>
              {openTasks.length > 0 ? (
                <div className="space-y-2">
                  {openTasks.slice(0, 6).map((task) => (
                    <button key={task.id} onClick={() => openTaskDetailModal(task)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left hover:bg-white/2 transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{task.title}</span>
                      {task.dueDate && <span className="text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.3)' }}>{format(new Date(task.dueDate), 'd. MMM', { locale: de })}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-3 text-sm" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                  Keine aktive Aufgabe.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => deleteProject(project.id)}
        title="Projekt löschen" message={`Möchtest du "${project.title}" wirklich löschen?`} />
    </>
  );
}

export default function ProjectsPage() {
  const { projects, tasks, createTask } = useDataStore();
  const { openProjectModal } = useModals();
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectFilterStatus>('active');
  const [search, setSearch] = useState('');
  const [automationBusy, setAutomationBusy] = useState(false);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const blockedProjects = useMemo(() => projects.filter((p) => p.status === 'on-hold'), [projects]);
  const completedProjects = useMemo(() => projects.filter((p) => p.status === 'completed'), [projects]);

  const timelineCoverage = useMemo(() => {
    const withTimeline = projects.filter((p) => (p.timelinePhases?.length || p.milestones?.length || 0) > 0).length;
    return projects.length > 0 ? Math.round((withTimeline / projects.length) * 100) : 0;
  }, [projects]);

  const dueSoonProjects = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    return projects.filter((p) => {
      if (!p.deadline || p.status === 'completed' || p.status === 'archived') return false;
      const d = new Date(p.deadline);
      return d >= now && d <= nextWeek;
    });
  }, [projects]);

  const withoutNextStep = useMemo(() => projects
    .filter((p) => p.status !== 'completed' && p.status !== 'archived')
    .filter((p) => {
      const open = tasks.filter((t) => getTaskProjectIds(t).includes(p.id) && t.status !== 'completed' && t.status !== 'archived');
      return open.length === 0;
    }).slice(0, 6), [projects, tasks]);

  const filteredProjects = useMemo(() => projects.filter((p) => {
    const catOk = categoryFilter === 'all' || p.category === categoryFilter;
    const statOk = statusFilter === 'all' || p.status === statusFilter;
    const searchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return catOk && statOk && searchOk;
  }), [projects, categoryFilter, statusFilter, search]);

  const runGlobalTimelineAutomation = async () => {
    try {
      setAutomationBusy(true);
      let created = 0;
      for (const p of projects) {
        if (p.status === 'completed' || p.status === 'archived') continue;
        const phases = p.timelinePhases?.length ? p.timelinePhases : (p.milestones || []);
        const nextPhase = phases.find((ph) => !ph.completed);
        if (!nextPhase) continue;
        const open = tasks.filter((t) => getTaskProjectIds(t).includes(p.id) && t.status !== 'completed');
        const title = `Zeitplan: ${nextPhase.title}`;
        if (open.some((t) => t.title.toLowerCase() === title.toLowerCase())) continue;
        const goalIds = p.goalIds?.length ? p.goalIds : (p.goalId ? [p.goalId] : []);
        await createTask({ title, dueDate: nextPhase.targetDate ? new Date(nextPhase.targetDate) : (p.deadline ? new Date(p.deadline) : undefined), priority: p.riskLevel === 'high' ? 'high' : 'medium', status: 'todo', tags: ['projekt', 'timeline'], projectId: p.id, projectIds: [p.id], goalId: goalIds[0], goalIds });
        created++;
      }
      if (created === 0) alert('Keine neuen Aufgaben nötig.');
      else alert(`${created} Zeitplan-Aufgaben erstellt.`);
    } catch { alert('Automatisierung fehlgeschlagen.'); }
    finally { setAutomationBusy(false); }
  };

  const statCards = [
    { label: 'Aktiv', value: activeProjects.length, grad: 'from-emerald-500/20 to-emerald-600/10', bord: 'border-emerald-500/20', txt: 'text-emerald-400' },
    { label: 'Pausiert', value: blockedProjects.length, grad: 'from-amber-500/20 to-amber-600/10', bord: 'border-amber-500/20', txt: 'text-amber-400' },
    { label: 'Abgeschlossen', value: completedProjects.length, grad: 'from-blue-500/20 to-blue-600/10', bord: 'border-blue-500/20', txt: 'text-blue-400' },
    { label: 'Deadline ≤ 7 d', value: dueSoonProjects.length, grad: 'from-red-500/20 to-red-600/10', bord: 'border-red-500/20', txt: 'text-red-400' },
    { label: 'Zeitplan', value: `${timelineCoverage}%`, grad: 'from-violet-500/20 to-violet-600/10', bord: 'border-violet-500/20', txt: 'text-violet-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <FolderKanban size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Projekte</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Zeitplan · Phasen · Umsetzung</p>
          </div>
        </div>
        <button onClick={() => openProjectModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-violet-900/20"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className={`rounded-2xl border ${c.bord} p-4 bg-gradient-to-br ${c.grad} card-hover`}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.txt}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Projektuebersicht */}
      <div className="rounded-2xl border border-violet-500/20 p-5" style={{ background: 'rgba(124,58,237,0.05)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-400" />
          <p className="font-semibold text-white">Projektuebersicht</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-2">Ohne nächsten Schritt</p>
            {withoutNextStep.length > 0 ? (
              <div className="space-y-2 mb-3">
                {withoutNextStep.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.title}</span>
                    <span className="text-xs text-amber-400">0 Aufgaben</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Alle aktiven Projekte haben Aufgaben.</p>}
            <button onClick={() => void runGlobalTimelineAutomation()} disabled={automationBusy}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40 transition-all">
              <Wand2 size={12} /> Zeitplan-Aufgaben erzeugen
            </button>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">Deadline-Risiko</p>
            {dueSoonProjects.length > 0 ? (
              <div className="space-y-2">
                {dueSoonProjects.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.title}</span>
                    <span className="text-xs text-red-400">{p.deadline ? format(new Date(p.deadline), 'd. MMM', { locale: de }) : '–'}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Keine kurzfristigen Risiken.</p>}
          </div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Projekte durchsuchen..."
            className="w-full pl-9 pr-4 py-2.5 text-sm text-white rounded-xl border focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ProjectCategory | 'all')}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none transition-all cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }} title="Kategorie">
          <option value="all">Alle Kategorien</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectFilterStatus)}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none transition-all cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }} title="Status">
          <option value="all">Alle Status</option>
          <option value="planning">Planung</option>
          <option value="active">Aktiv</option>
          <option value="on-hold">Pausiert</option>
          <option value="completed">Abgeschlossen</option>
          <option value="archived">Archiviert</option>
        </select>
      </div>

      {/* Project List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects
            .slice()
            .sort((a, b) => {
              if (a.status !== b.status) return a.status.localeCompare(b.status);
              if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
              return a.title.localeCompare(b.title, 'de');
            })
            .map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <FolderKanban size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Keine Projekte gefunden.</p>
          <button onClick={() => openProjectModal()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            Projekt erstellen
          </button>
        </div>
      )}
    </div>
  );
}
