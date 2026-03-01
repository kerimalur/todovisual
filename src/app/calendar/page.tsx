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

  // Today's agenda data
  const todayAgendaEvents = useMemo(() => {
    const now = new Date();
    return visibleEvents
      .filter((e) => isSameDay(new Date(e.startTime), now))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [visibleEvents]);

  const todayDueTasks = useMemo(() => {
    const now = new Date();
    return activeTasks
      .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now))
      .slice(0, 5);
  }, [activeTasks]);

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
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kalender</h1>
            <p className="text-gray-500 mt-1">{getHeaderTitle()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${viewType === view 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {view === 'month' ? 'Monat' : view === 'week' ? 'Woche' : 'Tag'}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={handleToday}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Heute
            </button>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-2.5 hover:bg-gray-50 transition-colors border-r border-gray-200"
                title="Zurück"
              >
                <ChevronLeft size={16} className="text-gray-500" />
              </button>
              <button
                onClick={handleNext}
                className="p-2.5 hover:bg-gray-50 transition-colors"
                title="Weiter"
              >
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => openTaskModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={16} />
              Aufgabe
            </button>
          </div>
        </div>
      </div>

      {/* Today's Agenda Banner */}
      {(todayAgendaEvents.length > 0 || todayDueTasks.length > 0) && (
        <div className="mb-6 bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 border-b border-indigo-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <CalendarIcon size={14} className="text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-indigo-800">
              Heute · {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
            </p>
            <span className="ml-auto text-xs text-indigo-500 font-medium">
              {todayAgendaEvents.length + todayDueTasks.length} Einträge
            </span>
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-3">
            {todayAgendaEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => openEventModal(event)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors group"
              >
                <Clock size={12} className="text-indigo-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-indigo-800">
                  {format(new Date(event.startTime), 'HH:mm')}
                </span>
                <span className="text-xs text-indigo-700 max-w-[160px] truncate">{event.title}</span>
              </button>
            ))}
            {todayDueTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => openTaskDetailModal(task)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <CheckCircle2 size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 max-w-[160px] truncate">{task.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(overdueCount > 0 || replanMessage) && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">Smart Rescheduler</p>
              <p className="text-xs text-amber-700 mt-1">
                {overdueCount > 0
                  ? `${overdueCount} überfällige Aufgaben können automatisch auf die nächsten Tage verteilt werden.`
                  : replanMessage}
              </p>
              {replanMessage && overdueCount > 0 && <p className="text-xs text-amber-700 mt-1">{replanMessage}</p>}
            </div>
            <button
              onClick={() => void handleSmartReplan()}
              disabled={replanBusy}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {replanBusy ? 'Plane...' : 'Jetzt neu planen'}
            </button>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div 
                key={day} 
                className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
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
                    min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer
                    transition-all hover:bg-indigo-50/30
                    ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                    ${isCurrentDay ? 'bg-indigo-50/50' : ''}
                    ${index % 7 === 6 ? 'border-r-0' : ''}
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
                        ? 'bg-indigo-600 text-white'
                        : isCurrentMonth
                        ? 'text-gray-700'
                        : 'text-gray-300'
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
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
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
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}
                        onClick={() => openTaskDetailModal(task)}
                      >
                        {task.title}
                      </CalendarItem>
                    ))}
                    
                    {(dayTasks.length + dayEvents.length) > 4 && (
                      <div className="text-[10px] text-gray-400 pl-1 font-medium">
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
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          {/* Week Header */}
          <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50/50">
            <div className="p-3 text-xs font-medium text-gray-400 border-r border-gray-100">
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
                  className={`
                    p-3 text-center cursor-pointer hover:bg-indigo-50/50 transition-colors
                    ${isToday(day) ? 'bg-indigo-50/50' : ''}
                  `}
                >
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {format(day, 'EEE', { locale: de })}
                  </div>
                  <div className={`
                    text-lg font-semibold mt-0.5
                    ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  {/* Tasks and events count */}
                  {(allDayTasks.length > 0 || dayEvents.length > 0) && (
                    <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-medium">
                      {allDayTasks.length > 0 && (
                        <span className="text-blue-500">{allDayTasks.length} T</span>
                      )}
                      {dayEvents.length > 0 && (
                        <span className="text-indigo-500">{dayEvents.length} E</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* All-day tasks row */}
          <div className="grid grid-cols-8 border-b border-gray-100 min-h-[80px] max-h-[200px]">
            <div className="p-2 text-xs text-gray-400 text-right pr-3 border-r border-gray-100 flex items-center justify-end">
              Aufgaben
            </div>
            {weekDays.map((day) => {
              const allDayTasks = getAllDayTasksForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className="p-1 border-r border-gray-50 last:border-r-0 bg-gray-50/30 hover:bg-indigo-50/30 transition-all overflow-y-auto"
                >
                  {allDayTasks.map((task) => (
                    <CalendarItem
                      key={task.id}
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate
                        ${task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                        }
                      `}
                      onClick={(e) => { e.stopPropagation(); openTaskDetailModal(task); }}
                    >
                      {task.title}
                    </CalendarItem>
                  ))}
                  {allDayTasks.length === 0 && (
                    <div className="text-[9px] text-gray-300 italic p-1">Keine Aufgaben</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto relative">
            {/* Hour grid */}
            {dayHours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-50 h-[60px]">
                {/* Hour Label */}
                <div className="p-2 text-xs text-gray-400 text-right pr-3 border-r border-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Day Columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    onClick={() => openSlotActions(getSlotDate(day, hour))}
                    className="border-r border-gray-50 last:border-r-0 hover:bg-indigo-50/30 cursor-pointer transition-all"
                  />
                ))}
              </div>
            ))}

            {/* Events layer - absolutely positioned for each day */}
            <div className="absolute top-0 left-0 right-0 grid grid-cols-8 pointer-events-none" style={{ height: `${dayHours.length * 60}px` }}>
              {/* Empty first column for hour labels */}
              <div className="border-r border-gray-100" />

              {/* Event columns for each day */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const timedTasks = getTimedTasksForDay(day);
                return (
                  <div key={day.toISOString()} className="relative border-r border-gray-50 last:border-r-0">
                    {/* Render Events */}
                    {dayEvents.map((event) => {
                      const style = getEventStyle(event, dayHours[0]);
                      const appointmentColorClass =
                        event.attendanceStatus === 'attended'
                          ? 'bg-emerald-100 text-emerald-700 border-l-emerald-500 hover:bg-emerald-200'
                          : 'bg-violet-100 text-violet-700 border-l-violet-500 hover:bg-violet-200';
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={{ ...style, touchAction: 'pan-y' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(event);
                          }}
                        >
                          <div className={`h-full px-1.5 py-1 rounded transition-colors cursor-pointer border-l-2 shadow-sm overflow-hidden ${appointmentColorClass}`}>
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
                        low: 'bg-gray-100 text-gray-700 border-l-gray-400',
                        medium: 'bg-blue-100 text-blue-700 border-l-blue-500',
                        high: 'bg-orange-100 text-orange-700 border-l-orange-500',
                        urgent: 'bg-red-100 text-red-700 border-l-red-500',
                      };
                      const colorClass = priorityColors[task.priority] || priorityColors['medium'];

                      return (
                        <div
                          key={`${task.id}-${item.event.id}`}
                          className="absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={{ ...style, touchAction: 'pan-y' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetailModal(task);
                          }}
                        >
                          <div className={`h-full px-1.5 py-1 rounded ${colorClass} hover:opacity-80 transition-opacity cursor-pointer border-l-2 shadow-sm overflow-hidden`}>
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
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          {/* Day Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                  ${isToday(currentDate) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}
                `}>
                  {format(currentDate, 'd')}
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {format(currentDate, 'EEEE', { locale: de })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(currentDate, 'd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              </div>
              
              {/* Quick add task button */}
              <button
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
              <div 
                className={`p-3 border-b border-gray-100 min-h-[60px] transition-all
                  ${allDayTasks.length > 0 ? 'bg-blue-50/30' : 'bg-gray-50/30'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon size={14} className={allDayTasks.length > 0 ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`text-xs font-medium ${allDayTasks.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
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
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }
                        `}
                        onClick={(e) => { e.stopPropagation(); openTaskDetailModal(task); }}
                      >
                        <div className={`
                          w-2 h-2 rounded-full
                          ${task.priority === 'urgent' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}
                        `} />
                        <span>{task.title}</span>
                      </CalendarItem>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Keine Aufgaben für diesen Tag.</p>
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
                className="flex border-b border-gray-50 h-[60px] cursor-pointer hover:bg-indigo-50/30 transition-all"
              >
                {/* Hour Label */}
                <div className="w-20 p-3 text-sm text-gray-400 text-right border-r border-gray-100 flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Content area (empty, events are absolutely positioned) */}
                <div className="flex-1" />
              </div>
            ))}

            {/* Events layer - absolutely positioned */}
            <div className="absolute top-0 left-20 right-0 pointer-events-none" style={{ height: `${dayHours.length * 60}px` }}>
              {/* Render Events */}
              {getEventsForDay(currentDate).map((event) => {
                const style = getEventStyle(event, dayHours[0]);
                const appointmentColorClass =
                  event.attendanceStatus === 'attended'
                    ? 'bg-emerald-100 text-emerald-700 border-l-emerald-500 hover:bg-emerald-200'
                    : 'bg-violet-100 text-violet-700 border-l-violet-500 hover:bg-violet-200';
                return (
                  <div
                    key={event.id}
                    className="absolute left-0 right-0 px-2 pointer-events-auto"
                    style={{ ...style, touchAction: 'pan-y' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(event);
                    }}
                  >
                    <div className={`h-full px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-l-4 shadow-sm overflow-hidden ${appointmentColorClass}`}>
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
                  low: 'bg-gray-100 text-gray-700 border-l-gray-400',
                  medium: 'bg-blue-100 text-blue-700 border-l-blue-500',
                  high: 'bg-orange-100 text-orange-700 border-l-orange-500',
                  urgent: 'bg-red-100 text-red-700 border-l-red-500',
                };
                const colorClass = priorityColors[task.priority] || priorityColors['medium'];

                return (
                  <div
                    key={`${task.id}-${item.event.id}`}
                    className="absolute left-0 right-0 px-2 pointer-events-auto"
                    style={{ ...style, touchAction: 'pan-y' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskDetailModal(task);
                    }}
                  >
                    <div className={`h-full px-3 py-1.5 rounded-lg ${colorClass} hover:opacity-80 transition-opacity cursor-pointer border-l-4 shadow-sm overflow-hidden`}>
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

      <div className="mt-6 p-5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Weekly Review Assistant</p>
            <p className="text-sm text-gray-700 mt-1">
              Erledigt {weeklyReview.completed} von {weeklyReview.planned} geplanten Aufgaben (
              <span className="font-semibold">{weeklyReview.completionRate}%</span>)
            </p>
          </div>
          <button
            onClick={() => void handleSmartReplan()}
            disabled={replanBusy || overdueCount === 0}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fokus-Replan
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {weeklyReview.recommendations.slice(0, 3).map((recommendation) => (
            <li key={recommendation} className="text-sm text-gray-700">• {recommendation}</li>
          ))}
        </ul>
      </div>

      {/* Upcoming Events */}
      <div className="mt-6">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Kommende Termine
        </h2>
        
        {upcomingAppointments.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center bg-white/50">
            <CalendarIcon size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Keine Termine geplant</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {upcomingAppointments.map((event) => (
                <div 
                  key={event.id}
                  className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openEventModal(event)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.attendanceStatus === 'attended' ? 'bg-emerald-500' : 'bg-violet-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.startTime), 'EEEE, d. MMM • HH:mm', { locale: de })}
                        {' - '}
                        {format(new Date(event.endTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleAttendanceToggle(event.id, event.attendanceStatus !== 'attended');
                      }}
                      disabled={attendanceBusyId === event.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        event.attendanceStatus === 'attended'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(event.id);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                      title="Löschen"
                    >
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeSlotActions}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Zeitslot</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">
              {format(selectedSlot, 'EEEE, d. MMMM yyyy', { locale: de })}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Start: {format(selectedSlot, 'HH:mm')} Uhr
            </p>

            {!showQuickTaskForm ? (
              <div className="mt-5 grid gap-2">
                <button
                  onClick={() => setShowQuickTaskForm(true)}
                  className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors text-sm"
                >
                  Schnellaufgabe hinzufügen
                </button>
                <button
                  onClick={openFullModalFromSlot}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Vollständig planen
                </button>
                <button
                  onClick={closeSlotActions}
                  className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
                <label className="block text-sm font-medium text-gray-700">Titel der Schnellaufgabe</label>
                <input
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="z.B. Angebotsmail senden"
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500">
                  Erstellt direkt eine Aufgabe plus 60-Minuten-Zeitblock ab {format(selectedSlot, 'HH:mm')} Uhr.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickTaskForm(false)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={!quickTaskTitle.trim() || quickTaskSaving}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
