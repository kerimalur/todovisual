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
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Project, ProjectCategory, Task } from '@/types';
import { Button, Card, CardContent, CardHeader, EmptyState, ProgressBar } from '@/components/ui';

type ProjectFilterStatus = 'all' | 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

const categoryConfig: Record<ProjectCategory, { label: string; tone: string }> = {
  trading: { label: 'Trading', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  finance: { label: 'Finanzen', tone: 'bg-green-100 text-green-800 border-green-200' },
  fitness: { label: 'Fitness', tone: 'bg-orange-100 text-orange-800 border-orange-200' },
  health: { label: 'Gesundheit', tone: 'bg-red-100 text-red-800 border-red-200' },
  wealth: { label: 'Vermögen', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  programming: { label: 'Tech', tone: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  improvement: { label: 'Verbesserung', tone: 'bg-purple-100 text-purple-800 border-purple-200' },
  other: { label: 'Sonstiges', tone: 'bg-slate-100 text-slate-800 border-slate-200' },
};

const statusConfig: Record<Project['status'], { label: string; tone: string }> = {
  planning: { label: 'Planung', tone: 'bg-slate-100 text-slate-800 border-slate-200' },
  active: { label: 'Aktiv', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'on-hold': { label: 'Pausiert', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Abgeschlossen', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  archived: { label: 'Archiviert', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const getTaskProjectIds = (task: Task): string[] =>
  task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);

function ProjectTimelineCard({ project }: { project: Project }) {
  const { tasks, goals, createTask, updateProject, deleteProject } = useDataStore();
  const { openProjectModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const projectTasks = tasks.filter((task) => getTaskProjectIds(task).includes(project.id));
  const openTasks = projectTasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedTasks = projectTasks.filter((task) => task.status === 'completed');
  const phases = project.timelinePhases?.length ? project.timelinePhases : (project.milestones || []);
  const completedPhases = phases.filter((phase) => phase.completed).length;
  const phaseProgress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
  const taskProgress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
  const progress = phases.length > 0 ? phaseProgress : taskProgress;
  const category = categoryConfig[project.category] || categoryConfig.other;
  const status = statusConfig[project.status];

  const linkedGoalIds = project.goalIds?.length ? project.goalIds : (project.goalId ? [project.goalId] : []);
  const linkedGoals = goals.filter((goal) => linkedGoalIds.includes(goal.id));
  const nextPhase = phases.find((phase) => !phase.completed) || null;
  const daysLeft = project.deadline ? differenceInCalendarDays(new Date(project.deadline), new Date()) : null;
  const deadlineRisk = daysLeft !== null && daysLeft <= 7 && project.status !== 'completed' && project.status !== 'archived';

  const handleTogglePhase = async (phaseId: string) => {
    const updatedPhases = phases.map((phase) =>
      phase.id === phaseId ? { ...phase, completed: !phase.completed, completedAt: phase.completed ? undefined : new Date() } : phase
    );

    await updateProject(project.id, {
      milestones: updatedPhases,
      timelinePhases: updatedPhases,
    });
  };

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;
    await createTask({
      title,
      description: `Nächster Schritt für Projekt "${project.title}"`,
      dueDate: startOfDay(new Date()),
      priority: 'medium',
      status: 'todo',
      tags: ['projekt'],
      projectId: project.id,
      projectIds: [project.id],
      goalId: linkedGoalIds[0],
      goalIds: linkedGoalIds,
    });
    setQuickTaskTitle('');
  };

  const runTimelineAutomation = async () => {
    if (!nextPhase) {
      alert('Keine offene Timeline-Phase gefunden.');
      return;
    }

    const phaseTaskTitle = `Timeline: ${nextPhase.title}`;
    const alreadyExists = openTasks.some((task) => task.title.trim().toLowerCase() === phaseTaskTitle.toLowerCase());
    if (alreadyExists) {
      alert('Für die nächste Phase gibt es bereits eine offene Aufgabe.');
      return;
    }

    try {
      setBusy(true);
      await createTask({
        title: phaseTaskTitle,
        description: `Automatisch aus Timeline-Phase im Projekt "${project.title}"`,
        dueDate: nextPhase.targetDate ? new Date(nextPhase.targetDate) : (project.deadline ? new Date(project.deadline) : undefined),
        priority: project.riskLevel === 'high' ? 'high' : 'medium',
        status: 'todo',
        tags: ['projekt', 'timeline'],
        projectId: project.id,
        projectIds: [project.id],
        goalId: linkedGoalIds[0],
        goalIds: linkedGoalIds,
      });
      alert('Timeline-Aufgabe wurde erstellt.');
    } catch (error) {
      console.error('Timeline-Automation fehlgeschlagen:', error);
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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{project.title}</h3>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${category.tone}`}>
                  {category.label}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                  {status.label}
                </span>
                {project.workflowMode === 'timeline' && (
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                    Timeline
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-1">{project.description || 'Ohne Beschreibung'}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-semibold text-gray-900">{progress}%</span>
                </div>
                <ProgressBar value={progress} max={100} size="sm" animated />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  <Milestone size={11} />
                  {completedPhases}/{phases.length} Phasen
                </span>
                {project.deadline && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${deadlineRisk ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    <Calendar size={11} />
                    {format(new Date(project.deadline), 'd. MMM yyyy', { locale: de })}
                    {daysLeft !== null && ` · ${daysLeft >= 0 ? `${daysLeft} Tage` : `${Math.abs(daysLeft)} Tage drüber`}`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  <Target size={11} />
                  {linkedGoals.length} Ziele
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                  Review: {project.reviewCadence || 'weekly'}
                </span>
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openProjectModal(project)}
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
                onClick={() => void runTimelineAutomation()}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
              >
                <Wand2 size={12} />
                Nächste Phase automatisieren
              </button>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 mb-2">Nächster Schritt</p>
              <div className="flex items-center gap-2">
                <input
                  value={quickTaskTitle}
                  onChange={(event) => setQuickTaskTitle(event.target.value)}
                  placeholder="Konkrete nächste Projekt-Aufgabe"
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
                <p className="text-sm font-semibold text-gray-900 mb-2">Timeline-Phasen</p>
                {phases.length > 0 ? (
                  <div className="space-y-1.5">
                    {phases.map((phase) => (
                      <button
                        key={phase.id}
                        onClick={() => void handleTogglePhase(phase.id)}
                        className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-left hover:border-indigo-200"
                      >
                        <div className="min-w-0">
                          <p className={`text-sm ${phase.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {phase.title}
                          </p>
                          {phase.targetDate && (
                            <p className="text-xs text-gray-700">{format(new Date(phase.targetDate), 'd. MMM yyyy', { locale: de })}</p>
                          )}
                        </div>
                        <CheckCircle2 size={15} className={phase.completed ? 'text-emerald-600' : 'text-gray-400'} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">Noch keine Timeline-Phasen definiert.</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-semibold text-gray-900 mb-2">Verknüpfte Ziele</p>
                {linkedGoals.length > 0 ? (
                  <div className="space-y-1.5">
                    {linkedGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-900 truncate">{goal.title}</span>
                        <span className="text-xs text-gray-700">{goal.progress}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">Kein Ziel verknüpft.</p>
                )}
              </div>
            </div>

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
                  Keine aktive Projekt-Aufgabe vorhanden.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteProject(project.id)}
        title="Projekt löschen"
        message={`Möchtest du "${project.title}" wirklich löschen?`}
      />
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

  const activeProjects = useMemo(() => projects.filter((project) => project.status === 'active'), [projects]);
  const blockedProjects = useMemo(() => projects.filter((project) => project.status === 'on-hold'), [projects]);
  const completedProjects = useMemo(() => projects.filter((project) => project.status === 'completed'), [projects]);

  const timelineCoverage = useMemo(() => {
    const withTimeline = projects.filter((project) => (project.timelinePhases?.length || project.milestones?.length || 0) > 0).length;
    return projects.length > 0 ? Math.round((withTimeline / projects.length) * 100) : 0;
  }, [projects]);

  const dueSoonProjects = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    return projects.filter((project) => {
      if (!project.deadline) return false;
      if (project.status === 'completed' || project.status === 'archived') return false;
      const deadline = new Date(project.deadline);
      return deadline >= now && deadline <= nextWeek;
    });
  }, [projects]);

  const withoutNextStep = useMemo(() => {
    return projects
      .filter((project) => project.status !== 'completed' && project.status !== 'archived')
      .filter((project) => {
        const openTasks = tasks.filter(
          (task) =>
            getTaskProjectIds(task).includes(project.id) &&
            task.status !== 'completed' &&
            task.status !== 'archived'
        );
        return openTasks.length === 0;
      })
      .slice(0, 6);
  }, [projects, tasks]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const categoryMatch = categoryFilter === 'all' || project.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || project.status === statusFilter;
      const searchMatch =
        !search ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase());
      return categoryMatch && statusMatch && searchMatch;
    });
  }, [projects, categoryFilter, statusFilter, search]);

  const runGlobalTimelineAutomation = async () => {
    try {
      setAutomationBusy(true);
      let created = 0;

      for (const project of projects) {
        if (project.status === 'completed' || project.status === 'archived') continue;

        const phases = project.timelinePhases?.length ? project.timelinePhases : (project.milestones || []);
        const nextPhase = phases.find((phase) => !phase.completed);
        if (!nextPhase) continue;

        const openTasks = tasks.filter(
          (task) =>
            getTaskProjectIds(task).includes(project.id) &&
            task.status !== 'completed' &&
            task.status !== 'archived'
        );
        const title = `Timeline: ${nextPhase.title}`;
        const exists = openTasks.some((task) => task.title.trim().toLowerCase() === title.toLowerCase());
        if (exists) continue;

        const goalIds = project.goalIds?.length ? project.goalIds : (project.goalId ? [project.goalId] : []);
        await createTask({
          title,
          description: `Automatisch aus Projekt-Timeline "${project.title}"`,
          dueDate: nextPhase.targetDate ? new Date(nextPhase.targetDate) : (project.deadline ? new Date(project.deadline) : undefined),
          priority: project.riskLevel === 'high' ? 'high' : 'medium',
          status: 'todo',
          tags: ['projekt', 'timeline'],
          projectId: project.id,
          projectIds: [project.id],
          goalId: goalIds[0],
          goalIds,
        });
        created += 1;
      }

      if (created === 0) {
        alert('Keine neuen Timeline-Aufgaben nötig.');
      } else {
        alert(`${created} Timeline-Aufgaben wurden erstellt.`);
      }
    } catch (error) {
      console.error('Projekt-Automation fehlgeschlagen:', error);
      alert('Automation fehlgeschlagen.');
    } finally {
      setAutomationBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projekte</h1>
          <p className="text-gray-700 mt-1">Timeline-Workflow für saubere Lieferung bis zur Deadline.</p>
        </div>
        <Button onClick={() => openProjectModal()} variant="primary" leftIcon={<Plus size={16} />}>
          Neues Projekt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <Card className="p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Aktiv</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeProjects.length}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pausiert</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{blockedProjects.length}</p>
        </Card>
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Abgeschlossen</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{completedProjects.length}</p>
        </Card>
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Deadline ≤ 7 Tage</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{dueSoonProjects.length}</p>
        </Card>
        <Card className="p-4 border border-indigo-200 bg-indigo-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Timeline-Abdeckung</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{timelineCoverage}%</p>
        </Card>
      </div>

      <Card className="border border-indigo-100 bg-indigo-50/70">
        <CardHeader
          title="Project Delivery Board"
          subtitle="Steuere Phasen, Risiken und nächste Auslieferungsschritte"
          icon={<Sparkles size={16} className="text-indigo-700" />}
        />
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Projekte ohne nächsten Schritt</p>
            {withoutNextStep.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {withoutNextStep.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-900 truncate">{project.title}</span>
                    <span className="text-xs text-amber-800">0 Aufgaben</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-3">Alle aktiven Projekte haben offene Aufgaben.</p>
            )}
            <button
              onClick={() => void runGlobalTimelineAutomation()}
              disabled={automationBusy}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Wand2 size={12} />
              Timeline-Aufgaben erzeugen
            </button>
          </div>
          <div className="rounded-lg border border-red-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">Deadline-Risiko</p>
            {dueSoonProjects.length > 0 ? (
              <div className="space-y-1.5">
                {dueSoonProjects.slice(0, 6).map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-900 truncate">{project.title}</span>
                    <span className="text-xs text-red-800">
                      {project.deadline ? format(new Date(project.deadline), 'd. MMM', { locale: de }) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Keine kurzfristigen Deadline-Risiken erkannt.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Projekt durchsuchen..."
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as ProjectCategory | 'all')}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Kategorie Filter"
        >
          <option value="all">Alle Kategorien</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProjectFilterStatus)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Status Filter"
        >
          <option value="all">Alle Status</option>
          <option value="planning">Planung</option>
          <option value="active">Aktiv</option>
          <option value="on-hold">Pausiert</option>
          <option value="completed">Abgeschlossen</option>
          <option value="archived">Archiviert</option>
        </select>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects
            .slice()
            .sort((a, b) => {
              if (a.status !== b.status) return a.status.localeCompare(b.status);
              if (a.deadline && b.deadline) {
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
              }
              return a.title.localeCompare(b.title, 'de');
            })
            .map((project) => (
              <ProjectTimelineCard key={project.id} project={project} />
            ))}
        </div>
      ) : (
        <EmptyState
          type="folder"
          title="Keine Projekte gefunden"
          description="Passe Filter an oder starte ein neues Projekt."
          action={{ label: 'Projekt erstellen', onClick: () => openProjectModal() }}
        />
      )}
    </div>
  );
}
