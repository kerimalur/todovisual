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
} from 'lucide-react';
import { useModals } from '@/components/layout/MainLayout';
import { Button, Card, PriorityBadge, SearchInput, TasksEmptyState, SearchEmptyState } from '@/components/ui';

type FilterType = 'all' | 'inbox' | 'today' | 'upcoming' | 'overdue';
type SortType = 'dueDate' | 'priority' | 'created' | 'title';

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

  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const inboxTasks = activeTasks.filter((task) => !task.dueDate);
  const overdueTasks = activeTasks.filter(
    (task) => task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  );

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
          return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
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
      today: activeTasks.filter((task) => task.dueDate && isToday(new Date(task.dueDate))).length,
      upcoming: activeTasks.filter(
        (task) =>
          task.dueDate &&
          isThisWeek(new Date(task.dueDate), { weekStartsOn: 1 }) &&
          !isPast(new Date(task.dueDate))
      ).length,
      overdue: overdueTasks.length,
    }),
    [activeTasks, inboxTasks.length, overdueTasks.length]
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
        dueDate: startOfDay(new Date(event.startTime)),
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
      alert('Termin konnte nicht als Aufgabe übernommen werden.');
    } finally {
      setEventAdoptBusyId(null);
    }
  };

  const formatDueDate = (dueDate: Date) => {
    const date = new Date(dueDate);
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    return format(date, 'd. MMM', { locale: de });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aufgaben</h1>
        <p className="text-gray-700 mt-1">{activeTasks.length} aktive Aufgaben</p>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Daily Planning Ritual</p>
            <p className="text-sm text-gray-900 mt-1">
              Inbox: <span className="font-semibold">{inboxTasks.length}</span> · Überfällig:{' '}
              <span className="font-semibold">{overdueTasks.length}</span>
            </p>
            {planningMessage && <p className="text-xs text-indigo-900 mt-2">{planningMessage}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void handlePlanInbox()}
              disabled={planningBusy}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inbox nach Heute
            </button>
            <button
              onClick={() => void handleReschedule()}
              disabled={planningBusy}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Überfällige smart planen
            </button>
            {mitCandidate && (
              <button
                onClick={() => openTaskDetailModal(mitCandidate)}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
              >
                MIT öffnen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
        <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide">Termine ohne Aufgabe</p>
        <p className="text-sm text-gray-900 mt-1 mb-3">
          {orphanUpcomingEvents.length > 0
            ? `${orphanUpcomingEvents.length} kommende Termine sind noch nicht als Aufgabe übernommen.`
            : 'Alle kommenden Termine sind bereits mit Aufgaben verknüpft.'}
        </p>

        {orphanUpcomingEvents.length > 0 && (
          <div className="space-y-2">
            {orphanUpcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-sky-100 bg-white px-3 py-2.5"
              >
                <button onClick={() => openEventModal(event)} className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-700 mt-0.5">
                    {format(new Date(event.startTime), 'EEE, d. MMM HH:mm', { locale: de })}
                  </p>
                </button>
                <button
                  onClick={() => void handleAdoptEventAsTask(event.id)}
                  disabled={eventAdoptBusyId === event.id}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <Link2 size={12} />
                  {eventAdoptBusyId === event.id ? 'Übernehme...' : 'Als Aufgabe'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mb-5 border-b border-gray-200">
        {[
          { key: 'all', label: 'Alle', count: taskCounts.all },
          { key: 'inbox', label: 'Inbox', count: taskCounts.inbox },
          { key: 'today', label: 'Heute', count: taskCounts.today },
          { key: 'upcoming', label: 'Diese Woche', count: taskCounts.upcoming },
          { key: 'overdue', label: 'Überfällig', count: taskCounts.overdue },
        ].map((entry) => (
          <button
            key={entry.key}
            onClick={() => setFilter(entry.key as FilterType)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === entry.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-700 hover:text-gray-900'
            }`}
          >
            {entry.label}
            {entry.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  filter === entry.key ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {entry.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Aufgaben durchsuchen..."
          className="flex-1"
        />

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
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
          onChange={(event) => setSortBy(event.target.value as SortType)}
          className="px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          title="Sortieren nach"
        >
          <option value="priority">Nach Priorität</option>
          <option value="dueDate">Nach Datum</option>
          <option value="created">Neueste zuerst</option>
          <option value="title">Alphabetisch</option>
        </select>

        <Button onClick={() => openTaskModal()} variant="primary" leftIcon={<Plus size={16} />}>
          Neue Aufgabe
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        searchQuery ? (
          <SearchEmptyState query={searchQuery} />
        ) : (
          <TasksEmptyState onAdd={() => openTaskModal()} />
        )
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-100">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
            const linkedGoalIds = task.goalIds?.length ? task.goalIds : (task.goalId ? [task.goalId] : []);
            const linkedProjectIds = task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);
            const linkedGoalTitles = goals.filter((goal) => linkedGoalIds.includes(goal.id)).map((goal) => goal.title);
            const linkedProjectTitles = projects.filter((project) => linkedProjectIds.includes(project.id)).map((project) => project.title);

            return (
              <div
                key={task.id}
                className="group flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openTaskDetailModal(task)}
              >
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    completeTask(task.id);
                  }}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0"
                  title="Als erledigt markieren"
                >
                  <CheckCircle2 size={12} className="text-indigo-700 opacity-0 group-hover:opacity-100" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-700 mb-2 line-clamp-1">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {task.dueDate && (
                      <span
                        className={`text-xs flex items-center gap-1.5 px-2 py-0.5 rounded ${
                          isOverdue ? 'text-red-700 bg-red-100' : 'text-gray-800 bg-gray-100'
                        }`}
                      >
                        {isOverdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    {linkedGoalTitles.length > 0 && (
                      <span className="text-xs text-gray-800 flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100">
                        <Target size={11} />
                        {linkedGoalTitles[0]}
                        {linkedGoalTitles.length > 1 && ` +${linkedGoalTitles.length - 1}`}
                      </span>
                    )}
                    {linkedProjectTitles.length > 0 && (
                      <span className="text-xs text-gray-800 flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100">
                        <FolderKanban size={11} />
                        {linkedProjectTitles[0]}
                        {linkedProjectTitles.length > 1 && ` +${linkedProjectTitles.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
