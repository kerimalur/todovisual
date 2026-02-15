'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  FolderKanban, 
  TrendingUp, 
  DollarSign, 
  Dumbbell, 
  Heart, 
  Code2, 
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  BarChart3,
  Filter
} from 'lucide-react';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Project, ProjectCategory } from '@/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const categoryConfig: Record<ProjectCategory, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  trading: { 
    label: 'Trading & Investment', 
    icon: <TrendingUp size={18} />, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    description: 'Trading-Strategien, Marktanalysen, Portfolio-Management'
  },
  finance: { 
    label: 'Finanzen & Budget', 
    icon: <DollarSign size={18} />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Budgetierung, Sparziele, finanzielle Planung'
  },
  fitness: { 
    label: 'Fitness & Gym', 
    icon: <Dumbbell size={18} />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Trainingspläne, Kraftaufbau, Ausdauer'
  },
  health: { 
    label: 'Gesundheit & Wellness', 
    icon: <Heart size={18} />, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Ernährung, Schlaf, mentale Gesundheit'
  },
  wealth: { 
    label: 'Vermögensaufbau', 
    icon: <BarChart3 size={18} />, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Langfristiger Vermögensaufbau, Investments'
  },
  programming: { 
    label: 'Programmieren & Tech', 
    icon: <Code2 size={18} />, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'Softwareprojekte, Lernen, Side-Projects'
  },
  improvement: { 
    label: 'Stetige Verbesserung', 
    icon: <Sparkles size={18} />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Persönliche Entwicklung, Gewohnheiten, Skills'
  },
  other: { 
    label: 'Sonstiges', 
    icon: <FolderKanban size={18} />, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    description: 'Andere Projekte'
  },
};

