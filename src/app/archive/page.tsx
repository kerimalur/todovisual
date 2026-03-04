'use client';

import { useDataStore } from '@/store';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { RotateCcw, Trash2, Archive, AlertCircle, CheckCircle2, Clock, Target } from 'lucide-react';
import { useState } from 'react';

export default function ArchivePage() {
  const { tasks, goals, projects, reactivateTask, deleteTask, deleteCompletedTasks } = useDataStore();
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    return goals.find(g => g.id === goalId)?.title || null;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-500/15 text-red-400',
      high: 'bg-orange-500/15 text-orange-400',
      medium: 'bg-blue-500/15 text-blue-400',
      low: 'bg-white/08 text-white/50',
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const handleDeleteAll = () => {
    deleteCompletedTasks();
    setShowDeleteAllConfirm(false);
  };

  // Group by completion date
  const groupedTasks = completedTasks.reduce((acc, task) => {
    const date = task.completedAt
      ? format(new Date(task.completedAt), 'yyyy-MM-dd')
      : 'unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #64748b, #4338ca)' }}>
              <Archive size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Archiv</h1>
              <p className="text-white/50 mt-1">{completedTasks.length} erledigte Aufgaben</p>
            </div>
          </div>

          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium border border-red-500/20"
            >
              <Trash2 size={16} />
              Alle löschen
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {completedTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl border border-white/08 hover:border-white/15 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Gesamt</span>
            </div>
            <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/08 hover:border-white/15 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium">Produktive Tage</span>
            </div>
            <p className="text-2xl font-bold text-white">{Object.keys(groupedTasks).length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/08 hover:border-white/15 transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Target size={16} />
              <span className="text-sm font-medium">Ø pro Tag</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.round(completedTasks.length / Math.max(Object.keys(groupedTasks).length, 1))}
            </p>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
          <div className="rounded-2xl border border-red-500/20 p-5 w-full max-w-md mx-4 shadow-2xl" style={{ background: '#161827' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl border border-red-500/20" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle className="text-red-400" size={20} />
              </div>
              <h3 className="font-semibold text-white">Alle erledigten Aufgaben löschen?</h3>
            </div>
            <p className="text-sm text-white/60 mb-5">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle {completedTasks.length} erledigten Aufgaben werden dauerhaft gelöscht.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2.5 text-sm font-medium text-white/70 border border-white/10 rounded-xl transition-colors hover:bg-white/06"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Alle löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Archive size={28} className="text-white/30" />
          </div>
          <p className="font-medium text-white/70 mb-1">Keine erledigten Aufgaben</p>
          <p className="text-sm text-white/40">Erledigte Aufgaben erscheinen hier.</p>
        </div>
      )}

      {/* Tasks List by Date */}
      {Object.entries(groupedTasks).map(([date, dateTasks]) => (
        <div key={date} className="mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            {date === 'unknown'
              ? 'Unbekanntes Datum'
              : format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })
            }
            <span className="ml-2 text-white/25 font-normal">({dateTasks.length})</span>
          </h2>

          <div className="rounded-2xl border border-white/08 overflow-hidden divide-y divide-white/06" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {dateTasks.map((task) => (
              <div key={task.id} className="group flex items-start gap-3 p-4 hover:bg-white/03 transition-colors">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white/40 line-through">{task.title}</span>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getPriorityBadge(task.priority)}`}>
                      {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                    {task.completedAt && (
                      <span className="text-xs text-white/30">
                        {format(new Date(task.completedAt), 'HH:mm', { locale: de })} Uhr
                      </span>
                    )}
                    {getGoalName(task.goalId) && (
                      <span className="text-xs text-white/30">• {getGoalName(task.goalId)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => reactivateTask(task.id)}
                    className="p-2 text-white/30 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                    title="Reaktivieren"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Endgültig löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
