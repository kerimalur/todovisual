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
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-600',
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Archiv</h1>
            <p className="text-gray-500 mt-1">{completedTasks.length} erledigte Aufgaben</p>
          </div>
          
          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
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
          <div className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Gesamt</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
          </div>
          <div className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium">Produktive Tage</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedTasks).length}</p>
          </div>
          <div className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Target size={16} />
              <span className="text-sm font-medium">Ø pro Tag</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(completedTasks.length / Math.max(Object.keys(groupedTasks).length, 1))}
            </p>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-md p-5 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-md">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <h3 className="font-semibold text-[#37352f]">Alle erledigten Aufgaben löschen?</h3>
            </div>
            <p className="text-sm text-[#6b6b6b] mb-5">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle {completedTasks.length} erledigten Aufgaben werden dauerhaft gelöscht.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
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
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Archive size={28} className="text-gray-400" />
          </div>
          <p className="font-medium text-gray-700 mb-1">Keine erledigten Aufgaben</p>
          <p className="text-sm text-gray-500">Erledigte Aufgaben erscheinen hier.</p>
        </div>
      )}

      {/* Tasks List by Date */}
      {Object.entries(groupedTasks).map(([date, dateTasks]) => (
        <div key={date} className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {date === 'unknown' 
              ? 'Unbekanntes Datum'
              : format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })
            }
            <span className="ml-2 text-gray-400 font-normal">({dateTasks.length})</span>
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {dateTasks.map((task) => (
              <div key={task.id} className="group flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-600 line-through">{task.title}</span>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getPriorityBadge(task.priority)}`}>
                      {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                    {task.completedAt && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(task.completedAt), 'HH:mm', { locale: de })} Uhr
                      </span>
                    )}
                    {getGoalName(task.goalId) && (
                      <span className="text-xs text-gray-400">• {getGoalName(task.goalId)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => reactivateTask(task.id)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Reaktivieren"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
