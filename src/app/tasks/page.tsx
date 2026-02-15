'use client';

import { useDataStore } from '@/store';
import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Target,
  FolderKanban,
  X,
  Search
} from 'lucide-react';
import { useModals } from '@/components/layout/MainLayout';
import { Button, Card, CardContent, PriorityBadge, SearchInput, TasksEmptyState, SearchEmptyState } from '@/components/ui';

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'no-date';
type SortType = 'dueDate' | 'priority' | 'created' | 'title';

export default function TasksPage() {
  const { tasks, goals, projects, completeTask, deleteTask } = useDataStore();
  const { openTaskModal, openTaskDetailModal } = useModals();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const filteredTasks = useMemo(() => {
    let result = activeTasks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    switch (filter) {
      case 'today':
        result = result.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
        break;
      case 'upcoming':
        result = result.filter(t => t.dueDate && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }));
        break;
      case 'overdue':
        result = result.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
        break;
      case 'no-date':
        result = result.filter(t => !t.dueDate);
        break;
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'de');
        default:
          return 0;
      }
    });

    return result;
  }, [activeTasks, filter, priorityFilter, sortBy, searchQuery]);

  const taskCounts = useMemo(() => ({
    all: activeTasks.length,
    today: activeTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length,
    upcoming: activeTasks.filter(t => t.dueDate && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 })).length,
    overdue: activeTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length,
  }), [activeTasks]);

  const formatDueDate = (dueDate: Date) => {
    const date = new Date(dueDate);
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    return format(date, 'd. MMM', { locale: de });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aufgaben</h1>
        <p className="text-gray-500 mt-1">{activeTasks.length} aktive Aufgaben</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'all', label: 'Alle', count: taskCounts.all },
          { key: 'today', label: 'Heute', count: taskCounts.today },
          { key: 'upcoming', label: 'Diese Woche', count: taskCounts.upcoming },
          { key: 'overdue', label: 'Überfällig', count: taskCounts.overdue },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as FilterType)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${filter === f.key 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                filter === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Aufgaben durchsuchen..."
          className="flex-1"
        />

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          title="Priorität filtern"
        >
          <option value="all">Alle Prioritäten</option>
          <option value="urgent">Dringend</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          title="Sortieren nach"
        >
          <option value="priority">Nach Priorität</option>
          <option value="dueDate">Nach Datum</option>
          <option value="created">Neueste zuerst</option>
          <option value="title">Alphabetisch</option>
        </select>

        <Button
          onClick={() => openTaskModal()}
          variant="primary"
          leftIcon={<Plus size={16} />}
        >
          Neue Aufgabe
        </Button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        searchQuery ? (
          <SearchEmptyState query={searchQuery} />
        ) : (
          <TasksEmptyState onAdd={() => openTaskModal()} />
        )
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-100">
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
            
            return (
              <div 
                key={task.id} 
                className="group flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer animate-fade-in"
                onClick={() => openTaskDetailModal(task)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0"
                  title="Als erledigt markieren"
                >
                  <CheckCircle2 size={12} className="text-indigo-600 opacity-0 group-hover:opacity-100" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1.5 px-2 py-0.5 rounded ${isOverdue ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'}`}>
                        {isOverdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    {task.goalId && goals.find(g => g.id === task.goalId) && (
                      <span className="text-xs text-gray-500 flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-50">
                        <Target size={11} />
                        {goals.find(g => g.id === task.goalId)?.title}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Löschen"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
