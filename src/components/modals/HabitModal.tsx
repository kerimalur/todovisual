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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      if (editHabit) {
        await updateHabit(editHabit.id, habitData);
      } else {
        await addHabit(habitData);
      }
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern der Gewohnheit:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
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
        <div className="space-y-4 p-4 rounded-xl border border-white/08" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-white/50 mb-1">Icon</label>
              <button
                type="button"
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 border-white/15 hover:border-white/30 transition-colors"
                style={{ backgroundColor: color + '30' }}
                onClick={() => {
                  const current = iconOptions.indexOf(icon);
                  setIcon(iconOptions[(current + 1) % iconOptions.length]);
                }}
              >
                {icon}
              </button>
            </div>

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

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Farbe</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={`Farbe ${c}`}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50">
                <Tag size={12} />
                Kategorie
              </label>
              {!showNewCategory && (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                >
                  <Plus size={12} />
                  Neue Kategorie
                </button>
              )}
            </div>

            {showNewCategory && (
              <div className="mb-3 p-3 rounded-lg border border-violet-500/20" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={newCategoryEmoji}
                    onChange={(e) => setNewCategoryEmoji(e.target.value)}
                    title="Kategorie-Emoji"
                    className="w-12 h-9 text-lg text-center border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {defaultCategoryEmojis.map((emoji) => (
                      <option key={emoji} value={emoji} style={{ background: '#1a1d31' }}>{emoji}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Kategorie-Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm text-white border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/30 placeholder:text-white/25"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                  >
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="p-2 text-white/30 hover:text-white/60"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-1">
                  {colorOptions.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newCategoryColor === c ? 'ring-2 ring-offset-1 ring-white scale-110' : 'opacity-70'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewCategoryColor(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {habitCategories.length === 0 && !showNewCategory ? (
              <div className="p-4 text-center rounded-lg border border-white/06" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm text-white/40 mb-2">Noch keine Kategorien erstellt</p>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
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
                        ? 'border-violet-500/50 text-white'
                        : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white/80'
                    }`}
                    style={{ background: category === cat.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}
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
        <div className="space-y-4 p-4 rounded-xl border border-violet-500/15" style={{ background: 'rgba(124,58,237,0.05)' }}>
          <div className="flex items-center gap-2 text-violet-400">
            <Repeat size={18} />
            <span className="font-medium text-white/80">Häufigkeit</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {frequencyOptions.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFrequency(freq.value)}
                className={`p-3 rounded-lg text-left border-2 transition-all ${
                  frequency === freq.value
                    ? 'border-violet-500/50 text-white'
                    : 'border-white/08 text-white/60 hover:border-white/15'
                }`}
                style={{ background: frequency === freq.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-sm font-medium">{freq.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{freq.description}</div>
              </button>
            ))}
          </div>

          {frequency === 'weekly' && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-white/06" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-sm text-white/50">Ziel:</span>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetPerWeek(num)}
                    className={`w-9 h-9 rounded-lg font-medium transition-all ${
                      targetPerWeek === num
                        ? 'bg-violet-600 text-white'
                        : 'text-white/50 border border-white/10 hover:bg-white/06'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-white/50">mal pro Woche</span>
            </div>
          )}

          {frequency === 'specific-days' && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-white/06" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-sm text-white/50 mr-2">An diesen Tagen:</span>
              {dayLabels.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                    specificDays.includes(index)
                      ? 'bg-violet-600 text-white'
                      : 'text-white/50 border border-white/10 hover:bg-white/06'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tracking Section */}
        <div className="space-y-3 p-4 rounded-xl border border-emerald-500/15" style={{ background: 'rgba(16,185,129,0.04)' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasTargetValue}
              onChange={(e) => setHasTargetValue(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500/30"
            />
            <span className="text-sm font-medium text-white/70">Zielwert tracken (z.B. 10.000 Schritte, 15 Seiten)</span>
          </label>

          {hasTargetValue && (
            <div className="flex gap-3 pl-7">
              <Input type="number" placeholder="Zielwert" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-32" />
              <Input placeholder="Einheit (z.B. Schritte, Seiten, Min.)" value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="flex-1" />
            </div>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 w-full p-3 text-sm font-medium text-white/55 hover:text-white/80 rounded-lg transition-colors border border-white/08 hover:bg-white/04"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Erweiterte Einstellungen
          <span className="text-xs text-white/30 ml-auto">Energie, Erinnerungen, Verknüpfungen</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-white/08" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-white/50 mb-2">
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
                          ? 'border-violet-500/50 text-white'
                          : 'border-white/08 text-white/45 hover:border-white/15'
                      }`}
                      style={{ background: energyLevel === opt.value ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="text-xs font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-white/50 mb-2">
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
                          ? 'border-violet-500/50 text-white'
                          : 'border-white/08 text-white/45 hover:border-white/15'
                      }`}
                      style={{ background: bestTimeOfDay === opt.value ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="text-[10px] font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/08" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-white/45" />
                  <span className="text-sm font-medium text-white/70">Erinnerung</span>
                </div>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${reminderEnabled ? 'bg-violet-600' : 'bg-white/15'}`}
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${reminderEnabled ? 'left-4' : 'left-0.5'}`} />
                </div>
              </div>
              {reminderEnabled && (
                <div className="mt-3 ml-6">
                  <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-32" />
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-white/08 space-y-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                <Link2 size={16} />
                Verknüpfungen
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/45 mb-1">
                    <Target size={12} />
                    Mit Ziel verknüpfen
                  </label>
                  <Select value={goalId} onChange={(e) => setGoalId(e.target.value)} options={[{ value: '', label: 'Kein Ziel' }, ...goals.map((g) => ({ value: g.id, label: g.title }))]} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/45 mb-1">
                    <FolderKanban size={12} />
                    Mit Projekt verknüpfen
                  </label>
                  <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} options={[{ value: '', label: 'Kein Projekt' }, ...projects.map((p) => ({ value: p.id, label: p.title }))]} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivation Section Toggle */}
        <button
          type="button"
          onClick={() => setShowMotivation(!showMotivation)}
          className="flex items-center gap-2 w-full p-3 text-sm font-medium text-amber-400/80 hover:text-amber-400 rounded-lg transition-colors border border-amber-500/20 hover:bg-amber-500/08"
          style={{ background: 'rgba(245,158,11,0.05)' }}
        >
          {showMotivation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <Lightbulb size={16} className="text-amber-400" />
          Motivation & Habit-Stacking
          <span className="text-xs text-white/30 ml-auto">Warum & Wie</span>
        </button>

        {showMotivation && (
          <div className="space-y-4 p-4 rounded-xl border border-amber-500/15 animate-fade-in" style={{ background: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/15" style={{ background: 'rgba(245,158,11,0.08)' }}>
              <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/60">
                <strong className="text-white/80">Habit-Loop:</strong> Jede Gewohnheit besteht aus einem <em>Auslöser</em> (Cue),
                einer <em>Routine</em> (die Gewohnheit) und einer <em>Belohnung</em>.
                Definiere diese für besseren Erfolg!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-white/50 mb-1 flex items-center gap-1">
                  <Lightbulb size={12} />
                  Warum ist diese Gewohnheit wichtig für dich?
                </label>
                <Textarea placeholder="z.B. Ich möchte gesünder leben..." value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1 flex items-center gap-1">
                    <Target size={12} />
                    Auslöser (Cue)
                  </label>
                  <Input placeholder="z.B. Nach dem Aufstehen" value={cue} onChange={(e) => setCue(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1 flex items-center gap-1">
                    <Gift size={12} />
                    Belohnung
                  </label>
                  <Input placeholder="z.B. Einen Kaffee genießen" value={reward} onChange={(e) => setReward(e.target.value)} />
                </div>
              </div>

              <div className="border-t border-amber-500/15 pt-3">
                <label className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                  <Link2 size={12} />
                  Habit-Stacking
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Mache ich NACH: z.B. Zähneputzen" value={stackBefore} onChange={(e) => setStackBefore(e.target.value)} />
                  <Input placeholder="Mache ich VOR: z.B. Frühstück" value={stackAfter} onChange={(e) => setStackAfter(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/08">
          {editHabit ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Löschen
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" variant="primary" disabled={!title.trim()}>
              {editHabit ? 'Speichern' : 'Gewohnheit erstellen'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300]" onClick={() => setShowDeleteConfirm(false)}>
            <div className="rounded-xl p-6 max-w-sm mx-4 border border-white/10 shadow-2xl" style={{ background: '#1a1d31' }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-2">Gewohnheit löschen?</h3>
              <p className="text-white/60 text-sm mb-4">
                Alle Daten und der Streak gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Abbrechen</Button>
                <Button type="button" variant="danger" onClick={handleDelete}>Löschen</Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
