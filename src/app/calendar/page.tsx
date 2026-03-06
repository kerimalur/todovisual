'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import {
  addMinutes,
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { useDataStore } from '@/store';
import { useModals } from '@/components/layout/MainLayout';
import { ConfirmModal } from '@/components/modals';

type ViewType = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskSaving, setQuickTaskSaving] = useState(false);
  const [replanBusy, setReplanBusy] = useState(false);
  const [replanMessage, setReplanMessage] = useState('');
  const [attendanceBusyId, setAttendanceBusyId] = useState<string | null>(null);

  const { tasks, events, deleteEvent, createTask, addEvent, updateEvent, rescheduleOverdueTasks } = useDataStore();
  const { openTaskModal, openTaskDetailModal, openEventModal } = useModals();

  // Month view calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Day view - hours from 6:00 to 23:00
  const dayHours = Array.from({ length: 18 }, (_, i) => i + 6);
  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived'),
    [tasks]
  );
  const activeTaskMap = useMemo(() => {
    const map = new Map<string, (typeof activeTasks)[number]>();
    activeTasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [activeTasks]);
  const timedTaskEntries = useMemo(
    () =>
      events
        .map((event) => {
          const linkedTaskId = event.taskId || event.linkedTaskId;
          if (!linkedTaskId) return null;
          const task = activeTaskMap.get(linkedTaskId);
          if (!task) return null;
          return { event, task };
        })
        .filter(
          (
            entry
          ): entry is { event: (typeof events)[number]; task: (typeof activeTasks)[number] } => !!entry
        ),
    [events, activeTaskMap]
  );
  const appointmentEvents = useMemo(
    () => events.filter((event) => !event.taskId && !event.linkedTaskId && !event.isTimeBlock),
    [events]
  );
  const visibleEvents = useMemo(
    () => [...appointmentEvents, ...timedTaskEntries.map((entry) => entry.event)],
    [appointmentEvents, timedTaskEntries]
  );
  const upcomingAppointments = useMemo(
    () =>
      appointmentEvents
        .filter((event) => new Date(event.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [appointmentEvents]
  );
  const todayStart = startOfDay(new Date());
  const inboxCount = activeTasks.filter((task) => !task.dueDate).length;
  const overdueCount = activeTasks.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < todayStart;
  }).length;

  const weeklyReview = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const plannedThisWeek = tasks.filter((task) => {
      if (task.status === 'archived') return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= thisWeekStart && dueDate <= thisWeekEnd;
    });

    const completedThisWeek = tasks.filter((task) => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= thisWeekStart && completedDate <= thisWeekEnd;
    });

    const completionRate = plannedThisWeek.length > 0
      ? Math.round((completedThisWeek.length / plannedThisWeek.length) * 100)
      : 0;

    const recommendations: string[] = [];
    if (overdueCount > 0) recommendations.push(`${overdueCount} überfällige Aufgaben heute automatisch neu planen.`);
    if (inboxCount > 0) recommendations.push(`${inboxCount} Inbox-Aufgaben in konkrete Zeitslots schieben.`);
    if (completionRate < 60 && plannedThisWeek.length >= 5) recommendations.push('Weniger parallel planen: maximal 3 Prioritäten pro Tag.');
    if (visibleEvents.filter((event) => new Date(event.startTime) >= now).length === 0) recommendations.push('Keine Zeitblöcke geplant: starte mit 2 Fokusblöcken für morgen.');
    if (recommendations.length === 0) recommendations.push('Wochenplan sieht stabil aus. Jetzt auf Konsistenz und Abschluss fokussieren.');

    return {
      planned: plannedThisWeek.length,
      completed: completedThisWeek.length,
      completionRate,
      recommendations,
    };
  }, [inboxCount, overdueCount, tasks, visibleEvents]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleSmartReplan = async () => {
    setReplanBusy(true);
    setReplanMessage('');
    try {
      const moved = await rescheduleOverdueTasks(3);
      setReplanMessage(moved > 0 ? `${moved} Aufgaben wurden automatisch neu verteilt.` : 'Keine überfälligen Aufgaben gefunden.');
    } catch {
      setReplanMessage('Automatische Neuplanung fehlgeschlagen.');
    } finally {
      setReplanBusy(false);
    }
  };

  const handleAttendanceToggle = async (eventId: string, nextAttended: boolean) => {
    setAttendanceBusyId(eventId);
    try {
      await updateEvent(eventId, {
        attendanceStatus: nextAttended ? 'attended' : 'planned',
        attendedAt: nextAttended ? new Date() : null,
      });
    } catch (error) {
      console.error('Anwesenheit konnte nicht gespeichert werden:', error);
      alert('Anwesenheitsstatus konnte nicht gespeichert werden.');
    } finally {
      setAttendanceBusyId(null);
    }
  };

  const closeSlotActions = () => {
    setSelectedSlot(null);
    setShowQuickTaskForm(false);
    setQuickTaskTitle('');
  };

  const openSlotActions = (slotDate: Date) => {
    setSelectedSlot(slotDate);
    setShowQuickTaskForm(false);
    setQuickTaskTitle('');
  };

  const openFullModalFromSlot = () => {
    if (!selectedSlot) return;

    const slotDate = new Date(selectedSlot);
    closeSlotActions();
    openEventModal(undefined, slotDate);
  };

  const createQuickTaskAtSlot = async () => {
    if (!selectedSlot || !quickTaskTitle.trim()) return;

    const slotDate = new Date(selectedSlot);
    const endDate = addMinutes(slotDate, 60);
    const taskTitle = quickTaskTitle.trim();

    setQuickTaskSaving(true);

    try {
      const createdTask = await createTask({
        title: taskTitle,
        description: `Schnellaufgabe im Kalender (${format(slotDate, 'HH:mm')} Uhr)`,
        dueDate: startOfDay(slotDate),
        priority: 'medium',
        status: 'todo',
        tags: ['kalender', 'schnell'],
      });

      await addEvent({
        title: `⏱ ${taskTitle}`,
        description: 'Schnell hinzugefügt',
        startTime: slotDate,
        endTime: endDate,
        allDay: false,
        isTimeBlock: true,
        eventType: 'focus-time',
        color: '#6366f1',
        taskId: createdTask.id,
        linkedTaskId: createdTask.id,
      });

      closeSlotActions();
    } catch (error) {
      console.error('Fehler beim schnellen Erstellen im Kalender:', error);
      alert('Konnte die Schnellaufgabe nicht erstellen.');
    } finally {
      setQuickTaskSaving(false);
    }
  };

  const getHeaderTitle = () => {
    if (viewType === 'month') return format(currentDate, 'MMMM yyyy', { locale: de });
    if (viewType === 'week') return `KW ${format(currentDate, 'w')} • ${format(weekStart, 'd. MMM', { locale: de })} - ${format(weekEnd, 'd. MMM yyyy', { locale: de })}`;
    return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  const getSlotDate = (day: Date, hour: number) => {
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate;
  };

  // Get all events for a specific day (for positioning them with proper duration)
  const getEventsForDay = (date: Date) => {
    return appointmentEvents.filter((e) => {
      const eventStart = new Date(e.startTime);
      return isSameDay(eventStart, date) && !e.allDay;
    });
  };

  // Get tasks with time (those linked to events) for a specific day
  const getTimedTasksForDay = (date: Date) => {
    return timedTaskEntries.filter(({ event }) => {
      const eventStart = new Date(event.startTime);
      return isSameDay(eventStart, date) && !event.allDay;
    });
  };

  // Calculate event position and height based on start time and duration
  const getEventStyle = (event: typeof events[0], baseHour: number = 6) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    const startHour = start.getHours();
    const startMinutes = start.getMinutes();
    const endHour = end.getHours();
    const endMinutes = end.getMinutes();

    // Calculate position from base hour (default 6:00)
    const topOffset = ((startHour - baseHour) * 60 + startMinutes);
    const durationMinutes = ((endHour - startHour) * 60 + (endMinutes - startMinutes));

    return {
      top: `${topOffset}px`,
      height: `${Math.max(durationMinutes, 15)}px`, // Minimum 15px height
    };
  };

  // Get all tasks for a specific date (for week/day view all-day section)
  // Shows tasks that are NOT linked to events (those appear in the time grid)
  const getAllDayTasksForDate = (date: Date) => {
    // Get all event taskIds for this date
    const eventTaskIds = new Set(
      timedTaskEntries
        .filter(({ event }) => isSameDay(new Date(event.startTime), date))
        .map(({ task }) => task.id)
    );

    return activeTasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      // Exclude tasks that are already linked to an event on this day
      return isSameDay(taskDate, date) && !eventTaskIds.has(t.id);
    });
  };

  // Calendar item component
  const CalendarItem = ({
    className,
    onClick,
    children,
    style,
  }: {
    className: string;
    onClick: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`${className} cursor-pointer hover:opacity-90 transition-opacity`}
        style={style}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <CalendarIcon size={22} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kalender</h1>
              <p className="text-slate-500 mt-1">{getHeaderTitle()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="cal-view-switcher flex items-center rounded-xl p-1">
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setViewType(view)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${viewType === view
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                >
                  {view === 'month' ? 'Monat' : view === 'week' ? 'Woche' : 'Tag'}
                </button>
              ))}
            </div>

            <div className="cal-divider h-6 w-px" />

            <button
              type="button"
              onClick={handleToday}
              className="cal-btn-ghost px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Heute
            </button>

            <div className="cal-nav-group flex items-center rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={handlePrev}
                className="cal-nav-btn p-2.5 transition-colors"
                title="Zurück"
              >
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="cal-nav-btn-last p-2.5 transition-colors"
                title="Weiter"
              >
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openTaskModal()}
              className="cal-gradient-btn inline-flex items-center gap-2 px-4 py-2.5 text-slate-900 text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} />
              Aufgabe
            </button>
          </div>
        </div>
      </div>

      {(overdueCount > 0 || replanMessage) && (
        <div className="cal-amber-banner mb-6 p-4 rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-400">Smart Rescheduler</p>
              <p className="text-xs text-amber-400/70 mt-1">
                {overdueCount > 0
                  ? `${overdueCount} überfällige Aufgaben können automatisch auf die nächsten Tage verteilt werden.`
                  : replanMessage}
              </p>
              {replanMessage && overdueCount > 0 && <p className="text-xs text-amber-400/70 mt-1">{replanMessage}</p>}
            </div>
            <button
              type="button"
              onClick={() => void handleSmartReplan()}
              disabled={replanBusy}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {replanBusy ? 'Plane...' : 'Jetzt neu planen'}
            </button>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div className="cal-surface rounded-xl overflow-hidden">
          {/* Weekday Headers */}
          <div className="cal-header-row grid grid-cols-7">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);

              const dayEvents = appointmentEvents.filter((e) =>
                isSameDay(new Date(e.startTime), date)
              );
              const dayTasks = activeTasks.filter(
                (t) => t.dueDate && isSameDay(new Date(t.dueDate), date)
              );

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewType('day');
                  }}
                  className={`
                    cal-cell min-h-[100px] p-2 cursor-pointer transition-all
                    ${index % 7 === 6 ? 'cal-cell-border-last' : 'cal-cell-border'}
                    ${isCurrentDay ? 'cal-cell-today' : !isCurrentMonth ? 'cal-cell-other-month' : ''}
                  `}
                >
                  {/* Day Number */}
                  <div
                    className="flex items-center justify-between mb-1"
                    onClick={() => {
                      setCurrentDate(date);
                      setViewType('day');
                    }}
                  >
                    <span className={`
                      w-7 h-7 flex items-center justify-center rounded-lg text-sm font-medium
                      ${isCurrentDay
                        ? 'bg-violet-600 text-white'
                        : isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                      }
                    `}>
                      {format(date, 'd')}
                    </span>
                  </div>

                  {/* Events & Tasks */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <CalendarItem
                        key={event.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                          event.attendanceStatus === 'attended'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-violet-500/20 text-violet-300'
                        }`}
                        onClick={() => openEventModal(event)}
                      >
                        {event.attendanceStatus === 'attended' && <span className="mr-1">✓</span>}
                        {!event.allDay && (
                          <span className="opacity-70 mr-1">
                            {format(new Date(event.startTime), 'HH:mm')}
                          </span>
                        )}
                        {event.title}
                      </CalendarItem>
                    ))}

                    {dayTasks.slice(0, 2).map((task) => (
                      <CalendarItem
                        key={task.id}
                        className={`
                          text-[10px] px-1.5 py-0.5 rounded truncate
                          ${task.priority === 'urgent'
                            ? 'bg-red-500/20 text-red-300'
                            : task.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/[0.06] text-slate-500'
                          }
                        `}
                        onClick={() => openTaskDetailModal(task)}
                      >
                        {task.title}
                      </CalendarItem>
                    ))}

                    {(dayTasks.length + dayEvents.length) > 4 && (
                      <div className="text-[10px] text-slate-400 pl-1 font-medium">
                        +{dayTasks.length + dayEvents.length - 4} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewType === 'week' && (
        <div className="cal-surface rounded-xl overflow-hidden">
          {/* Week Header */}
          <div className="cal-week-header-row grid grid-cols-8">
            <div className="p-3 text-slate-400 cal-week-col-border">
              <Clock size={14} />
            </div>
            {weekDays.map((day) => {
              const allDayTasks = getAllDayTasksForDate(day);
              const dayEvents = appointmentEvents.filter((e) => isSameDay(new Date(e.startTime), day));
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewType('day');
                  }}
                  className={`cal-week-day-cell p-3 text-center cursor-pointer transition-colors ${
                    isToday(day) ? 'cal-cell-today' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 uppercase">
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div className={`
                    text-lg font-semibold mt-0.5
                    ${isToday(day) ? 'text-violet-400' : 'text-slate-700'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  {/* Tasks and events count */}
                  {(allDayTasks.length > 0 || dayEvents.length > 0) && (
                    <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-medium">
                      {allDayTasks.length > 0 && (
                        <span className="text-blue-400">{allDayTasks.length} T</span>
                      )}
                      {dayEvents.length > 0 && (
                        <span className="text-violet-400">{dayEvents.length} E</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* All-day tasks row */}
          <div className="cal-all-day-row grid grid-cols-8 min-h-[80px] max-h-[200px]">
            <div className="cal-week-col-border p-2 text-xs text-slate-400 text-right pr-3 flex items-center justify-end">
              Aufgaben
            </div>
            {weekDays.map((day) => {
              const allDayTasks = getAllDayTasksForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className="cal-all-day-cell p-1 last:border-r-0 overflow-y-auto"
                >
                  {allDayTasks.map((task) => (
                    <CalendarItem
                      key={task.id}
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate
                        ${task.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-300'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                        }
                      `}
                      onClick={(e) => { e.stopPropagation(); openTaskDetailModal(task); }}
                    >
                      {task.title}
                    </CalendarItem>
                  ))}
                  {allDayTasks.length === 0 && (
                    <div className="text-[9px] text-slate-300 italic p-1">Keine Aufgaben</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto relative">
            {/* Hour grid */}
            {dayHours.map((hour) => (
              <div key={hour} className="cal-hour-row grid grid-cols-8 h-[60px]">
                {/* Hour Label */}
                <div className="cal-hour-label p-2 text-xs text-slate-400 text-right pr-3">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    onClick={() => openSlotActions(getSlotDate(day, hour))}
                    className="cal-hour-slot cursor-pointer"
                  />
                ))}
              </div>
            ))}

            {/* Events layer - absolutely positioned for each day */}
            <div className="cal-time-grid-height absolute top-0 left-0 right-0 grid grid-cols-8 pointer-events-none">
              {/* Empty first column for hour labels */}
              <div className="cal-week-col-border" />

              {/* Event columns for each day */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const timedTasks = getTimedTasksForDay(day);
                return (
                  <div key={day.toISOString()} className="cal-event-col relative">
                    {/* Render Events */}
                    {dayEvents.map((event) => {
                      const style = getEventStyle(event, dayHours[0]);
                      const appointmentColorClass =
                        event.attendanceStatus === 'attended'
                          ? 'bg-emerald-500/20 text-emerald-300 border-l-emerald-500 hover:opacity-80'
                          : 'bg-violet-500/20 text-violet-300 border-l-violet-500 hover:opacity-80';
                      return (
                        <div
                          key={event.id}
                          className="cal-event-wrapper absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(event);
                          }}
                        >
                          <div className={`h-full px-1.5 py-1 rounded transition-opacity cursor-pointer border-l-2 overflow-hidden ${appointmentColorClass}`}>
                            <div className="text-[10px] font-medium truncate">
                              {event.attendanceStatus === 'attended' ? '✓ ' : ''}
                              {event.title}
                            </div>
                            {parseInt(style.height) > 30 && (
                              <div className="text-[9px] opacity-70 truncate">
                                {format(new Date(event.startTime), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Tasks with time */}
                    {timedTasks.map((item) => {
                      const style = getEventStyle(item.event, dayHours[0]);
                      const task = item.task;

                      const priorityColors: Record<string, string> = {
                        low: 'bg-white/[0.05] text-slate-500 border-l-white/20 hover:opacity-80',
                        medium: 'bg-blue-500/20 text-blue-300 border-l-blue-500 hover:opacity-80',
                        high: 'bg-orange-500/20 text-orange-300 border-l-orange-500 hover:opacity-80',
                        urgent: 'bg-red-500/20 text-red-300 border-l-red-500 hover:opacity-80',
                      };
                      const colorClass = priorityColors[task.priority] || priorityColors['medium'];

                      return (
                        <div
                          key={`${task.id}-${item.event.id}`}
                          className="cal-event-wrapper absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetailModal(task);
                          }}
                        >
                          <div className={`h-full px-1.5 py-1 rounded transition-opacity cursor-pointer border-l-2 overflow-hidden ${colorClass}`}>
                            <div className="text-[10px] font-medium truncate">
                              {task.title}
                            </div>
                            {parseInt(style.height) > 30 && (
                              <div className="text-[9px] opacity-70 truncate">
                                {format(new Date(item.event.startTime), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewType === 'day' && (
        <div className="cal-surface rounded-xl overflow-hidden">
          {/* Day Header */}
          <div className="cal-day-header p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                  ${isToday(currentDate) ? 'bg-violet-600 text-white' : 'cal-day-num text-slate-700'}
                `}>
                  {format(currentDate, 'd')}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {format(currentDate, 'EEEE', { locale: de })}
                  </div>
                  <div className="text-sm text-slate-500">
                    {format(currentDate, 'd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              </div>

              {/* Quick add task button */}
              <button
                type="button"
                onClick={() => openTaskModal()}
                className="btn btn-ghost text-sm"
              >
                <Plus size={14} />
                Aufgabe hinzufügen
              </button>
            </div>
          </div>

          {/* All-day tasks section - always visible for drag & drop */}
          {(() => {
            const allDayTasks = getAllDayTasksForDate(currentDate);

            return (
              <div className={`cal-all-day-tasks-section p-3 min-h-[60px] transition-all ${
                allDayTasks.length > 0 ? 'cal-all-day-tasks-section-filled' : 'cal-all-day-tasks-section-empty'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon size={14} className={allDayTasks.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
                  <span className={`text-xs font-medium ${allDayTasks.length > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                    Aufgaben für diesen Tag {allDayTasks.length > 0 && `(${allDayTasks.length})`}
                  </span>
                </div>
                {allDayTasks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allDayTasks.map((task) => (
                      <CalendarItem
                        key={task.id}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                          ${task.priority === 'urgent'
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                            : task.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          }
                        `}
                        onClick={(e) => { e.stopPropagation(); openTaskDetailModal(task); }}
                      >
                        <div className={`
                          w-2 h-2 rounded-full
                          ${task.priority === 'urgent' ? 'bg-red-400' :
                            task.priority === 'high' ? 'bg-amber-400' : 'bg-blue-400'}
                        `} />
                        <span>{task.title}</span>
                      </CalendarItem>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Keine Aufgaben für diesen Tag.</p>
                )}
              </div>
            );
          })()}

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto relative">
            {/* Hour grid */}
            {dayHours.map((hour) => (
              <div
                key={hour}
                onClick={() => openSlotActions(getSlotDate(currentDate, hour))}
                className="cal-hour-row cal-time-slot-row flex h-[60px] cursor-pointer transition-all"
              >
                {/* Hour Label */}
                <div className="cal-hour-label w-20 p-3 text-sm text-slate-400 text-right flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Content area (empty, events are absolutely positioned) */}
                <div className="flex-1" />
              </div>
            ))}

            {/* Events layer - absolutely positioned */}
            <div className="cal-time-grid-height absolute top-0 left-20 right-0 pointer-events-none">
              {/* Render Events */}
              {getEventsForDay(currentDate).map((event) => {
                const style = getEventStyle(event, dayHours[0]);
                const appointmentColorClass =
                  event.attendanceStatus === 'attended'
                    ? 'bg-emerald-500/20 text-emerald-300 border-l-emerald-500 hover:opacity-80'
                    : 'bg-violet-500/20 text-violet-300 border-l-violet-500 hover:opacity-80';
                return (
                  <div
                    key={event.id}
                    className="cal-event-wrapper absolute left-0 right-0 px-2 pointer-events-auto"
                    style={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(event);
                    }}
                  >
                    <div className={`h-full px-3 py-1.5 rounded-lg transition-opacity cursor-pointer border-l-4 overflow-hidden ${appointmentColorClass}`}>
                      <div className="font-medium text-sm truncate">
                        {event.attendanceStatus === 'attended' ? '✓ ' : ''}
                        {event.title}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Render Tasks with time */}
              {getTimedTasksForDay(currentDate).map((item) => {
                const style = getEventStyle(item.event, dayHours[0]);
                const task = item.task;

                const priorityColors: Record<string, string> = {
                  low: 'bg-white/[0.05] text-slate-500 border-l-white/20 hover:opacity-80',
                  medium: 'bg-blue-500/20 text-blue-300 border-l-blue-500 hover:opacity-80',
                  high: 'bg-orange-500/20 text-orange-300 border-l-orange-500 hover:opacity-80',
                  urgent: 'bg-red-500/20 text-red-300 border-l-red-500 hover:opacity-80',
                };
                const colorClass = priorityColors[task.priority] || priorityColors['medium'];

                return (
                  <div
                    key={`${task.id}-${item.event.id}`}
                    className="cal-event-wrapper absolute left-0 right-0 px-2 pointer-events-auto"
                    style={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskDetailModal(task);
                    }}
                  >
                    <div className={`h-full px-3 py-1.5 rounded-lg transition-opacity cursor-pointer border-l-4 overflow-hidden ${colorClass}`}>
                      <div className="font-medium text-sm truncate">
                        {task.title}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {format(new Date(item.event.startTime), 'HH:mm')} - {format(new Date(item.event.endTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Review */}
      <div className="cal-weekly-review mt-6 p-5 rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">Weekly Review Assistant</p>
            <p className="text-sm text-slate-700 mt-1">
              Erledigt {weeklyReview.completed} von {weeklyReview.planned} geplanten Aufgaben (
              <span className="font-semibold text-slate-900">{weeklyReview.completionRate}%</span>)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSmartReplan()}
            disabled={replanBusy || overdueCount === 0}
            className="cal-weekly-review-btn px-3 py-2 text-xs font-medium rounded-lg text-violet-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Fokus-Replan
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {weeklyReview.recommendations.slice(0, 3).map((recommendation) => (
            <li key={recommendation} className="text-sm text-slate-600">• {recommendation}</li>
          ))}
        </ul>
      </div>

      {/* Upcoming Events */}
      <div className="mt-6">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Kommende Termine
        </h2>

        {upcomingAppointments.length === 0 ? (
          <div className="cal-upcoming-empty p-8 rounded-xl text-center">
            <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Keine Termine geplant</p>
          </div>
        ) : (
          <div className="cal-upcoming-list rounded-xl max-h-[380px] overflow-y-auto">
            {upcomingAppointments.map((event) => (
              <div
                key={event.id}
                className="cal-upcoming-row group flex items-center justify-between p-4 cursor-pointer transition-colors"
                onClick={() => openEventModal(event)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.attendanceStatus === 'attended' ? 'bg-emerald-500' : 'bg-violet-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(event.startTime), 'EEEE, d. MMM • HH:mm', { locale: de })}
                      {' - '}
                      {format(new Date(event.endTime), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleAttendanceToggle(event.id, event.attendanceStatus !== 'attended');
                    }}
                    disabled={attendanceBusyId === event.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      event.attendanceStatus === 'attended'
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    title="Anwesenheitsstatus setzen"
                  >
                    <CheckCircle2 size={12} />
                    {attendanceBusyId === event.id
                      ? 'Speichere...'
                      : event.attendanceStatus === 'attended'
                      ? 'Anwesend'
                      : 'Anwesenheit'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(event.id);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 rounded-lg transition-all text-red-400 hover:bg-red-500/10"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slot Actions Modal */}
      {selectedSlot && (
        <div
          className="cal-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeSlotActions}
        >
          <div
            className="cal-modal-panel w-full max-w-md rounded-2xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">Zeitslot</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {format(selectedSlot, 'EEEE, d. MMMM yyyy', { locale: de })}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Start: {format(selectedSlot, 'HH:mm')} Uhr
            </p>

            {!showQuickTaskForm ? (
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickTaskForm(true)}
                  className="cal-gradient-btn w-full px-4 py-3 rounded-xl text-slate-900 font-medium transition-all text-sm"
                >
                  Schnellaufgabe hinzufügen
                </button>
                <button
                  type="button"
                  onClick={openFullModalFromSlot}
                  className="cal-modal-btn-secondary w-full px-4 py-3 rounded-xl text-slate-700 hover:text-slate-900 transition-colors text-sm font-medium"
                >
                  Vollständig planen
                </button>
                <button
                  type="button"
                  onClick={closeSlotActions}
                  className="w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <form
                className="mt-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createQuickTaskAtSlot();
                }}
              >
                <label className="block text-sm font-medium text-slate-700">Titel der Schnellaufgabe</label>
                <input
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="z.B. Angebotsmail senden"
                  autoFocus
                  className="cal-modal-input w-full px-3 py-2.5 text-sm rounded-lg text-slate-900"
                />
                <p className="text-xs text-slate-500">
                  Erstellt direkt eine Aufgabe plus 60-Minuten-Zeitblock ab {format(selectedSlot, 'HH:mm')} Uhr.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickTaskForm(false)}
                    className="cal-modal-btn-ghost px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={!quickTaskTitle.trim() || quickTaskSaving}
                    className="cal-gradient-btn px-4 py-2 text-sm text-slate-900 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickTaskSaving ? 'Erstelle...' : 'Schnell erstellen'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          if (showDeleteConfirm) {
            deleteEvent(showDeleteConfirm);
            setShowDeleteConfirm(null);
          }
        }}
        title="Termin löschen"
        message="Möchtest du diesen Termin wirklich löschen?"
      />
    </div>
  );
}
