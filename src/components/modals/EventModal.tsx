'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { CalendarEvent, Task } from '@/types';
import { Trash2, Target, FolderKanban, AlertTriangle, Clock, Link2, CheckSquare, Timer } from 'lucide-react';
import { addHours, format, startOfDay, parse } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: CalendarEvent | null;
  preselectedDate?: Date;
}

type EventType = 'event' | 'timeblock';

const priorityOptions = [
  { value: 'low', label: 'Niedrig', activeStyle: { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.20)' }, activeClass: 'text-white/70', icon: '○' },
  { value: 'medium', label: 'Mittel', activeStyle: { background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.40)' }, activeClass: 'text-blue-300', icon: '◐' },
  { value: 'high', label: 'Hoch', activeStyle: { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.40)' }, activeClass: 'text-orange-300', icon: '◉' },
  { value: 'urgent', label: 'Dringend', activeStyle: { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.40)' }, activeClass: 'text-red-300', icon: '●' },
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
  const { addEvent, updateEvent, deleteEvent, createTask, updateTask, tasks, goals, projects } = useDataStore();

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
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  
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
      const legacyLinkedTaskId = editEvent.linkedTaskId || editEvent.taskId || '';
      setLinkedTaskId(editEvent.isTimeBlock ? legacyLinkedTaskId : '');
      setBlockColor(editEvent.color || '#6366f1');
      setPriority('medium');
      setGoalId('');
      setProjectId('');
    } else {
      const baseDate = preselectedDate ? new Date(preselectedDate) : new Date();
      const prefilledStartTime = preselectedDate ? format(baseDate, 'HH:mm') : '09:00';
      const prefilledEndTime = preselectedDate ? format(addHours(baseDate, 1), 'HH:mm') : '10:00';

      setEventType('event');
      setTitle('');
      setDescription('');
      setDate(format(baseDate, 'yyyy-MM-dd'));
      setStartTime(prefilledStartTime);
      setEndTime(prefilledEndTime);
      setAllDay(false);
      setPriority('medium');
      setGoalId('');
      setProjectId('');
      setLinkedTaskId('');
      setBlockColor('#6366f1');
    }
    setAttendanceSaving(false);
  }, [editEvent, isOpen, preselectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${date}T${allDay ? '00:00' : startTime}`);
    const endDateTime = new Date(`${date}T${allDay ? '23:59' : endTime}`);
    const parsedDueDate = parse(date, 'yyyy-MM-dd', new Date());
    const taskDueDate = startOfDay(parsedDueDate);
    const isTimeBlock = eventType === 'timeblock';

    // Get linked task title if linking to existing task
    const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : null;
    const finalTitle = isTimeBlock && linkedTask ? `[Zeit] ${linkedTask.title}` : (isTimeBlock ? `[Zeit] ${title}` : title);

    try {
      if (!isTimeBlock) {
        const eventPayload = {
          title: title.trim(),
          description: description || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay,
          isTimeBlock: false,
          taskId: undefined,
          linkedTaskId: undefined,
          color: undefined,
          eventType: 'event' as const,
          attendanceStatus: editEvent?.attendanceStatus || 'planned',
          attendedAt: editEvent?.attendedAt,
        };

        if (editEvent) {
          await updateEvent(editEvent.id, eventPayload);
        } else {
          await addEvent(eventPayload);
        }
        onClose();
        return;
      }

      if (editEvent) {
        const taskToUpdateId = linkedTaskId || editEvent.taskId || editEvent.linkedTaskId;
        await updateEvent(editEvent.id, {
          title: finalTitle,
          description: description || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay,
          isTimeBlock: true,
          taskId: taskToUpdateId || undefined,
          linkedTaskId: taskToUpdateId || undefined,
          color: blockColor,
          eventType: 'focus-time',
        });

        if (taskToUpdateId) {
          await updateTask(taskToUpdateId, {
            title,
            description: description || `Fokuszeit: ${startTime} - ${endTime}`,
            dueDate: taskDueDate,
            priority,
            goalId: goalId || undefined,
            projectId: projectId || undefined,
          });
        }
      } else {
        let effectiveTaskId = linkedTaskId || undefined;

        if (!linkedTaskId && title.trim()) {
          const createdTask = await createTask({
            title,
            description: description || `Fokuszeit: ${startTime} - ${endTime}`,
            dueDate: taskDueDate,
            priority,
            goalId: goalId || undefined,
            projectId: projectId || undefined,
            status: 'todo',
            tags: ['fokuszeit'],
          });
          effectiveTaskId = createdTask.id;
        }

        await addEvent({
          title: finalTitle,
          description: description || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay,
          isTimeBlock: true,
          taskId: effectiveTaskId,
          linkedTaskId: effectiveTaskId || linkedTaskId || undefined,
          color: blockColor,
          eventType: 'focus-time',
        });
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

  const canMarkAttendance =
    !!editEvent &&
    !editEvent.isTimeBlock &&
    !editEvent.taskId &&
    !editEvent.linkedTaskId;

  const isAttended = editEvent?.attendanceStatus === 'attended';

  const handleToggleAttendance = async () => {
    if (!editEvent || !canMarkAttendance || attendanceSaving) return;

    setAttendanceSaving(true);
    try {
      const nextAttended = !isAttended;
      await updateEvent(editEvent.id, {
        attendanceStatus: nextAttended ? 'attended' : 'planned',
        attendedAt: nextAttended ? new Date() : null,
      });
      onClose();
    } catch (error) {
      console.error('Anwesenheitsstatus konnte nicht aktualisiert werden:', error);
      alert('Anwesenheitsstatus konnte nicht gespeichert werden.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const isSubmitDisabled = !date || (!(eventType === 'timeblock' && linkedTaskId) && !title.trim());

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
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setEventType('event')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                eventType === 'event'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
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
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Timer size={16} />
              Zeitblock
            </button>
          </div>
        )}

        {/* Time Block: Link existing task OR create new */}
        {eventType === 'timeblock' && !editEvent && (
          <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.20)' }}>
            <label className="block text-xs font-medium text-violet-400 mb-2 flex items-center gap-1.5">
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
              className="w-full px-3 py-2.5 text-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <option value="" style={{ background: '#1a1d31' }}>Neue Aufgabe erstellen...</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#1a1d31' }}>
                  {t.title}
                </option>
              ))}
            </select>
            {linkedTaskId && (
              <p className="text-xs text-violet-400 mt-2 flex items-center gap-1">
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
            <label className="block text-xs font-medium text-white/50 mb-2">Farbe</label>
            <div className="flex gap-2">
              {timeBlockColors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBlockColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    blockColor === color.value ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-90 hover:scale-105'
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
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${allDay ? 'bg-violet-600' : ''}`}
              style={allDay ? {} : { background: 'rgba(255,255,255,0.12)' }}
              onClick={() => setAllDay(!allDay)}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${allDay ? 'left-5' : 'left-1'}`}
              />
            </div>
            <span className="text-sm text-white/70 font-medium">Ganztägig</span>
          </label>
        )}

        {eventType === 'event' && (
          <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid rgba(14,165,233,0.20)', background: 'rgba(14,165,233,0.06)' }}>
            <p className="text-xs text-sky-400">
              Termine bleiben eigenstaendige Kalender-Eintraege und werden nicht als Aufgabe angelegt.
            </p>
          </div>
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

        {/* Aufgaben-Eigenschaften - only for time blocks */}
        {eventType === 'timeblock' && (
          <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-medium text-white/50 mb-3">
              ⏰ Fokuszeit-Eigenschaften
            </p>

            {/* Priorität */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Priorität
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value as Task['priority'])}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                      priority === opt.value ? opt.activeClass : 'text-white/40 hover:text-white/60'
                    }`}
                    style={priority === opt.value
                      ? opt.activeStyle
                      : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }
                    }
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
                <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5">
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
                  className="w-full px-3 py-2.5 text-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <option value="" style={{ background: '#1a1d31' }}>Kein Ziel</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id} style={{ background: '#1a1d31' }}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5">
                  <FolderKanban size={12} />
                  Projekt
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  title="Projekt auswählen"
                  className="w-full px-3 py-2.5 text-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <option value="" style={{ background: '#1a1d31' }}>Kein Projekt</option>
                  {(goalId ? projects.filter(p => p.goalId === goalId) : projects).map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#1a1d31' }}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!showDeleteConfirm && (
            <div className="flex items-center gap-2">
              {canMarkAttendance && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleToggleAttendance()}
                  disabled={attendanceSaving}
                  className={`${
                    isAttended ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <CheckSquare size={16} />
                  {attendanceSaving
                    ? 'Speichere...'
                    : isAttended
                    ? 'Anwesenheit entfernen'
                    : 'Als anwesend markieren'}
                </Button>
              )}
              {editEvent && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Löschen
                </Button>
              )}
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">Wirklich löschen?</span>
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
              <Button type="submit" disabled={isSubmitDisabled}>
                {editEvent ? 'Speichern' : eventType === 'timeblock' ? 'Zeitblock erstellen' : 'Termin erstellen'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

