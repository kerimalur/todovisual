'use client';

import { useState, useMemo } from 'react';
import { Target, Plus, ChevronRight, Edit2, Trash2, CheckCircle2, Calendar, AlertTriangle, Zap, Clock, Info } from 'lucide-react';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';
import { Goal, Milestone, Task } from '@/types';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button, Card, ProgressBar, GoalsEmptyState } from '@/components/ui';

// Konstante für max freie Aufgaben pro Tag
const MAX_FREE_TASKS_PER_DAY = 2;

// Goal Card
function GoalCard({ goal, freeTasksToday }: { goal: Goal; freeTasksToday: number }) {
  const { tasks, deleteGoal, updateGoal } = useDataStore();
  const { openGoalModal, openTaskModal } = useModals();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const goalTasks = tasks.filter(t => t.goalId === goal.id);
  const completedTasks = goalTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = goalTasks.filter(t => t.status !== 'completed');
  
  const daysRemaining = differenceInDays(new Date(goal.deadline), new Date());
  const isOverdue = daysRemaining < 0;

  const toggleMilestone = (milestoneId: string) => {
    if (!goal.milestones) return;
    const updatedMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedMilestones = updatedMilestones.filter(m => m.completed).length;
    const newProgress = Math.round((completedMilestones / updatedMilestones.length) * 100);
    updateGoal(goal.id, { milestones: updatedMilestones, progress: newProgress });
  };

  return (
    <>
      <div className={`border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all ${expanded ? 'ring-2 ring-indigo-200' : ''}`}>
        {/* Goal Header */}
        <div 
          className="group p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${goal.color}15` }}
            >
              <Target size={20} style={{ color: goal.color }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-800">{goal.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openGoalModal(goal); }}
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

              {goal.description && (
                <p className="text-sm text-gray-500 line-clamp-1 mb-3">{goal.description}</p>
              )}

              {/* Progress & Stats */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {completedTasks}/{goalTasks.length} Aufgaben
                      {goal.milestones && goal.milestones.length > 0 && (
                        <> · {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} Meilensteine</>
                      )}
                    </span>
                    <span style={{ color: goal.color }} className="font-medium">
                      {goal.progress}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={goal.progress} 
                    max={100} 
                    color={goal.color}
                    size="sm"
                    animated
                  />
                </div>

                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Calendar size={12} />
                  {isOverdue 
                    ? `${Math.abs(daysRemaining)} Tage überfällig`
                    : `${daysRemaining} Tage übrig`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-gray-100 bg-gray-50/30 p-4 animate-fadeIn space-y-4">
            {/* Quick Summary Box */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Info size={14} className="text-indigo-500" />
                Ziel-Zusammenfassung
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold" style={{ color: goal.color }}>{goal.progress}%</p>
                  <p className="text-xs text-gray-500">Fortschritt</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">{pendingTasks.length}</p>
                  <p className="text-xs text-gray-500">Offene Aufgaben</p>
                </div>
                <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {Math.abs(daysRemaining)}
                  </p>
                  <p className="text-xs text-gray-500">{isOverdue ? 'Tage überfällig' : 'Tage übrig'}</p>
                </div>
              </div>
              
              {/* Description */}
              {goal.description && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              )}
            </div>

            {/* Motivation */}
            {goal.motivation && (
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <p className="text-xs text-indigo-600 font-medium mb-1">💪 Warum ist dieses Ziel wichtig?</p>
                <p className="text-sm text-gray-700">{goal.motivation}</p>
              </div>
            )}

            {/* Milestones */}
            {goal.milestones && goal.milestones.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Meilensteine</h4>
                <div className="space-y-1">
                  {goal.milestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      onClick={() => toggleMilestone(milestone.id)}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border hover:border-indigo-200 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 
                        size={16} 
                        className={milestone.completed ? 'text-emerald-500' : 'text-gray-300'} 
                      />
                      <span className={`text-sm flex-1 ${milestone.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {milestone.title}
                      </span>
                      {milestone.targetDate && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(milestone.targetDate), 'd. MMM', { locale: de })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Offene Aufgaben</h4>
                  <button
                    onClick={() => openTaskModal()}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Hinzufügen
                  </button>
                </div>
                <div className="space-y-1">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => openTaskModal(task)}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border hover:border-indigo-200 cursor-pointer transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                        </span>
                      )}
                    </div>
                  ))}
                  {pendingTasks.length > 5 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{pendingTasks.length - 5} weitere Aufgaben
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reward */}
            {goal.reward && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">🎁 Belohnung bei Erreichen</p>
                <p className="text-sm text-gray-700">{goal.reward}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteGoal(goal.id)}
        title="Ziel löschen"
        message={`Möchtest du "${goal.title}" wirklich löschen? Alle zugehörigen Aufgaben bleiben erhalten.`}
      />
    </>
  );
}

export default function GoalsPage() {
  const { goals, tasks } = useDataStore();
  const { openGoalModal, openTaskModal } = useModals();

  // Berechne freie Aufgaben (ohne Ziel/Projekt) für heute
  const freeTasksToday = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === 'completed') return false;
      if (t.goalId || t.projectId) return false;
      const due = new Date(t.dueDate);
      return due >= todayStart && due <= todayEnd;
    }).length;
  }, [tasks]);

  const hasExceededFreeTasks = freeTasksToday > MAX_FREE_TASKS_PER_DAY;

  // Sort goals by deadline
  const sortedGoals = [...goals].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ziele</h1>
            <p className="text-gray-500 mt-1">{goals.length} aktive Ziele</p>
          </div>
          <Button
            onClick={() => openGoalModal()}
            variant="primary"
            leftIcon={<Plus size={16} />}
          >
            Neues Ziel
          </Button>
        </div>
      </div>

      {/* Free Tasks Warning */}
      {freeTasksToday > 0 && (
        <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${
          hasExceededFreeTasks 
            ? 'bg-red-50 border-red-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <AlertTriangle size={20} className={hasExceededFreeTasks ? 'text-red-500' : 'text-amber-500'} />
          <div className="flex-1">
            <h4 className={`font-medium ${hasExceededFreeTasks ? 'text-red-700' : 'text-amber-700'}`}>
              {hasExceededFreeTasks 
                ? `Zu viele freie Aufgaben heute (${freeTasksToday}/${MAX_FREE_TASKS_PER_DAY})`
                : `${freeTasksToday} freie Aufgabe(n) für heute`
              }
            </h4>
            <p className={`text-sm mt-1 ${hasExceededFreeTasks ? 'text-red-600' : 'text-amber-600'}`}>
              {hasExceededFreeTasks 
                ? 'Versuche, Aufgaben mit deinen Zielen oder Projekten zu verknüpfen, um fokussiert zu bleiben.'
                : `Du hast noch ${MAX_FREE_TASKS_PER_DAY - freeTasksToday} freie Aufgabe(n) für heute übrig.`
              }
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => openTaskModal()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus size={12} />
                Aufgabe mit Ziel erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Tip */}
      <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-indigo-500" />
          <span className="text-xs font-medium text-indigo-600">Produktivitäts-Regel</span>
        </div>
        <p className="text-xs text-indigo-700">
          Maximal {MAX_FREE_TASKS_PER_DAY} Aufgaben pro Tag, die nicht mit einem Ziel oder Projekt verbunden sind.
          So bleibst du fokussiert auf das Wesentliche!
        </p>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {sortedGoals.length > 0 ? (
          sortedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} freeTasksToday={freeTasksToday} />)
        ) : (
          <GoalsEmptyState onAdd={() => openGoalModal()} />
        )}
      </div>
    </div>
  );
}
