'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Select, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { Habit, HabitFrequency, HabitCategoryItem } from '@/types';
import { 
  Repeat, 
  Target, 
  FolderKanban, 
  Zap, 
  Clock, 
  Bell, 
  Lightbulb,
  Gift,
  Link2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info,
  Plus,
  X,
  Tag
} from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  editHabit?: Habit | null;
}

const frequencyOptions: { value: HabitFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Täglich', description: 'Jeden Tag erledigen' },
  { value: 'weekly', label: 'X mal pro Woche', description: 'Flexibel über die Woche' },
  { value: 'specific-days', label: 'Bestimmte Tage', description: 'An festgelegten Wochentagen' },
];

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const energyOptions = [
  { value: 'low', label: 'Niedrig', description: 'Braucht wenig Energie' },
  { value: 'medium', label: 'Mittel', description: 'Normale Konzentration' },
  { value: 'high', label: 'Hoch', description: 'Braucht volle Energie' },
];

const timeOfDayOptions = [
  { value: 'morning', label: 'Morgens' },
  { value: 'afternoon', label: 'Nachmittags' },
  { value: 'evening', label: 'Abends' },
  { value: 'anytime', label: 'Jederzeit' },
];

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
];

const iconOptions = [
  '💪', '🏃', '📚', '💧', '🧘', '💊', '🥗', '🏋️', '🎯', '⏰',
  '📝', '🧠', '💤', '🚶', '🎵', '🌱', '☕', '🍎', '🏊', '🚴',
  '🧹', '💰', '📱', '🎨', '✍️', '🤝', '📞', '🌿', '🔥', '⭐',
];

const defaultCategoryEmojis = ['🏥', '💪', '📚', '⚡', '🧘', '👥', '💰', '✨', '🎯', '🌱', '🔥', '💎'];

