'use client';

import { useDataStore } from '@/store';
import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isThisWeek, isPast, startOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Target,
  FolderKanban,
  X,
  Link2,
  Clock,
  Zap,
  InboxIcon,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { useModals } from '@/components/layout/MainLayout';
import { PriorityBadge, TasksEmptyState, SearchEmptyState } from '@/components/ui';

type FilterType = 'all' | 'inbox' | 'today' | 'upcoming' | 'overdue';
type SortType = 'dueDate' | 'priority' | 'created' | 'title';

const priorityConfig = {
  urgent: {
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    bg: 'hover:bg-red-50/30',
    label: 'Dringend',
  },
  high: {
    border: 'border-l-orange-400',
    dot: 'bg-orange-400',
    bg: 'hover:bg-orange-50/30',
    label: 'Hoch',
  },
  medium: {
    border: 'border-l-blue-400',
    dot: 'bg-blue-400',
    bg: 'hover:bg-blue-50/20',
    label: 'Mittel',
  },
  low: {
    border: 'border-l-gray-300',
    dot: 'bg-gray-300',
    bg: 'hover:bg-gray-50',
    label: 'Niedrig',
  },
};

export default function TasksPage() {
  const {
    tasks,
    events,
    goals,
    projects,
    completeTask,
    deleteTask,
    createTask,
    updateEvent,
    planInboxTasksForToday,
    rescheduleOverdueTasks,
  } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();

  const [filter, setFilter] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [planningBusy, setPlanningBusy] = useState(false);
  const [planningMessage, setPlanningMessage] = useState('');
  const [eventAdoptBusyId, setEventAdoptBusyId] = useState<string | null>(null);
  const [showOrphanEvents, setShowOrphanEvents] = useState(false);

  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
  );
  const inboxTasks = activeTasks.filter((task) => !task.dueDate);
  const overdueTasks = activeTasks.filter(
    (task) => task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  );
  const todayTasks = activeTasks.filter((task) => task.dueDate && isToday(new Date(task.dueDate)));

  const orphanUpcomingEvents = useMemo(() => {
    const rangeStart = startOfDay(new Date());
    const rangeEnd = addDays(rangeStart, 14);
    return events
      .filter((event) => {
        if (event.taskId || event.linkedTaskId) return false;
        const start = new Date(event.startTime);
        return start >= rangeStart && start <= rangeEnd;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 6);
  }, [events]);

  const mitCandidate = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pool = [...activeTasks].sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return pool[0] ?? null;
  }, [activeTasks]);

  const filteredTasks = useMemo(() => {
    let result = activeTasks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    switch (filter) {
      case 'inbox':
        result = result.filter((task) => !task.dueDate);
        break;
      case 'today':
        result = result.filter((task) => task.dueDate && isToday(new Date(task.dueDate)));
        break;
      case 'upcoming':
        result = result.filter(
          (task) =>
            task.dueDate &&
            isThisWeek(new Date(task.dueDate), { weekStartsOn: 1 }) &&
            !isPast(new Date(task.dueDate))
        );
        break;
      case 'overdue':
        result = result.filter(
          (task) =>
            task.dueDate &&
            isPast(new Date(task.dueDate)) &&
            !isToday(new Date(task.dueDate))
        );
        break;
      default:
        break;
    }

    if (priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority': {
          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
        }
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'de');
        default:
          return 0;
      }
    });
  }, [activeTasks, filter, priorityFilter, sortBy, searchQuery]);

  const taskCounts = useMemo(
    () => ({
      all: activeTasks.length,
      inbox: inboxTasks.length,
      today: todayTasks.length,
      upcoming: activeTasks.filter(
        (task) =>
          task.dueDate &&
          isThisWeek(new Date(task.dueDate), { weekStartsOn: 1 }) &&
          !isPast(new Date(task.dueDate))
      ).length,
      overdue: overdueTasks.length,
    }),
    [activeTasks, inboxTasks.length, overdueTasks.length, todayTasks.length]
  );

  const handlePlanInbox = async () => {
    setPlanningBusy(true);
    setPlanningMessage('');
    try {
      const planned = await planInboxTasksForToday(3);
      setPlanningMessage(
        planned > 0 ? `${planned} Inbox-Aufgaben wurden auf heute geplant.` : 'Keine Inbox-Aufgaben zum Planen.'
      );
    } catch {
      setPlanningMessage('Inbox-Planung fehlgeschlagen.');
    } finally {
      setPlanningBusy(false);
    }
  };

  const handleReschedule = async () => {
    setPlanningBusy(true);
    setPlanningMessage('');
    try {
      const moved = await rescheduleOverdueTasks(3);
      setPlanningMessage(
        moved > 0 ? `${moved} überfällige Aufgaben wurden neu geplant.` : 'Keine überfälligen Aufgaben gefunden.'
      );
    } catch {
      setPlanningMessage('Neuplanung fehlgeschlagen.');
    } finally {
      setPlanningBusy(false);
    }
  };

  const handleAdoptEventAsTask = async (eventId: string) => {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    setEventAdoptBusyId(eventId);
    try {
      const createdTask = await createTask({
        title: `Termin: ${event.title}`,
        description:
          event.description ||
          `Aus dem Kalender übernommen (${format(new Date(event.startTime), 'd. MMM HH:mm', { locale: de })})`,
        dueDate: new Date(event.startTime),
        priority: 'medium',
        status: 'todo',
        tags: ['kalender', 'termin'],
      });
      await updateEvent(event.id, {
        taskId: createdTask.id,
        linkedTaskId: createdTask.id,
      });
    } catch (error) {
      console.error('Event konnte nicht als Aufgabe übernommen werden:', error);
    } finally {
      setEventAdoptBusyId(null);
    }
  };

  const formatDueDate = (dueDate: Date) => {
    const date = new Date(dueDate);
    const dayLabel = isToday(date) ? 'Heute' : isTomorrow(date) ? 'Morgen' : format(date, 'd. MMM', { locale: de });
    return `${dayLabel}, ${format(date, 'HH:mm')} Uhr`;
  };

  const filterTabs = [
    { key: 'all', label: 'Alle', count: taskCounts.all, color: 'indigo' },
    { key: 'inbox', label: 'Inbox', count: taskCounts.inbox, color: 'gray' },
    { key: 'today', label: 'Heute', count: taskCounts.today, color: 'blue' },
    { key: 'upcoming', label: 'Diese Woche', count: taskCounts.upcoming, color: 'purple' },
    { key: 'overdue', label: 'Überfällig', count: taskCounts.overdue, color: 'red' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Aufgaben</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeTasks.length} aktive Aufgaben · {completedToday.length} heute erledigt</p>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200/50 hover:shadow-indigo-300/60 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
        >
          <Plus size={16} />
          Neue Aufgabe
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Aktiv gesamt',
            value: activeTasks.length,
            icon: Zap,
            bg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            border: 'border-indigo-100',
          },
          {
            label: 'Heute fällig',
            value: taskCounts.today,
            icon: Calendar,
            bg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            border: 'border-blue-100',
          },
          {
            label: 'Inbox',
            value: taskCounts.inbox,
            icon: InboxIcon,
            bg: 'bg-gray-50',
            iconColor: 'text-gray-500',
            border: 'border-gray-200',
          },
          {
            label: 'Überfällig',
            value: taskCounts.overdue,
            icon: AlertTriangle,
            bg: overdueTasks.length > 0 ? 'bg-red-50' : 'bg-gray-50',
            iconColor: overdueTasks.length > 0 ? 'text-red-500' : 'text-gray-400',
            border: overdueTasks.length > 0 ? 'border-red-100' : 'border-gray-200',
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3 px-4 py-3 ${stat.bg} border ${stat.border} rounded-xl animate-fade-in-up stagger-${i + 1}`}
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={15} className={stat.iconColor} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Planning Ritual */}
      <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Daily Planning</p>
              <p className="text-sm text-gray-700 mt-0.5">
                <span className="font-semibold">{inboxTasks.length}</span> in Inbox ·{' '}
                <span className="font-semibold text-red-600">{overdueTasks.length}</span> überfällig
              </p>
              {planningMessage && (
                <p className="text-xs text-indigo-700 mt-1 font-medium">{planningMessage}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void handlePlanInbox()}
              disabled={planningBusy}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Inbox → Heute
            </button>
            <button
              onClick={() => void handleReschedule()}
              disabled={planningBusy}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              Überfällige planen
            </button>
            {mitCandidate && (
              <button
                onClick={() => openTaskDetailModal(mitCandidate)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                MIT öffnen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orphan Events (collapsible) */}
      {orphanUpcomingEvents.length > 0 && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 overflow-hidden animate-fade-in-up stagger-3">
          <button
            onClick={() => setShowOrphanEvents(!showOrphanEvents)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-sky-50/80 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <Link2 size={13} className="text-sky-600" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">Termine ohne Aufgabe</p>
                <p className="text-sm text-gray-700">{orphanUpcomingEvents.length} Termine in den nächsten 14 Tagen</p>
              </div>
            </div>
            <span className="text-xs text-sky-500 font-medium">{showOrphanEvents ? 'Einklappen' : 'Anzeigen'}</span>
          </button>
          {showOrphanEvents && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              {orphanUpcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white px-3 py-2.5"
                >
                  <button onClick={() => openEventModal(event)} className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(event.startTime), 'EEE, d. MMM HH:mm', { locale: de })}
                    </p>
                  </button>
                  <button
                    onClick={() => void handleAdoptEventAsTask(event.id)}
                    disabled={eventAdoptBusyId === event.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                  >
                    <Link2 size={11} />
                    {eventAdoptBusyId === event.id ? 'Übernehme...' : 'Als Aufgabe'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs + Controls */}
      <div className="flex flex-col gap-3">
        {/* Pill tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            const isOverdue = tab.key === 'overdue' && tab.count > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as FilterType)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? isOverdue
                      ? 'bg-red-600 text-white shadow-md shadow-red-200'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : isOverdue
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Sort row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Aufgaben suchen..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-8 pr-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer appearance-none"
            >
              <option value="all">Alle Prioritäten</option>
              <option value="urgent">Dringend</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="pl-8 pr-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer appearance-none"
            >
              <option value="priority">Nach Priorität</option>
              <option value="dueDate">Nach Datum</option>
              <option value="created">Neueste zuerst</option>
              <option value="title">Alphabetisch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        searchQuery ? (
          <SearchEmptyState query={searchQuery} />
        ) : (
          <TasksEmptyState onAdd={() => openTaskModal()} />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="divide-y divide-gray-50">
            {filteredTasks.map((task, idx) => {
              const isOverdue =
                task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
              const priority = (task.priority as keyof typeof priorityConfig) in priorityConfig
                ? (task.priority as keyof typeof priorityConfig)
                : 'low';
              const pc = priorityConfig[priority];
              const linkedGoalIds = task.goalIds?.length ? task.goalIds : task.goalId ? [task.goalId] : [];
              const linkedProjectIds = task.projectIds?.length ? task.projectIds : task.projectId ? [task.projectId] : [];
              const linkedGoalTitles = goals.filter((g) => linkedGoalIds.includes(g.id)).map((g) => g.title);
              const linkedProjectTitles = projects.filter((p) => linkedProjectIds.includes(p.id)).map((p) => p.title);

              return (
                <div
                  key={task.id}
                  className={`group relative flex items-start gap-0 border-l-4 ${pc.border} ${pc.bg} transition-all duration-150 cursor-pointer animate-fade-in`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => openTaskDetailModal(task)}
                >
                  {/* Check button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                    className="self-stretch flex items-start pt-4 pl-4 pr-3 flex-shrink-0"
                    title="Als erledigt markieren"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-all">
                      <CheckCircle2 size={12} className="text-indigo-600 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-3.5 pr-4">
                    <div className="flex items-start gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{task.title}</p>
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1 leading-relaxed">{task.description}</p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                            isOverdue
                              ? 'bg-red-100 text-red-700'
                              : isToday(new Date(task.dueDate))
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isOverdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                          <Clock size={10} />
                          {task.estimatedMinutes}m
                        </span>
                      )}
                      {linkedGoalTitles.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700">
                          <Target size={10} />
                          {linkedGoalTitles[0]}
                          {linkedGoalTitles.length > 1 && ` +${linkedGoalTitles.length - 1}`}
                        </span>
                      )}
                      {linkedProjectTitles.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <FolderKanban size={10} />
                          {linkedProjectTitles[0]}
                          {linkedProjectTitles.length > 1 && ` +${linkedProjectTitles.length - 1}`}
                        </span>
                      )}
                      {task.tags?.map((tag) => (
                        <span key={tag} className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="self-stretch flex items-start pt-4 pr-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Löschen"
                  >
                    <div className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={13} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              {filteredTasks.length} Aufgabe{filteredTasks.length !== 1 ? 'n' : ''} angezeigt
            </p>
            <button
              onClick={() => openTaskModal()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus size={12} />
              Neue Aufgabe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
