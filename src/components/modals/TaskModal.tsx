'use client';

import { useState, useEffect } from 'react';
import { parse, format } from 'date-fns';
import { Modal, Input, Textarea, Select, Button } from '../ui/Modal';
import { useDataStore, useSettingsStore } from '@/store';
import { Task, TaskImpact } from '@/types';
import { Target, Zap, Clock, AlertTriangle, Coffee, Sparkles, Calendar, Tag, FolderKanban, Timer, ChevronDown, ChevronUp, CheckCircle2, Trash2, Plus, X, ListChecks, Repeat, Play, Square } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task | null;
}

const impactOptions: { value: TaskImpact; label: string; description: string; icon: React.ReactNode; color: string; bgGradient: string }[] = [
  { 
    value: 'goal-advancing', 
    label: 'Ziel-fördernd', 
    description: 'Bringt mich meinem Ziel direkt näher',
    icon: <Target size={18} />,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-400'
  },
  { 
    value: 'urgent-important', 
    label: 'Dringend & Wichtig', 
    description: 'Muss heute erledigt werden, hohe Priorität',
    icon: <AlertTriangle size={18} />,
    color: 'text-red-600',
    bgGradient: 'from-red-50 to-red-100 border-red-200 hover:border-red-400'
  },
  { 
    value: 'urgent-not-important', 
    label: 'Dringend, nicht wichtig', 
    description: 'Zeitkritisch, aber delegierbar',
    icon: <Clock size={18} />,
    color: 'text-amber-600',
    bgGradient: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400'
  },
  { 
    value: 'maintenance', 
    label: 'Routine/Wartung', 
    description: 'Notwendig, aber nicht transformativ',
    icon: <Zap size={18} />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400'
  },
  { 
    value: 'filler', 
    label: 'Lückenfüller', 
    description: 'Nice-to-have, wenn Zeit übrig ist',
    icon: <Coffee size={18} />,
    color: 'text-gray-500',
    bgGradient: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-400'
  },
];

const energyOptions = [
  { value: 'low', label: 'Niedrig', emoji: '😴', description: 'Kann ich auch müde erledigen', color: 'from-slate-50 to-slate-100 border-slate-200' },
  { value: 'medium', label: 'Mittel', emoji: '🙂', description: 'Braucht etwas Konzentration', color: 'from-blue-50 to-blue-100 border-blue-200' },
  { value: 'high', label: 'Hoch', emoji: '⚡', description: 'Braucht volle Aufmerksamkeit', color: 'from-amber-50 to-amber-100 border-amber-200' },
];