const statusConfig = {
  planning: { label: 'Planung', color: 'bg-slate-100 text-slate-600' },
  active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
  'on-hold': { label: 'Pausiert', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Archiviert', color: 'bg-gray-100 text-gray-500' },
};

function ProjectCard({ project }: { project: Project }) {
  const { tasks, deleteProject } = useDataStore();
  const { openProjectModal, openTaskModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const config = categoryConfig[project.category] || categoryConfig.other;
  const status = statusConfig[project.status];
  
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  return (
    <>
      <div className={`border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all ${expanded ? 'ring-2 ring-indigo-200' : ''}`}>
        {/* Project Header */}
        <div 
          className="group p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${config.bgColor} border flex items-center justify-center flex-shrink-0`}>
              <span className={config.color}>{config.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{project.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openProjectModal(project); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight 
                    size={16} 
                    className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-1 mb-3">{project.description}</p>

              {/* Progress & Stats */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">{completedTasks}/{projectTasks.length} Aufgaben</span>
                    <span className={`font-medium ${config.color}`}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} />
                    {format(new Date(project.deadline), 'd. MMM', { locale: de })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-gray-100 bg-gray-50/30 p-4 animate-fadeIn">
            {/* Category-specific data */}
            {project.category === 'trading' && project.tradingData && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Strategie</p>
                  <p className="font-medium text-sm">{project.tradingData.strategy || '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Risiko-Level</p>
                  <p className="font-medium text-sm capitalize">{project.tradingData.riskLevel || '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Ziel-Return</p>
                  <p className="font-medium text-sm">{project.tradingData.targetReturn ? `${project.tradingData.targetReturn}%` : '-'}</p>
                </div>
              </div>
            )}

            {project.category === 'fitness' && project.fitnessData && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Trainingstage/Woche</p>
                  <p className="font-medium text-sm">{project.fitnessData.workoutDays?.length || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Trainingsart</p>
                  <p className="font-medium text-sm">{project.fitnessData.exerciseType || '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Zielgewicht</p>
                  <p className="font-medium text-sm">{project.fitnessData.targetWeight ? `${project.fitnessData.targetWeight} kg` : '-'}</p>
                </div>
              </div>
            )}

            {project.category === 'finance' && project.financeData && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Budget</p>
                  <p className="font-medium text-sm">{project.financeData.budget ? `${project.financeData.budget}€` : '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Ausgegeben</p>
                  <p className="font-medium text-sm">{project.financeData.spent ? `${project.financeData.spent}€` : '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1">Sparziel</p>
                  <p className="font-medium text-sm">{project.financeData.savingsTarget ? `${project.financeData.savingsTarget}€` : '-'}</p>
                </div>
              </div>
            )}

            {project.category === 'programming' && project.programmingData && (
              <div className="space-y-3 mb-4">
                {project.programmingData.techStack && project.programmingData.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.programmingData.techStack.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.programmingData.repository && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Repository</p>
                    <a href={project.programmingData.repository} target="_blank" rel="noopener noreferrer" 
                       className="text-sm text-indigo-600 hover:underline truncate block">
                      {project.programmingData.repository}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Aufgaben</h4>
                <button
                  onClick={() => openTaskModal()}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={12} />
                  Hinzufügen
                </button>
              </div>

              {projectTasks.length > 0 ? (
                <div className="space-y-1">
                  {projectTasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => openTaskModal(task)}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border hover:border-indigo-200 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 
                        size={14} 
                        className={task.status === 'completed' ? 'text-emerald-500' : 'text-gray-300'} 
                      />
                      <span className={`text-sm flex-1 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                        </span>
                      )}
                    </div>
                  ))}
                  {projectTasks.length > 5 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{projectTasks.length - 5} weitere Aufgaben
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  Noch keine Aufgaben
                </p>
              )}
            </div>

            {/* Notes */}
            {project.notes && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Notizen</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteProject(project.id)}
        title="Projekt löschen"
        message={`Möchtest du "${project.title}" wirklich löschen? Alle zugehörigen Aufgaben bleiben erhalten.`}
      />
    </>
  );
}

export default function ProjectsPage() {
  const { projects } = useDataStore();
  const { openProjectModal, openTaskModal } = useModals();
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showQuickStart, setShowQuickStart] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
      const statusMatch = statusFilter === 'all' || p.status === statusFilter;
      return categoryMatch && statusMatch;
    });
  }, [projects, selectedCategory, statusFilter]);

  const projectsByCategory = useMemo(() => {
    const grouped: Record<ProjectCategory, Project[]> = {
      trading: [], finance: [], fitness: [], health: [], 
      wealth: [], programming: [], improvement: [], other: []
    };
    
    filteredProjects.forEach(p => {
      if (grouped[p.category]) {
        grouped[p.category].push(p);
      }
    });
    
    return grouped;
  }, [filteredProjects]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projekte</h1>
            <p className="text-gray-500 mt-1">{projects.length} Projekte insgesamt</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickStart(!showQuickStart)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                showQuickStart 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={16} className="text-indigo-500" />
              Quick-Start
            </button>
            <button
              onClick={() => openProjectModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={16} />
              Neues Projekt
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Panel - Vertiefte Projekt-Vorlagen */}
      {showQuickStart && (
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 animate-fadeIn">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500" />
            Starte ein vertieftes Projekt
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Wähle eine Kategorie für ein fokussiertes Deep-Work-Projekt mit vordefinierten Meilensteinen und Best Practices.
          </p>
          
          <div className="grid grid-cols-4 gap-3">
            {(Object.entries(categoryConfig) as [ProjectCategory, typeof categoryConfig[ProjectCategory]][]).slice(0, -1).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  openProjectModal(undefined, key);
                  setShowQuickStart(false);
                }}
                className={`p-4 rounded-xl border-2 ${config.bgColor} hover:shadow-md transition-all text-left group`}
              >
                <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-2 ${config.color}`}>
                  {config.icon}
                </div>
                <h4 className="font-medium text-gray-800 text-sm mb-1">{config.label}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{config.description}</p>
              </button>
            ))}
          </div>

          {/* Deep Work Tipps */}
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium mb-2">💡 Deep Work Tipps:</p>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Setze klare Meilensteine für messbare Fortschritte</li>
              <li>• Verknüpfe Aufgaben mit deinen Zielen für mehr Fokus</li>
              <li>• Nutze Zeitblöcke (Pomodoro) für konzentrierte Arbeit</li>
              <li>• Reflektiere wöchentlich über deine Fortschritte</li>
            </ul>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
            ${selectedCategory === 'all' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Alle
        </button>
        {(Object.entries(categoryConfig) as [ProjectCategory, typeof categoryConfig[ProjectCategory]][]).map(([key, config]) => {
          const count = projectsByCategory[key]?.length || 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                ${selectedCategory === key 
                  ? `${config.bgColor} ${config.color} border` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {config.icon}
              {config.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 rounded-full ${selectedCategory === key ? 'bg-white/50' : 'bg-gray-200'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} className="text-gray-400" />
        <span className="text-sm text-gray-500">Status:</span>
        {['all', 'active', 'planning', 'on-hold', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors
              ${statusFilter === status 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {status === 'all' ? 'Alle' : statusConfig[status as keyof typeof statusConfig]?.label || status}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-4">
          {selectedCategory === 'all' ? (
            // Show by category
            Object.entries(projectsByCategory).map(([category, categoryProjects]) => {
              if (categoryProjects.length === 0) return null;
              const config = categoryConfig[category as ProjectCategory];
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    <h2 className="font-semibold text-gray-700">{config.label}</h2>
                    <span className="text-xs text-gray-400">({categoryProjects.length})</span>
                  </div>
                  <div className="grid gap-3">
                    {categoryProjects.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Show filtered
            <div className="grid gap-3">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-indigo-500" />
          </div>
          <p className="font-medium text-gray-700 mb-1">Noch keine Projekte</p>
          <p className="text-sm text-gray-500 mb-4">
            Erstelle dein erstes Projekt, um loszulegen.
          </p>
          <button onClick={() => openProjectModal()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all">
            <Plus size={16} />
            Projekt erstellen
          </button>
        </div>
      )}
    </div>
  );
}