export function HabitModal({ isOpen, onClose, editHabit }: HabitModalProps) {
  const { addHabit, updateHabit, deleteHabit, goals, projects, habitCategories, addHabitCategory, deleteHabitCategory } = useDataStore();

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState('#3b82f6');

  // New Category Creation
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('✨');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  // Frequency
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetPerWeek, setTargetPerWeek] = useState(4);
  const [specificDays, setSpecificDays] = useState<number[]>([0, 2, 4]); // Mo, Mi, Fr

  // Tracking
  const [hasTargetValue, setHasTargetValue] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');

  // Reminders
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');

  // Energy & Time
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [bestTimeOfDay, setBestTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');

  // Links
  const [goalId, setGoalId] = useState('');
  const [projectId, setProjectId] = useState('');

  // Motivation
  const [motivation, setMotivation] = useState('');
  const [cue, setCue] = useState('');
  const [reward, setReward] = useState('');
  const [stackBefore, setStackBefore] = useState('');
  const [stackAfter, setStackAfter] = useState('');

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editHabit) {
      setTitle(editHabit.title);
      setDescription(editHabit.description || '');
      setCategory(editHabit.category);
      setIcon(editHabit.icon || '💪');
      setColor(editHabit.color || '#3b82f6');
      setFrequency(editHabit.frequency);
      setTargetPerWeek(editHabit.targetPerWeek || 4);
      setSpecificDays(editHabit.specificDays || [0, 2, 4]);
      setHasTargetValue(!!editHabit.targetValue);
      setTargetValue(editHabit.targetValue?.toString() || '');
      setTargetUnit(editHabit.targetUnit || '');
      setReminderEnabled(editHabit.reminderEnabled);
      setReminderTime(editHabit.reminderTime || '08:00');
      setEnergyLevel(editHabit.energyLevel || 'medium');
      setBestTimeOfDay(editHabit.bestTimeOfDay || 'anytime');
      setGoalId(editHabit.goalId || '');
      setProjectId(editHabit.projectId || '');
      setMotivation(editHabit.motivation || '');
      setCue(editHabit.cue || '');
      setReward(editHabit.reward || '');
      setStackBefore(editHabit.stackBefore || '');
      setStackAfter(editHabit.stackAfter || '');
      setShowAdvanced(!!editHabit.energyLevel || !!editHabit.goalId);
      setShowMotivation(!!editHabit.motivation || !!editHabit.cue);
    } else {
      // Reset
      setTitle('');
      setDescription('');
      setCategory('');
      setIcon('💪');
      setColor('#3b82f6');
      setFrequency('daily');
      setTargetPerWeek(4);
      setSpecificDays([0, 2, 4]);
      setHasTargetValue(false);
      setTargetValue('');
      setTargetUnit('');
      setReminderEnabled(false);
      setReminderTime('08:00');
      setEnergyLevel('medium');
      setBestTimeOfDay('anytime');
      setGoalId('');
      setProjectId('');
      setMotivation('');
      setCue('');
      setReward('');
      setStackBefore('');
      setStackAfter('');
      setShowAdvanced(false);
      setShowMotivation(false);
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryEmoji('✨');
      setNewCategoryColor('#6366f1');
    }
  }, [editHabit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const habitData = {
      title,
      description: description || undefined,
      category,
      icon,
      color,
      frequency,
      targetPerWeek: frequency === 'weekly' ? targetPerWeek : undefined,
      specificDays: frequency === 'specific-days' ? specificDays : undefined,
      targetValue: hasTargetValue && targetValue ? parseInt(targetValue) : undefined,
      targetUnit: hasTargetValue ? targetUnit : undefined,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      energyLevel,
      bestTimeOfDay,
      goalId: goalId || undefined,
      projectId: projectId || undefined,
      motivation: motivation || undefined,
      cue: cue || undefined,
      reward: reward || undefined,
      stackBefore: stackBefore || undefined,
      stackAfter: stackAfter || undefined,
      isActive: true,
      isPaused: false,
    };

    if (editHabit) {
      updateHabit(editHabit.id, habitData);
    } else {
      addHabit(habitData);
    }

    onClose();
  };

  const handleDelete = () => {
    if (editHabit) {
      deleteHabit(editHabit.id);
      onClose();
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (specificDays.includes(dayIndex)) {
      setSpecificDays(specificDays.filter(d => d !== dayIndex));
    } else {
      setSpecificDays([...specificDays, dayIndex].sort());
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCat = addHabitCategory({
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        color: newCategoryColor,
      });
      setCategory(newCat.id);
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryEmoji('✨');
      setNewCategoryColor('#6366f1');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return habitCategories.find(c => c.id === categoryId);
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editHabit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info Section */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
          {/* Icon & Color Picker */}
          <div className="flex items-start gap-4">
            {/* Icon Selection */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
              <div className="relative">
                <button
                  type="button"
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  style={{ backgroundColor: color + '20' }}
                  onClick={() => {
                    const current = iconOptions.indexOf(icon);
                    setIcon(iconOptions[(current + 1) % iconOptions.length]);
                  }}
                >
                  {icon}
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="flex-1 space-y-3">
              <Input
                placeholder="z.B. Morgens Gym, 15 Seiten lesen, Supplements"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-lg font-medium"
              />
              <Textarea
                placeholder="Beschreibung (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Farbe</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Tag size={12} />
                Kategorie
              </label>
              {!showNewCategory && (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={12} />
                  Neue Kategorie
                </button>
              )}
            </div>

            {/* New Category Form */}
            {showNewCategory && (
              <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={newCategoryEmoji}
                    onChange={(e) => setNewCategoryEmoji(e.target.value)}
                    className="w-12 h-9 text-lg text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {defaultCategoryEmojis.map((emoji) => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Kategorie-Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-1">
                  {colorOptions.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newCategoryColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewCategoryColor(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category List */}
            {habitCategories.length === 0 && !showNewCategory ? (
              <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Noch keine Kategorien erstellt</p>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={14} />
                  Erste Kategorie erstellen
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {habitCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`group relative px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      category === cat.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (category === cat.id) setCategory('');
                        deleteHabitCategory(cat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-all"
                    >
                      <X size={10} />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Frequency Section */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-700">
            <Repeat size={18} />
            <span className="font-medium">Häufigkeit</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {frequencyOptions.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFrequency(freq.value)}
                className={`p-3 rounded-lg text-left border-2 transition-all ${
                  frequency === freq.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="text-sm font-medium">{freq.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{freq.description}</div>
              </button>
            ))}
          </div>

          {/* Weekly Target */}
          {frequency === 'weekly' && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <span className="text-sm text-gray-600">Ziel:</span>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetPerWeek(num)}
                    className={`w-9 h-9 rounded-lg font-medium transition-all ${
                      targetPerWeek === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">mal pro Woche</span>
            </div>
          )}

          {/* Specific Days */}
          {frequency === 'specific-days' && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
              <span className="text-sm text-gray-600 mr-2">An diesen Tagen:</span>
              {dayLabels.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                    specificDays.includes(index)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tracking Section (optional) */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-50/50 to-white rounded-xl border border-emerald-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasTargetValue}
              onChange={(e) => setHasTargetValue(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">Zielwert tracken (z.B. 10.000 Schritte, 15 Seiten)</span>
          </label>

          {hasTargetValue && (
            <div className="flex gap-3 pl-7">
              <Input
                type="number"
                placeholder="Zielwert"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-32"
              />
              <Input
                placeholder="Einheit (z.B. Schritte, Seiten, Min.)"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 w-full p-3 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Erweiterte Einstellungen
          <span className="text-xs text-gray-400 ml-auto">Energie, Erinnerungen, Verknüpfungen</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            {/* Energy & Time */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <Zap size={14} />
                  Benötigte Energie
                </label>
                <div className="flex gap-2">
                  {energyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEnergyLevel(opt.value as 'low' | 'medium' | 'high')}
                      className={`flex-1 p-2 rounded-lg text-center border-2 transition-all ${
                        energyLevel === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="text-xs font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <Clock size={14} />
                  Beste Tageszeit
                </label>
                <div className="flex gap-2">
                  {timeOfDayOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBestTimeOfDay(opt.value as any)}
                      className={`flex-1 p-2 rounded-lg text-center border-2 transition-all ${
                        bestTimeOfDay === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="text-[10px] font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminder */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Erinnerung</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                />
              </label>
              {reminderEnabled && (
                <div className="mt-3 ml-6">
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>

            {/* Links to Goals/Projects */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Link2 size={16} />
                Verknüpfungen
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Target size={12} />
                    Mit Ziel verknüpfen
                  </label>
                  <Select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    options={[
                      { value: '', label: 'Kein Ziel' },
                      ...goals.map((g) => ({ value: g.id, label: g.title }))
                    ]}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <FolderKanban size={12} />
                    Mit Projekt verknüpfen
                  </label>
                  <Select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    options={[
                      { value: '', label: 'Kein Projekt' },
                      ...projects.map((p) => ({ value: p.id, label: p.title }))
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivation Section Toggle */}
        <button
          type="button"
          onClick={() => setShowMotivation(!showMotivation)}
          className="flex items-center gap-2 w-full p-3 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-colors"
        >
          {showMotivation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <Lightbulb size={16} className="text-amber-500" />
          Motivation & Habit-Stacking
          <span className="text-xs text-gray-400 ml-auto">Warum & Wie</span>
        </button>

        {showMotivation && (
          <div className="space-y-4 p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-xl border border-amber-100">
            <div className="flex items-start gap-2 p-3 bg-white/70 rounded-lg">
              <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                <strong>Habit-Loop:</strong> Jede Gewohnheit besteht aus einem <em>Auslöser</em> (Cue), 
                einer <em>Routine</em> (die Gewohnheit) und einer <em>Belohnung</em>. 
                Definiere diese für besseren Erfolg!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
                  <Lightbulb size={12} />
                  Warum ist diese Gewohnheit wichtig für dich?
                </label>
                <Textarea
                  placeholder="z.B. Ich möchte gesünder leben und mehr Energie haben..."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
                    <Target size={12} />
                    Auslöser (Cue)
                  </label>
                  <Input
                    placeholder="z.B. Nach dem Aufstehen"
                    value={cue}
                    onChange={(e) => setCue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
                    <Gift size={12} />
                    Belohnung
                  </label>
                  <Input
                    placeholder="z.B. Einen Kaffee genießen"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-amber-200 pt-3">
                <label className="text-xs font-medium text-amber-700 mb-2 block flex items-center gap-1">
                  <Link2 size={12} />
                  Habit-Stacking (Verknüpfe mit bestehenden Gewohnheiten)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Mache ich NACH: z.B. Zähneputzen"
                    value={stackBefore}
                    onChange={(e) => setStackBefore(e.target.value)}
                  />
                  <Input
                    placeholder="Mache ich VOR: z.B. Frühstück"
                    value={stackAfter}
                    onChange={(e) => setStackAfter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {editHabit ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Löschen
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={!title.trim()}>
              {editHabit ? 'Speichern' : 'Gewohnheit erstellen'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gewohnheit löschen?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Alle Daten und der Streak gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Abbrechen
                </Button>
                <Button type="button" variant="danger" onClick={handleDelete}>
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
