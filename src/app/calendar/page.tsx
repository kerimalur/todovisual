'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
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

  const { tasks, events, deleteEvent } = useDataStore();
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

  // Day view - hours from 6:00 to 22:00
  const dayHours = Array.from({ length: 17 }, (_, i) => i + 6);

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

  const getHeaderTitle = () => {
    if (viewType === 'month') return format(currentDate, 'MMMM yyyy', { locale: de });
    if (viewType === 'week') return `KW ${format(currentDate, 'w')} • ${format(weekStart, 'd. MMM', { locale: de })} - ${format(weekEnd, 'd. MMM yyyy', { locale: de })}`;
    return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  // Get all events for a specific day (for positioning them with proper duration)
  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const eventStart = new Date(e.startTime);
      return isSameDay(eventStart, date) && !e.allDay;
    });
  };

  // Get tasks with time (those linked to events) for a specific day
  const getTimedTasksForDay = (date: Date) => {
    return events.filter(e => {
      const eventStart = new Date(e.startTime);
      return isSameDay(eventStart, date) && !e.allDay && e.taskId;
    }).map(event => {
      const task = tasks.find(t => t.id === event.taskId);
      return task ? { ...event, task } : null;
    }).filter(Boolean);
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
      events
        .filter(e => e.taskId && isSameDay(new Date(e.startTime), date))
        .map(e => e.taskId)
    );

    return tasks.filter(t => {
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
    <div className="max-w-6xl mx-auto">
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
              
              const dayEvents = events.filter(e => 
                isSameDay(new Date(e.startTime), date)
              );
              
              // Get taskIds that are linked to events on this day
              const eventTaskIds = new Set(dayEvents.filter(e => e.taskId).map(e => e.taskId));
              
              // Only show tasks that are NOT linked to events (to avoid duplicates)
              const dayTasks = tasks.filter(t => 
                t.dueDate && isSameDay(new Date(t.dueDate), date) && !eventTaskIds.has(t.id)
              );

              return (
                <div
                  key={date.toISOString()}
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
                          event.isTimeBlock
                            ? 'border-l-2 bg-opacity-20'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                        onClick={() => openEventModal(event)}
                        style={event.isTimeBlock ? { 
                          backgroundColor: `${event.color}20`,
                          borderLeftColor: event.color,
                          color: event.color 
                        } : undefined}
                      >
                        {event.isTimeBlock && <span className="mr-1">⏰</span>}
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
                          ${task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 line-through opacity-60'
                            : task.priority === 'urgent'
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
              const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
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
                        ${task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 line-through'
                          : task.priority === 'urgent'
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
                    onClick={() => openTaskModal()}
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
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(event);
                          }}
                        >
                          <div className="h-full px-1.5 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer border-l-2 border-indigo-500 shadow-sm overflow-hidden">
                            <div className="text-[10px] font-medium truncate">{event.title}</div>
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
                    {timedTasks.map((item: any) => {
                      const style = getEventStyle(item, dayHours[0]);
                      const task = item.task;
                      const isCompleted = task.status === 'completed';
                      
                      const priorityColors: Record<string, string> = {
                        low: 'bg-gray-100 text-gray-700 border-l-gray-400',
                        medium: 'bg-blue-100 text-blue-700 border-l-blue-500',
                        high: 'bg-orange-100 text-orange-700 border-l-orange-500',
                        urgent: 'bg-red-100 text-red-700 border-l-red-500',
                      };
                      const completedColor = 'bg-emerald-100 text-emerald-700 border-l-emerald-500';
                      const colorClass = isCompleted ? completedColor : (priorityColors[task.priority] || priorityColors['medium']);

                      return (
                        <div
                          key={task.id}
                          className="absolute left-0 right-0 px-0.5 pointer-events-auto"
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetailModal(task);
                          }}
                        >
                          <div className={`h-full px-1.5 py-1 rounded ${colorClass} hover:opacity-80 transition-opacity cursor-pointer border-l-2 shadow-sm overflow-hidden ${isCompleted ? 'opacity-70' : ''}`}>
                            <div className={`text-[10px] font-medium truncate ${isCompleted ? 'line-through' : ''}`}>
                              {task.title}
                            </div>
                            {parseInt(style.height) > 30 && (
                              <div className="text-[9px] opacity-70 truncate">
                                {format(new Date(item.startTime), 'HH:mm')}
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
                          ${task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : task.priority === 'urgent'
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
                          ${task.status === 'completed' ? 'bg-emerald-500' :
                            task.priority === 'urgent' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}
                        `} />
                        <span className={task.status === 'completed' ? 'line-through' : ''}>{task.title}</span>
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
                onClick={() => openTaskModal()}
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
                return (
                  <div
                    key={event.id}
                    className="absolute left-0 right-0 px-2 pointer-events-auto"
                    style={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(event);
                    }}
                  >
                    <div className="h-full px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer border-l-4 border-indigo-500 shadow-sm overflow-hidden">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-70 truncate">
                        {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Render Tasks with time */}
              {getTimedTasksForDay(currentDate).map((item: any) => {
                const style = getEventStyle(item, dayHours[0]);
                const task = item.task;
                const isCompleted = task.status === 'completed';
                
                // Erledigte Aufgaben in grün, sonst nach Priorität
                const priorityColors: Record<string, string> = {
                  low: 'bg-gray-100 text-gray-700 border-l-gray-400',
                  medium: 'bg-blue-100 text-blue-700 border-l-blue-500',
                  high: 'bg-orange-100 text-orange-700 border-l-orange-500',
                  urgent: 'bg-red-100 text-red-700 border-l-red-500',
                };
                const completedColor = 'bg-emerald-100 text-emerald-700 border-l-emerald-500';
                const colorClass = isCompleted ? completedColor : (priorityColors[task.priority] || priorityColors['medium']);

                return (
                  <div
                    key={task.id}
                    className="absolute left-0 right-0 px-2 pointer-events-auto"
                    style={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskDetailModal(task);
                    }}
                  >
                    <div className={`h-full px-3 py-1.5 rounded-lg ${colorClass} hover:opacity-80 transition-opacity cursor-pointer border-l-4 shadow-sm overflow-hidden ${isCompleted ? 'opacity-70' : ''}`}>
                      <div className={`font-medium text-sm truncate ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {format(new Date(item.startTime), 'HH:mm')} - {format(new Date(item.endTime), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mt-6">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Kommende Termine
        </h2>
        
        {events.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center bg-white/50">
            <CalendarIcon size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Keine Termine geplant</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 shadow-sm">
            {events
              .filter(e => new Date(e.startTime) >= new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 5)
              .map((event) => (
                <div 
                  key={event.id}
                  className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openEventModal(event)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.startTime), 'EEEE, d. MMM • HH:mm', { locale: de })}
                        {' - '}
                        {format(new Date(event.endTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
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
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
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
