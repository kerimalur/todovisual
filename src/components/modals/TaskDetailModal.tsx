'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  X, 
  Pencil, 
  Trash2, 
  Calendar, 
  Target, 
  FolderKanban,
  Tag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ListChecks,
  Timer
} from 'lucide-react';
import { useDataStore } from '@/store';
import { Task } from '@/types';
import { ConfirmModal } from './ConfirmModal';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit: (task: Task) => void;
}

const priorityConfig = {
  low: { label: 'Niedrig', colorStyle: { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }, colorClass: 'text-white/50', dotColor: 'bg-white/30' },
  medium: { label: 'Mittel', colorStyle: { background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' }, colorClass: 'text-blue-300', dotColor: 'bg-blue-400' },
  high: { label: 'Hoch', colorStyle: { background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.25)' }, colorClass: 'text-orange-300', dotColor: 'bg-orange-400' },
  urgent: { label: 'Dringend', colorStyle: { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' }, colorClass: 'text-red-300', dotColor: 'bg-red-400' },
};

const impactLabels: Record<string, string> = {
  'goal-advancing': 'Ziel-fördernd',
  'urgent-important': 'Dringend & Wichtig',
  'urgent-not-important': 'Dringend, nicht wichtig',
  'maintenance': 'Routine/Wartung',
  'filler': 'Lückenfüller',
};

export function TaskDetailModal({ isOpen, onClose, task, onEdit }: TaskDetailModalProps) {
  const { goals, projects, events, completeTask, reactivateTask, deleteTask, updateTask } = useDataStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !task) return null;

  const linkedGoalIds = task.goalIds?.length ? task.goalIds : (task.goalId ? [task.goalId] : []);
  const linkedProjectIds = task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);
  const linkedGoals = goals.filter((goal) => linkedGoalIds.includes(goal.id));
  const linkedProjects = projects.filter((project) => linkedProjectIds.includes(project.id));
  const linkedEvent = events.find(e => e.taskId === task.id);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isCompleted = task.status === 'completed';

  const handleToggleComplete = () => {
    if (isCompleted) {
      reactivateTask(task.id);
    } else {
      completeTask(task.id);
    }
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-in zoom-in-95 fade-in duration-200 overflow-hidden"
          style={{ background: '#16192e', border: '1px solid rgba(255,255,255,0.10)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Completion Toggle */}
              <button
                onClick={handleToggleComplete}
                className={`mt-0.5 flex-shrink-0 transition-all hover:scale-110 ${
                  isCompleted ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'
                }`}
                title={isCompleted ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
              >
                {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h2 className={`text-lg font-semibold leading-tight ${
                  isCompleted ? 'line-through text-white/30' : 'text-white'
                }`}>
                  {task.title}
                </h2>

                {/* Priority Badge */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${priority.colorClass}`}
                    style={priority.colorStyle}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priority.dotColor}`} />
                    {priority.label}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-400" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.20)' }}>
                      ✓ Erledigt
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-white/30 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                title="Bearbeiten"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Löschen"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/30 hover:text-white/60 hover:bg-white/08 rounded-lg transition-colors"
                title="Schließen"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Description */}
            {task.description && (
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </div>
            )}

            {/* Meta Info Grid */}
            <div className="space-y-3">
              {/* Date & Time */}
              {(task.dueDate || linkedEvent) && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-white/30 flex-shrink-0" />
                  <div className="text-white/60">
                    {task.dueDate && (
                      <>
                        Geplanter Start:{' '}
                        {format(new Date(task.dueDate), 'EEEE, d. MMMM yyyy HH:mm', { locale: de })} Uhr
                      </>
                    )}
                    {linkedEvent && !task.dueDate && (
                      <span className="ml-2 text-white/40">
                        {format(new Date(linkedEvent.startTime), 'EEEE, d. MMMM yyyy HH:mm', { locale: de })} -{' '}
                        {format(new Date(linkedEvent.endTime), 'HH:mm')} Uhr
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Importance */}
              <div className="flex items-center gap-3 text-sm">
                <AlertTriangle size={16} className="text-white/30 flex-shrink-0" />
                <span className="text-white/60">Wichtigkeit: {priority.label}</span>
              </div>

              {/* Estimated Time */}
              {task.estimatedMinutes && (
                <div className="flex items-center gap-3 text-sm">
                  <Timer size={16} className="text-white/30 flex-shrink-0" />
                  <span className="text-white/60">
                    Geschätzt: {task.estimatedMinutes >= 60
                      ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60 > 0 ? `${task.estimatedMinutes % 60}min` : ''}`
                      : `${task.estimatedMinutes} min`
                    }
                  </span>
                </div>
              )}

              {/* Goals */}
              {linkedGoals.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Target size={16} className="text-white/30 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {linkedGoals.map((goal) => (
                      <span key={goal.id} className="px-2 py-0.5 rounded-full text-white/60 text-xs" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                        {goal.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {linkedProjects.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <FolderKanban size={16} className="text-white/30 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {linkedProjects.map((project) => (
                      <span key={project.id} className="px-2 py-0.5 rounded-full text-white/60 text-xs" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                        {project.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact */}
              {task.impact && (
                <div className="flex items-center gap-3 text-sm">
                  <AlertTriangle size={16} className="text-white/30 flex-shrink-0" />
                  <span className="text-white/60">{impactLabels[task.impact] || task.impact}</span>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag size={16} className="text-white/30 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-white/50 text-xs" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks size={16} className="text-white/30" />
                  <span className="text-sm font-medium text-white/60">
                    Schritte ({completedSubtasks}/{totalSubtasks})
                  </span>
                  {totalSubtasks > 0 && (
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {task.subtasks.map((subtask) => (
                    <button
                      key={subtask.id}
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className="flex items-center gap-2.5 w-full text-left p-2 rounded-lg hover:bg-white/05 transition-colors group"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle size={16} className="text-white/20 group-hover:text-white/40 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${subtask.completed ? 'text-white/30 line-through' : 'text-white/70'}`}>
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Edit Button */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <button
              onClick={() => onEdit(task)}
              className="w-full px-4 py-2.5 text-sm font-medium text-violet-400 rounded-xl transition-colors hover:text-violet-300"
              style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)' }}
            >
              Aufgabe bearbeiten
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Aufgabe löschen?"
        message={`Möchtest du die Aufgabe "${task.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        variant="danger"
      />
    </>
  );
}
