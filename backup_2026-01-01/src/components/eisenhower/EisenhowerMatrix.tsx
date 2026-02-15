'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/store';
import { TaskService, EisenhowerQuadrant } from '@/services/taskService';
import { AlertTriangle, Target, Users, Trash2, Calendar, Zap } from 'lucide-react';
import { useModals } from '../layout/MainLayout';

const QUADRANT_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  icon: typeof AlertTriangle;
  bgColor: string;
  borderColor: string;
  headerBg: string;
  iconColor: string;
  textColor: string;
  badge?: string;
}> = {
  Q1: {
    title: 'JETZT TUN',
    subtitle: 'Dringend & Wichtig',
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    headerBg: 'bg-red-100',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
  },
  Q2: {
    title: 'PLANEN',
    subtitle: 'Wichtig, Nicht Dringend',
    icon: Target,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-700',
    badge: 'FOKUS',
  },
  Q3: {
    title: 'DELEGIEREN',
    subtitle: 'Dringend, Nicht Wichtig',
    icon: Users,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-700',
  },
  Q4: {
    title: 'ELIMINIEREN',
    subtitle: 'Weder Dringend Noch Wichtig',
    icon: Trash2,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    headerBg: 'bg-gray-100',
    iconColor: 'text-gray-400',
    textColor: 'text-gray-600',
  },
};

export function EisenhowerMatrix() {
  const { tasks } = useDataStore();
  const { openTaskModal } = useModals();

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed'),
    [tasks]
  );

  const tasksByQuadrant = useMemo(
    () => ({
      Q1: TaskService.filterByQuadrant(activeTasks, 'Q1'),
      Q2: TaskService.filterByQuadrant(activeTasks, 'Q2'),
      Q3: TaskService.filterByQuadrant(activeTasks, 'Q3'),
      Q4: TaskService.filterByQuadrant(activeTasks, 'Q4'),
    }),
    [activeTasks]
  );

  const distribution = useMemo(
    () => TaskService.getQuadrantDistribution(activeTasks),
    [activeTasks]
  );

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {distribution.Q1 > 50 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span className="font-semibold">Warnung: Zu viel Firefighting!</span>
          </div>
          <p className="text-sm mt-1 text-red-600">
            {distribution.Q1}% deiner Aufgaben sind in Q1 (Dringend & Wichtig).
            Versuche mehr Zeit in Q2 zu investieren um Krisen vorzubeugen.
          </p>
        </div>
      )}

      {/* Distribution Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quad) => {
          const config = QUADRANT_CONFIG[quad];
          return (
            <div key={quad} className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor} text-center`}>
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {distribution[quad]}%
              </div>
              <div className="text-xs text-gray-500 mt-1">{config.title}</div>
            </div>
          );
        })}
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-4">
        {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quadrant) => {
          const config = QUADRANT_CONFIG[quadrant];
          const Icon = config.icon;
          const quadrantTasks = tasksByQuadrant[quadrant];

          return (
            <div key={quadrant} className={`rounded-xl border overflow-hidden ${config.bgColor} ${config.borderColor}`}>
              {/* Header */}
              <div className={`flex items-center gap-3 p-4 ${config.headerBg} border-b ${config.borderColor}`}>
                <Icon size={20} className={config.iconColor} />
                <div className="flex-1">
                  <h3 className={`font-bold text-sm ${config.textColor}`}>{config.title}</h3>
                  <p className="text-xs text-gray-500">{config.subtitle}</p>
                </div>
                <span className={`text-lg font-bold ${config.textColor}`}>{quadrantTasks.length}</span>
                {(config as any).badge && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-blue-600 text-white rounded-full">
                    {config.badge}
                  </span>
                )}
              </div>

              {/* Task List */}
              <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
                {quadrantTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Keine Aufgaben
                  </div>
                ) : (
                  quadrantTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openTaskModal(task)}
                      className="p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {task.title}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : task.priority === 'medium'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                        </span>

                        {task.dueDate && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(task.dueDate).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        )}

                        {task.energyLevel && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Zap size={10} />
                            {task.energyLevel === 'high' ? 'Hoch' : task.energyLevel === 'medium' ? 'Mittel' : 'Niedrig'}
                          </span>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-600"
                            >
                              #{tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="text-[10px] text-gray-400">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Target size={16} className="text-indigo-500" />
          Eisenhower Matrix Prinzip
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
            <span><strong className="text-blue-700">Q2 (Planen)</strong> ist die wichtigste Zone - hier entsteht langfristiger Erfolg</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
            <span><strong className="text-red-700">Q1 (Jetzt tun)</strong> sollte minimiert werden durch bessere Planung in Q2</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
            <span><strong className="text-amber-700">Q3 (Delegieren)</strong> sollte an andere delegiert werden, wenn möglich</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
            <span><strong className="text-gray-600">Q4 (Eliminieren)</strong> sollte gelöscht oder auf später verschoben werden</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