const priorityOptions = [
  { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '○' },
  { value: 'medium', label: 'Mittel', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '◐' },
  { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: '◉' },
  { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-600 border-red-200', icon: '●' },
];

export function TaskModal({ isOpen, onClose, editTask }: TaskModalProps) {
  const { createTask, updateTask, deleteTask, addEvent, updateEvent, events, goals, projects, tags: allTags, addTag, startTimeTracking, stopTimeTracking, activeTimeEntry, getTotalTimeForTask } = useDataStore();
  const settings = useSettingsStore((state) => state.settings);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>(settings.defaultTaskPriority);
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [tags, setTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [impact, setImpact] = useState<TaskImpact | ''>('');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high' | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Wiederkehrende Aufgaben
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringInterval, setRecurringInterval] = useState(1);

  // Tag-Erstellung
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  // Termin-Felder
  const [createAsEvent, setCreateAsEvent] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Subtasks
  const [subtasks, setSubtasks] = useState<{id: string; title: string; completed: boolean}[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Skip auto-calculation when loading existing values
  const [skipAutoCalc, setSkipAutoCalc] = useState(false);

  // Automatische Berechnung der geschätzten Zeit basierend auf Start/Endzeit
  useEffect(() => {
    // Skip if we just loaded existing values
    if (skipAutoCalc) {
      setSkipAutoCalc(false);
      return;
    }
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const diff = endMinutes - startMinutes;
      if (diff > 0) {
        setEstimatedMinutes(diff.toString());
      }
    }
  }, [startTime, endTime, skipAutoCalc]);

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      const taskDueDate = editTask.dueDate ? new Date(editTask.dueDate) : null;
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setDueDate(taskDueDate ? format(taskDueDate, 'yyyy-MM-dd') : '');
      setPriority(editTask.priority);
      const initialGoalIds = editTask.goalIds?.length
        ? editTask.goalIds
        : (editTask.goalId ? [editTask.goalId] : []);
      const initialProjectIds = editTask.projectIds?.length
        ? editTask.projectIds
        : (editTask.projectId ? [editTask.projectId] : []);
      setGoalIds(initialGoalIds);
      setProjectIds(initialProjectIds);
      setEstimatedMinutes(editTask.estimatedMinutes?.toString() || '');
      setTags(editTask.tags.join(', '));
      setSelectedTags(editTask.tags || []);
      setImpact(editTask.impact || '');
      setEnergyLevel(editTask.energyLevel || '');
      setShowAdvanced(!!editTask.impact || !!editTask.energyLevel);
      setSubtasks(editTask.subtasks || []);

      // Recurring settings
      if (editTask.recurring) {
        setIsRecurring(true);
        setRecurringFrequency(editTask.recurring.frequency);
        setRecurringDays(editTask.recurring.daysOfWeek || []);
        setRecurringInterval(editTask.recurring.interval || 1);
      } else {
        setIsRecurring(false);
        setRecurringFrequency('weekly');
        setRecurringDays([]);
        setRecurringInterval(1);
      }

      // Load time from linked event if exists
      const linkedEvent = events.find(e => e.taskId === editTask.id);
      if (linkedEvent) {
        setCreateAsEvent(true);
        const startDate = new Date(linkedEvent.startTime);
        const endDate = new Date(linkedEvent.endTime);
        setSkipAutoCalc(true); // Prevent auto-calculation from overwriting estimatedMinutes
        setStartTime(format(startDate, 'HH:mm'));
        setEndTime(format(endDate, 'HH:mm'));
      } else if (taskDueDate) {
        setCreateAsEvent(false);
        const fallbackEnd = new Date(taskDueDate.getTime() + 60 * 60 * 1000);
        setSkipAutoCalc(true);
        setStartTime(format(taskDueDate, 'HH:mm'));
        setEndTime(format(fallbackEnd, 'HH:mm'));
      } else {
        setCreateAsEvent(false);
        // Use default times if no linked event
        setStartTime('09:00');
        setEndTime('10:00');
      }
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setPriority(settings.defaultTaskPriority);
      setGoalIds([]);
      setProjectIds([]);
      setEstimatedMinutes('');
      setTags('');
      setSelectedTags([]);
      setImpact('');
      setEnergyLevel('');
      setShowAdvanced(false);
      setCreateAsEvent(false);
      setStartTime('09:00');
      setEndTime('10:00');
      setSubtasks([]);
      setNewSubtask('');
      setIsRecurring(false);
      setRecurringFrequency('weekly');
      setRecurringDays([]);
      setRecurringInterval(1);
      setShowNewTag(false);
      setNewTagName('');
    }
  }, [editTask, isOpen, events, settings.defaultTaskPriority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse date string as local date and combine with start time
    let parsedDueDate: Date | undefined;
    if (dueDate) {
      parsedDueDate = parse(dueDate, 'yyyy-MM-dd', new Date());
      const [hours, minutes] = startTime.split(':').map(Number);
      parsedDueDate.setHours(
        Number.isFinite(hours) ? hours : 9,
        Number.isFinite(minutes) ? minutes : 0,
        0,
        0
      );
    }

    const taskData = {
      title,
      description: description || undefined,
      dueDate: parsedDueDate,
      priority,
      goalId: goalIds[0] || undefined,
      projectId: projectIds[0] || undefined,
      goalIds,
      projectIds,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      tags: selectedTags.length > 0 ? selectedTags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      status: editTask?.status || 'todo' as const,
      impact: impact || undefined,
      energyLevel: energyLevel || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      recurring: isRecurring ? {
        frequency: recurringFrequency,
        daysOfWeek: recurringFrequency === 'weekly' ? recurringDays : undefined,
        interval: recurringInterval,
        isActive: true,
      } : undefined,
    };

    try {
      if (editTask) {
        await updateTask(editTask.id, taskData);
        
        // Update or create a linked event only if explicitly enabled.
        const linkedEvent = events.find(e => e.taskId === editTask.id);
        if (createAsEvent && linkedEvent && dueDate) {
          const eventDate = dueDate;
          const startDateTime = new Date(`${eventDate}T${startTime}`);
          const endDateTime = new Date(`${eventDate}T${endTime}`);
          
          await updateEvent(linkedEvent.id, {
            title,
            description: description || undefined,
            startTime: startDateTime,
            endTime: endDateTime,
          });
        } else if (createAsEvent && !linkedEvent && dueDate) {
          // Create new event if none exists
          const eventDate = dueDate;
          const startDateTime = new Date(`${eventDate}T${startTime}`);
          const endDateTime = new Date(`${eventDate}T${endTime}`);
          
          await addEvent({
            title,
            description: description || undefined,
            startTime: startDateTime,
            endTime: endDateTime,
            allDay: false,
            taskId: editTask.id,
          });
        }
      } else {
        const createdTask = await createTask(taskData);

        if (createAsEvent && dueDate) {
          const eventDate = dueDate;
          const startDateTime = new Date(`${eventDate}T${startTime}`);
          const endDateTime = new Date(`${eventDate}T${endTime}`);

          await addEvent({
            title,
            description: description || undefined,
            startTime: startDateTime,
            endTime: endDateTime,
            allDay: false,
            taskId: createdTask.id,
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern der Aufgabe:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const handleDelete = () => {
    if (editTask) {
      deleteTask(editTask.id);
      onClose();
    }
  };

  // Filter projects based on selected goals
  const filteredProjects = goalIds.length > 0
    ? projects.filter((project) => {
        const linkedGoalIds = project.goalIds?.length
          ? project.goalIds
          : (project.goalId ? [project.goalId] : []);
        return linkedGoalIds.some((linkedGoalId) => goalIds.includes(linkedGoalId));
      })
    : projects;

  const toggleGoalLink = (id: string) => {
    const next = goalIds.includes(id)
      ? goalIds.filter((goalLinkId) => goalLinkId !== id)
      : [...goalIds, id];
    setGoalIds(next);
  };

  const toggleProjectLink = (id: string) => {
    const next = projectIds.includes(id)
      ? projectIds.filter((projectLinkId) => projectLinkId !== id)
      : [...projectIds, id];
    setProjectIds(next);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header Section - Title & Description */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
          <div className="relative">
            <div className="absolute left-3 top-3 text-indigo-500">
              <Sparkles size={18} />
            </div>
            <input
              type="text"
              placeholder="Was möchtest du erledigen?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full pl-11 pr-4 py-3 text-base font-medium text-gray-900 bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         placeholder:text-gray-400 transition-all"
            />
          </div>

          <textarea
            placeholder="Beschreibung hinzufügen... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg resize-none
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                       placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Quick Settings Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date Picker */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} />
              Startdatum
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         transition-all cursor-pointer"
            />
          </div>

          {/* Priority Selector */}
          <div>
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
        </div>

        {/* Zeit-Felder - immer sichtbar */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Clock size={12} />
              Startzeit (optional)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              title="Startzeit"
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         transition-all cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Clock size={12} />
              Endzeit (optional)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              title="Endzeit"
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Als Termin markieren Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            <div>
              <span className="text-sm font-medium text-gray-900">Als Termin markieren</span>
              <p className="text-xs text-gray-500">Für Arzttermine, Meetings, etc. ohne Ziel/Projekt</p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`
                w-10 h-6 rounded-full transition-colors relative cursor-pointer
                ${createAsEvent ? 'bg-indigo-600' : 'bg-gray-200'}
              `}
              onClick={() => setCreateAsEvent(!createAsEvent)}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm
                  ${createAsEvent ? 'left-5' : 'left-1'}
                `}
              />
            </div>
          </label>
        </div>

        {/* Goal & Project Selection */}
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Target size={12} />
              Ziele zuordnen ({goalIds.length})
            </label>
            {goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goals.map((goal) => {
                  const active = goalIds.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoalLink(goal.id)}
                      className={
                        active
                          ? 'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors border-indigo-300 bg-indigo-100 text-indigo-800'
                          : 'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }
                    >
                      {goal.title}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-700">Noch keine Ziele vorhanden.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <FolderKanban size={12} />
              Projekte zuordnen ({projectIds.length})
            </label>
            {filteredProjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredProjects.map((project) => {
                  const active = projectIds.includes(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleProjectLink(project.id)}
                      className={
                        active
                          ? 'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors border-emerald-300 bg-emerald-100 text-emerald-800'
                          : 'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }
                    >
                      {project.title}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-700">
                {goalIds.length > 0
                  ? 'Keine passenden Projekte zu den gewählten Zielen.'
                  : 'Noch keine Projekte vorhanden.'}
              </p>
            )}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700
                     flex items-center justify-center gap-2 transition-colors
                     bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100"
        >
          <Target size={14} />
          {showAdvanced ? 'Weniger Optionen' : 'Erweiterte Optionen'}
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="space-y-5 p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-xl border border-indigo-100 animate-fadeIn">
            {/* Impact Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-600" />
                <label className="text-sm font-medium text-gray-700">Impact-Bewertung</label>
              </div>
              <p className="text-xs text-gray-500 -mt-1">
                Ist diese Aufgabe wirklich wichtig oder nur Beschäftigung?
              </p>
              <div className="grid gap-2">
                {impactOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setImpact(opt.value)}
                    className={`
                      w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3
                      bg-gradient-to-r ${opt.bgGradient}
                      ${impact === opt.value 
                        ? 'ring-2 ring-offset-1 ring-indigo-300 shadow-sm' 
                        : 'hover:shadow-sm'
                      }
                    `}
                  >
                    <span className={`${opt.color}`}>{opt.icon}</span>
                    <div className="flex-1">
                      <span className="font-medium text-sm text-gray-800">{opt.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                    {impact === opt.value && (
                      <CheckCircle2 size={16} className="text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                <label className="text-sm font-medium text-gray-700">Benötigte Energie</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {energyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEnergyLevel(opt.value as typeof energyLevel)}
                    className={`
                      p-3 rounded-xl text-center transition-all border
                      bg-gradient-to-br ${opt.color}
                      ${energyLevel === opt.value 
                        ? 'ring-2 ring-offset-1 ring-indigo-300 shadow-sm' 
                        : 'hover:shadow-sm'
                      }
                    `}
                  >
                    <span className="block text-xl mb-1">{opt.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Timer size={12} />
                  Geschätzte Zeit (Min)
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                             transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} />
                  Tags (manuell)
                </label>
                <input
                  type="text"
                  placeholder="arbeit, wichtig, ..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                             transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Gespeicherte Tags auswählen */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} />
                  Gespeicherte Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        if (selectedTags.includes(tag.name)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag.name));
                        } else {
                          setSelectedTags([...selectedTags, tag.name]);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        selectedTags.includes(tag.name)
                          ? 'ring-2 ring-offset-1 ring-gray-400'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: tag.color + '20', 
                        color: tag.color,
                        borderColor: tag.color 
                      }}
                    >
                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Neuen Tag erstellen */}
            <div>
              <button
                type="button"
                onClick={() => setShowNewTag(!showNewTag)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Neuen Tag erstellen
              </button>
              {showNewTag && (
                <div className="mt-2 flex gap-2 items-end">
                  <input
                    type="text"
                    placeholder="Tag-Name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                    title="Tag-Farbe"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newTagName.trim()) {
                        await addTag({ name: newTagName.trim(), color: newTagColor });
                        setSelectedTags([...selectedTags, newTagName.trim()]);
                        setNewTagName('');
                        setShowNewTag(false);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Hinzufügen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wiederkehrende Aufgabe */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Repeat size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Wiederkehrende Aufgabe</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3">
              {/* Frequency Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'daily', label: 'Täglich', icon: '📅' },
                  { value: 'weekly', label: 'Wöchentlich', icon: '📆' },
                  { value: 'monthly', label: 'Monatlich', icon: '🗓️' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurringFrequency(opt.value as 'daily' | 'weekly' | 'monthly')}
                    className={`p-2 rounded-lg text-center transition-all border ${
                      recurringFrequency === opt.value
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <div className="text-xs font-medium mt-1">{opt.label}</div>
                  </button>
                ))}
              </div>

              {/* Weekly Day Selection */}
              {recurringFrequency === 'weekly' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2">An welchen Tagen?</label>
                  <div className="flex gap-1">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (recurringDays.includes(index)) {
                            setRecurringDays(recurringDays.filter(d => d !== index));
                          } else {
                            setRecurringDays([...recurringDays, index].sort());
                          }
                        }}
                        className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                          recurringDays.includes(index)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interval */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Alle</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={recurringInterval}
                  onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center"
                />
                <span className="text-xs text-gray-600">
                  {recurringFrequency === 'daily' ? 'Tage' : recurringFrequency === 'weekly' ? 'Wochen' : 'Monate'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Subtasks / Schritte */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-900">Teilschritte</span>
              {subtasks.length > 0 && (
                <span className="text-xs text-gray-500">({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
              )}
            </div>
          </div>

          {/* Existing Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSubtasks(subtasks.map(s => 
                        s.id === subtask.id ? { ...s, completed: !s.completed } : s
                      ));
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      subtask.completed 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {subtask.completed && <CheckCircle2 size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter(s => s.id !== subtask.id))}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Subtask */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Neuen Schritt hinzufügen..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSubtask.trim()) {
                  e.preventDefault();
                  setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
                  setNewSubtask('');
                }
              }}
              className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                         placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => {
                if (newSubtask.trim()) {
                  setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
                  setNewSubtask('');
                }
              }}
              className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Left side - Delete button or time estimate */}
          <div className="flex items-center gap-3">
            {editTask && !showDeleteConfirm && (
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
            {!showDeleteConfirm && estimatedMinutes && (
              <div className="text-xs text-gray-400">
                ⏱ {estimatedMinutes} Min
              </div>
            )}
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Wirklich löschen?</span>
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

          {/* Right side - Save/Cancel buttons */}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium
                           rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {editTask ? 'Speichern' : 'Aufgabe erstellen'}
              </button>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
