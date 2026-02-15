'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { CalendarEvent, Task } from '@/types';
import { Trash2, Target, FolderKanban, AlertTriangle, Clock, Link2, CheckSquare, Timer } from 'lucide-react';
import { startOfDay, parse } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: CalendarEvent | null;
  preselectedDate?: Date;
}

type EventType = 'event' | 'timeblock';

const priorityOptions = [
  { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '○' },
  { value: 'medium', label: 'Mittel', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '◐' },
  { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: '◉' },
  { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-600 border-red-200', icon: '●' },
];

const timeBlockColors = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violett' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#22c55e', label: 'Grün' },
  { value: '#0ea5e9', label: 'Blau' },
  { value: '#6b7280', label: 'Grau' },
];

export function EventModal({ isOpen, onClose, editEvent, preselectedDate }: EventModalProps) {
  const { addEvent, updateEvent, deleteEvent, addTask, updateTask, tasks, goals, projects } = useDataStore();

  const [eventType, setEventType] = useState<EventType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [goalId, setGoalId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Time-Block specific
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [blockColor, setBlockColor] = useState('#6366f1');

  // Get uncompleted tasks for linking
  const availableTasks = tasks.filter(t => t.status !== 'completed');

  useEffect(() => {
    if (editEvent) {
      setEventType(editEvent.isTimeBlock ? 'timeblock' : 'event');
      setTitle(editEvent.title);
      setDescription(editEvent.description || '');
      setDate(new Date(editEvent.startTime).toISOString().split('T')[0]);
      setStartTime(new Date(editEvent.startTime).toTimeString().slice(0, 5));
      setEndTime(new Date(editEvent.endTime).toTimeString().slice(0, 5));
      setAllDay(editEvent.allDay);
      setLinkedTaskId(editEvent.linkedTaskId || '');
      setBlockColor(editEvent.color || '#6366f1');
      setPriority('medium');
      setGoalId('');
      setProjectId('');
    } else {
      setEventType('event');
      setTitle('');
      setDescription('');
      setDate(preselectedDate
        ? preselectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      );
      setStartTime('09:00');
      setEndTime('10:00');
      setAllDay(false);
      setPriority('medium');
      setGoalId('');
      setProjectId('');
      setLinkedTaskId('');
      setBlockColor('#6366f1');
    }
  }, [editEvent, isOpen, preselectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${date}T${allDay ? '00:00' : startTime}`);
    const endDateTime = new Date(`${date}T${allDay ? '23:59' : endTime}`);

    const isTimeBlock = eventType === 'timeblock';
    
    // Get linked task title if linking to existing task
    const linkedTask = linkedTaskId ? tasks.find(t => t.id === linkedTaskId) : null;
    const finalTitle = isTimeBlock && linkedTask ? `⏰ ${linkedTask.title}` : (isTimeBlock ? `⏰ ${title}` : title);

    const eventData = {
      title: finalTitle,
      description: description || undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      allDay,
      isTimeBlock,
      linkedTaskId: linkedTaskId || undefined,
      color: isTimeBlock ? blockColor : undefined,
      eventType: isTimeBlock ? 'focus-time' as const : 'event' as const,
    };

    try {
      if (editEvent) {
        await updateEvent(editEvent.id, eventData);
      } else {
        await addEvent(eventData);

        // Für normale Events: auch eine Task erstellen
        // Für Time-Blocks mit neuer Aufgabe: auch Task erstellen
        if (!isTimeBlock || (isTimeBlock && !linkedTaskId && title.trim())) {
          const parsedDueDate = parse(date, 'yyyy-MM-dd', new Date());
          const taskDueDate = startOfDay(parsedDueDate);

          await addTask({
            title: isTimeBlock ? title : `📅 ${title}`,
            description: description || (isTimeBlock ? `Fokuszeit: ${startTime} - ${endTime}` : `Termin: ${startTime} - ${endTime}`),
            dueDate: taskDueDate,
            priority,
            goalId: goalId || undefined,
            projectId: projectId || undefined,
            status: 'todo',
            tags: isTimeBlock ? ['fokuszeit'] : ['termin'],
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Termins:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const handleDelete = () => {
    if (editEvent) {
      deleteEvent(editEvent.id);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editEvent ? (editEvent.isTimeBlock ? 'Zeitblock bearbeiten' : 'Termin bearbeiten') : (eventType === 'timeblock' ? 'Zeitblock erstellen' : 'Neuer Termin')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Type Selector - only for new events */}
        {!editEvent && (
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setEventType('event')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                eventType === 'event'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={16} />
              Termin
            </button>
            <button
              type="button"
              onClick={() => setEventType('timeblock')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                eventType === 'timeblock'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Timer size={16} />
              Zeitblock
            </button>
          </div>
        )}

        {/* Time Block: Link existing task OR create new */}
        {eventType === 'timeblock' && !editEvent && (
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <label className="block text-xs font-medium text-indigo-700 mb-2 flex items-center gap-1.5">
              <Link2 size={12} />
              Mit bestehender Aufgabe verknüpfen
            </label>
            <select
              value={linkedTaskId}
              onChange={(e) => {
                setLinkedTaskId(e.target.value);
                if (e.target.value) {
                  const task = tasks.find(t => t.id === e.target.value);
                  if (task) {
                    setTitle(task.title);
                    setDescription(task.description || '');
                  }
                }
              }}
              title="Aufgabe verknüpfen"
              className="w-full px-3 py-2.5 text-sm bg-white border border-indigo-200 rounded-lg text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         transition-all cursor-pointer"
            >
              <option value="">Neue Aufgabe erstellen...</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {linkedTaskId && (
              <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                <CheckSquare size={12} />
                Zeitblock wird mit dieser Aufgabe verknüpft
              </p>
            )}
          </div>
        )}

        {/* Title - hide if linking to existing task */}
        {!(eventType === 'timeblock' && linkedTaskId) && (
          <Input
            label={eventType === 'timeblock' ? 'Was möchtest du fokussieren?' : 'Titel'}
            placeholder={eventType === 'timeblock' ? 'Deep Work, Projekt X, ...' : 'Meeting, Arzttermin, ...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        )}

        <Textarea
          label="Beschreibung (optional)"
          placeholder={eventType === 'timeblock' ? 'Was willst du in dieser Zeit erreichen?' : 'Notizen zum Termin...'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <Input
          label="Datum"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Time Block Color Picker */}
        {eventType === 'timeblock' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Farbe</label>
            <div className="flex gap-2">
              {timeBlockColors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBlockColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    blockColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Day Toggle - only for regular events */}
        {eventType === 'event' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`
                w-10 h-6 rounded-full transition-colors relative cursor-pointer
                ${allDay ? 'bg-indigo-600' : 'bg-gray-200'}
              `}
              onClick={() => setAllDay(!allDay)}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm
                  ${allDay ? 'left-5' : 'left-1'}
                `}
              />
            </div>
            <span className="text-sm text-gray-700 font-medium">Ganztägig</span>
          </label>
        )}

        {/* Time picker - always show for timeblocks, hide for allDay events */}
        {(eventType === 'timeblock' || !allDay) && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Startzeit"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="Endzeit"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}

        {/* Aufgaben-Eigenschaften - only for events or new timeblock tasks */}
        {(eventType === 'event' || !linkedTaskId) && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-3">
              {eventType === 'timeblock' ? '⏰ Fokuszeit-Eigenschaften' : '📋 Als Aufgabe verwalten'}
            </p>

            {/* Priorität */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Priorität
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value as Task['priority'])}
                    className={`
                      px-2 py-2 rounded-lg text-xs font-medium transition-all border
                      ${priority === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-gray-300`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Ziel & Projekt */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Target size={12} />
                  Ziel
                </label>
                <select
                  value={goalId}
                  onChange={(e) => {
                    setGoalId(e.target.value);
                    setProjectId('');
                  }}
                  title="Ziel auswählen"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all cursor-pointer"
                >
                  <option value="">Kein Ziel</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <FolderKanban size={12} />
                  Projekt
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  title="Projekt auswählen"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all cursor-pointer"
                >
                  <option value="">Kein Projekt</option>
                  {(goalId ? projects.filter(p => p.goalId === goalId) : projects).map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Delete Button - only show when editing */}
          {editEvent && !showDeleteConfirm && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Löschen
            </Button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 font-medium">Wirklich löschen?</span>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                className="text-sm"
              >
                Ja, löschen
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm"
              >
                Abbrechen
              </Button>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3 ml-auto">
              <Button type="button" variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={!title.trim() || !date}>
                {editEvent ? 'Speichern' : 'Termin erstellen'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
