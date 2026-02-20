'use client';

import { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Code2,
  DollarSign,
  Dumbbell,
  Edit2,
  FolderKanban,
  Heart,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Project, ProjectCategory, Task } from '@/types';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button, Card, CardContent, CardHeader, ProgressBar, EmptyState } from '@/components/ui';

type ProjectFilterStatus = 'all' | 'planning' | 'active' | 'on-hold' | 'completed';

const categoryConfig: Record<
  ProjectCategory,
  {
    label: string;
    icon: React.ReactNode;
    tone: string;
  }
> = {
  trading: { label: 'Trading', icon: <TrendingUp size={15} />, tone: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  finance: { label: 'Finanzen', icon: <DollarSign size={15} />, tone: 'text-green-700 bg-green-100 border-green-200' },
  fitness: { label: 'Fitness', icon: <Dumbbell size={15} />, tone: 'text-orange-700 bg-orange-100 border-orange-200' },
  health: { label: 'Gesundheit', icon: <Heart size={15} />, tone: 'text-red-700 bg-red-100 border-red-200' },
  wealth: { label: 'Vermögen', icon: <BarChart3 size={15} />, tone: 'text-amber-700 bg-amber-100 border-amber-200' },
  programming: { label: 'Tech', icon: <Code2 size={15} />, tone: 'text-indigo-700 bg-indigo-100 border-indigo-200' },
  improvement: { label: 'Verbesserung', icon: <Sparkles size={15} />, tone: 'text-purple-700 bg-purple-100 border-purple-200' },
  other: { label: 'Sonstiges', icon: <FolderKanban size={15} />, tone: 'text-slate-700 bg-slate-100 border-slate-200' },
};

const statusConfig: Record<Project['status'], { label: string; tone: string }> = {
  planning: { label: 'Planung', tone: 'bg-slate-100 text-slate-800 border-slate-200' },
  active: { label: 'Aktiv', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'on-hold': { label: 'On Hold', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Abgeschlossen', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  archived: { label: 'Archiv', tone: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function ProjectCard({ project }: { project: Project }) {
  const { tasks, deleteProject, createTask } = useDataStore();
  const { openProjectModal, openTaskDetailModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskBusy, setQuickTaskBusy] = useState(false);

  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const openTasks = projectTasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedTasks = projectTasks.filter((task) => task.status === 'completed');
  const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
  const config = categoryConfig[project.category] || categoryConfig.other;
  const status = statusConfig[project.status];

  const daysLeft = project.deadline ? differenceInCalendarDays(new Date(project.deadline), new Date()) : null;

  const handleQuickTask = async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;

    setQuickTaskBusy(true);
    try {
      await createTask({
        title,
        description: `Projekt: ${project.title}`,
        dueDate: startOfDay(new Date()),
        priority: 'medium',
        projectId: project.id,
        goalId: project.goalId,
        status: 'todo',
        tags: ['projekt'],
      });
      setQuickTaskTitle('');
    } catch (error) {
      console.error('Project quick task failed:', error);
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
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{project.title}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${config.tone}`}>
                  {config.icon}
                  {config.label}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                  {status.label}
                </span>
              </div>

              <p className="text-sm text-gray-700 line-clamp-1">{project.description}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span>{openTasks.length} offen · {completedTasks.length} erledigt</span>
                  <span className="font-semibold text-gray-900">{progress}%</span>
                </div>
                <ProgressBar value={progress} max={100} size="sm" animated />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-700">
                {project.deadline && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${daysLeft !== null && daysLeft < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                    <Calendar size={11} />
                    {daysLeft !== null && daysLeft < 0
                      ? `${Math.abs(daysLeft)} Tage drüber`
                      : `Deadline ${format(new Date(project.deadline), 'd. MMM yyyy', { locale: de })}`}
                  </span>
                )}
                {project.goalId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                    <Target size={11} />
                    Mit Ziel verknüpft
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openProjectModal(project)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                <Edit2 size={12} />
                Projekt bearbeiten
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
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Nächste Projekt-Aufgabe</p>
              <div className="flex items-center gap-2">
                <input
                  value={quickTaskTitle}
                  onChange={(event) => setQuickTaskTitle(event.target.value)}
                  placeholder="Konkreten nächsten Schritt eintragen..."
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

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Aktive Aufgaben</p>
              {openTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {openTasks.slice(0, 6).map((task: Task) => (
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
  const { projects, tasks } = useDataStore();
  const { openProjectModal } = useModals();
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectFilterStatus>('active');
  const [search, setSearch] = useState('');

  const activeProjects = useMemo(() => projects.filter((project) => project.status === 'active'), [projects]);
  const blockedProjects = useMemo(() => projects.filter((project) => project.status === 'on-hold'), [projects]);
  const completedProjects = useMemo(() => projects.filter((project) => project.status === 'completed'), [projects]);

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
          (task) => task.projectId === project.id && task.status !== 'completed' && task.status !== 'archived'
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projekte</h1>
          <p className="text-gray-700 mt-1">Arbeite projektbasiert mit klaren nächsten Schritten und Statuskontrolle.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openProjectModal()} variant="primary" leftIcon={<Plus size={16} />}>
            Neues Projekt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Aktiv</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeProjects.length}</p>
        </Card>
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">On Hold</p>
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
      </div>

      <Card className="border border-indigo-100 bg-indigo-50/60">
        <CardHeader
          title="Project Operating Board"
          subtitle="Wichtige Lücken und Risiken im laufenden Betrieb"
          icon={<Sparkles size={16} className="text-indigo-700" />}
        />
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Projekte ohne nächsten Schritt</p>
            {withoutNextStep.length > 0 ? (
              <div className="space-y-1.5">
                {withoutNextStep.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-900 truncate">{project.title}</span>
                    <span className="text-xs text-amber-800">0 Aufgaben</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">Alle aktiven Projekte haben Aufgaben im Backlog.</p>
            )}
          </div>
          <div className="rounded-lg border border-red-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">Deadline-Risiko</p>
            {dueSoonProjects.length > 0 ? (
              <div className="space-y-1.5">
                {dueSoonProjects.slice(0, 5).map((project) => (
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
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as ProjectCategory | 'all')}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Status Filter"
        >
          <option value="all">Alle Status</option>
          <option value="planning">Planung</option>
          <option value="active">Aktiv</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Abgeschlossen</option>
        </select>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects
            .slice()
            .sort((a, b) => {
              if (a.status !== b.status) return a.status.localeCompare(b.status);
              return a.title.localeCompare(b.title, 'de');
            })
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
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
