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
  ListTodo,
  Search,
} from 'lucide-react';
import { useModals } from '@/components/layout/MainLayout';

type FilterType = 'all' | 'inbox' | 'today' | 'upcoming' | 'overdue';
type SortType = 'dueDate' | 'priority' | 'created' | 'title';

const priorityConfig = {
  urgent: { label: 'Dringend', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  high: { label: 'Hoch', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  medium: { label: 'Mittel', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  low: { label: 'Niedrig', color: 'bg-white/6 text-white/35 border-white/10' },
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
    return [...activeTasks].sort((a, b) => {
      const diff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      return diff !== 0 ? diff : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })[0] ?? null;
  }, [activeTasks]);

  const filteredTasks = useMemo(() => {
    let result = activeTasks;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
      );
    }
    switch (filter) {
      case 'inbox': result = result.filter((t) => !t.dueDate); break;
      case 'today': result = result.filter((t) => t.dueDate && isToday(new Date(t.dueDate))); break;
      case 'upcoming': result = result.filter((t) => t.dueDate && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }) && !isPast(new Date(t.dueDate))); break;
      case 'overdue': result = result.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))); break;
    }
    if (priorityFilter !== 'all') result = result.filter((t) => t.priority === priorityFilter);
    return [...result].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.title.localeCompare(b.title, 'de');
    });
  }, [activeTasks, filter, priorityFilter, sortBy, searchQuery]);

  const taskCounts = useMemo(() => ({
    all: activeTasks.length,
    inbox: inboxTasks.length,
    today: activeTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))).length,
    upcoming: activeTasks.filter((t) => t.dueDate && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }) && !isPast(new Date(t.dueDate))).length,
    overdue: overdueTasks.length,
  }), [activeTasks, inboxTasks.length, overdueTasks.length]);

  const handlePlanInbox = async () => {
    setPlanningBusy(true); setPlanningMessage('');
    try {
      const planned = await planInboxTasksForToday(3);
      setPlanningMessage(planned > 0 ? `${planned} Inbox-Aufgaben auf heute geplant.` : 'Keine Inbox-Aufgaben zum Planen.');
    } catch { setPlanningMessage('Inbox-Planung fehlgeschlagen.'); }
    finally { setPlanningBusy(false); }
  };

  const handleReschedule = async () => {
    setPlanningBusy(true); setPlanningMessage('');
    try {
      const moved = await rescheduleOverdueTasks(3);
      setPlanningMessage(moved > 0 ? `${moved} überfällige Aufgaben neu geplant.` : 'Keine überfälligen Aufgaben gefunden.');
    } catch { setPlanningMessage('Neuplanung fehlgeschlagen.'); }
    finally { setPlanningBusy(false); }
  };

  const handleAdoptEventAsTask = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    setEventAdoptBusyId(eventId);
    try {
      const createdTask = await createTask({
        title: `Termin: ${event.title}`,
        description: event.description || `Aus Kalender (${format(new Date(event.startTime), 'd. MMM HH:mm', { locale: de })})`,
        dueDate: new Date(event.startTime),
        priority: 'medium', status: 'todo', tags: ['kalender', 'termin'],
      });
      await updateEvent(event.id, { taskId: createdTask.id, linkedTaskId: createdTask.id });
    } catch (error) { console.error(error); }
    finally { setEventAdoptBusyId(null); }
  };

  const formatDueDate = (dueDate: Date) => {
    const date = new Date(dueDate);
    const dayLabel = isToday(date) ? 'Heute' : isTomorrow(date) ? 'Morgen' : format(date, 'd. MMM', { locale: de });
    return `${dayLabel}, ${format(date, 'HH:mm')}`;
  };

  const filterTabs = [
    { key: 'all', label: 'Alle', count: taskCounts.all },
    { key: 'inbox', label: 'Inbox', count: taskCounts.inbox },
    { key: 'today', label: 'Heute', count: taskCounts.today },
    { key: 'upcoming', label: 'Woche', count: taskCounts.upcoming },
    { key: 'overdue', label: 'Überfällig', count: taskCounts.overdue },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <ListTodo size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Aufgaben</h1>
            <p className="text-white/40 text-sm mt-0.5">{activeTasks.length} aktive Aufgaben</p>
          </div>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-violet-900/20"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          <Plus size={16} />
          Neue Aufgabe
        </button>
      </div>

      {/* Daily Planning Card */}
      <div className="rounded-2xl border border-violet-500/20 p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(109,40,217,0.05))' }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Daily Planning</p>
            <p className="text-white/80 text-sm">
              Inbox: <span className="font-bold text-white">{inboxTasks.length}</span>
              <span className="text-white/20 mx-2">·</span>
              Überfällig: <span className="font-bold text-red-400">{overdueTasks.length}</span>
            </p>
            {planningMessage && <p className="text-xs text-violet-300 mt-2">{planningMessage}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void handlePlanInbox()} disabled={planningBusy}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-all">
              Inbox nach Heute
            </button>
            <button onClick={() => void handleReschedule()} disabled={planningBusy}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-white/10 text-white/60 hover:bg-white/05 hover:text-white disabled:opacity-40 transition-all">
              Überfällige planen
            </button>
            {mitCandidate && (
              <button onClick={() => openTaskDetailModal(mitCandidate)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-white/10 text-white/60 hover:bg-white/05 hover:text-white transition-all">
                MIT öffnen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orphan Events */}
      {orphanUpcomingEvents.length > 0 && (
        <div className="rounded-2xl border border-blue-500/20 p-5" style={{ background: 'rgba(59,130,246,0.05)' }}>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Termine ohne Aufgabe</p>
          <p className="text-white/40 text-sm mb-3">{orphanUpcomingEvents.length} Termine sind noch nicht verknüpft.</p>
          <div className="space-y-2">
            {orphanUpcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/06 px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <button onClick={() => openEventModal(event)} className="min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{event.title}</p>
                  <p className="text-xs text-white/35 mt-0.5">{format(new Date(event.startTime), 'EEE, d. MMM HH:mm', { locale: de })}</p>
                </button>
                <button onClick={() => void handleAdoptEventAsTask(event.id)} disabled={eventAdoptBusyId === event.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 transition-all flex-shrink-0">
                  <Link2 size={11} />
                  Als Aufgabe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs + Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filter === tab.key ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/05'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-white/08 text-white/40'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Aufgaben durchsuchen..."
              className="w-full pl-9 pr-4 py-2.5 text-sm text-white rounded-xl border border-white/08 focus:outline-none focus:border-violet-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 text-sm text-white/60 rounded-xl border border-white/08 focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)' }} title="Priorität">
            <option value="all">Alle Prioritäten</option>
            <option value="urgent">Dringend</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-2.5 text-sm text-white/60 rounded-xl border border-white/08 focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)' }} title="Sortieren">
            <option value="priority">Priorität</option>
            <option value="dueDate">Datum</option>
            <option value="created">Neueste</option>
            <option value="title">A–Z</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/04 flex items-center justify-center mx-auto mb-4">
            <ListTodo size={24} className="text-white/20" />
          </div>
          <p className="text-white/35 text-sm">{searchQuery ? `Keine Aufgaben für "${searchQuery}"` : 'Keine Aufgaben in dieser Ansicht'}</p>
          <button onClick={() => openTaskModal()}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-all">
            Aufgabe erstellen
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/08 overflow-hidden divide-y divide-white/04"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
            const linkedGoalIds = task.goalIds?.length ? task.goalIds : (task.goalId ? [task.goalId] : []);
            const linkedProjectIds = task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);
            const linkedGoalTitles = goals.filter((g) => linkedGoalIds.includes(g.id)).map((g) => g.title);
            const linkedProjectTitles = projects.filter((p) => linkedProjectIds.includes(p.id)).map((p) => p.title);
            const pConfig = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.low;

            return (
              <div
                key={task.id}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-white/02 transition-colors cursor-pointer"
                onClick={() => openTaskDetailModal(task)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-white/15 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center transition-all flex-shrink-0"
                  title="Erledigt"
                >
                  <CheckCircle2 size={11} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-medium text-white">{task.title}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pConfig.color}`}>
                      {pConfig.label}
                    </span>
                    {isOverdue && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                        <AlertTriangle size={10} /> Überfällig
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-white/30 mb-2 line-clamp-1">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                        isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/05 text-white/35 border-white/08'
                      }`}>
                        <Calendar size={10} />
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    {linkedGoalTitles.length > 0 && (
                      <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/15">
                        <Target size={10} />
                        {linkedGoalTitles[0]}{linkedGoalTitles.length > 1 && ` +${linkedGoalTitles.length - 1}`}
                      </span>
                    )}
                    {linkedProjectTitles.length > 0 && (
                      <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/15">
                        <FolderKanban size={10} />
                        {linkedProjectTitles[0]}{linkedProjectTitles.length > 1 && ` +${linkedProjectTitles.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="p-1.5 text-white/15 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Löschen"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
