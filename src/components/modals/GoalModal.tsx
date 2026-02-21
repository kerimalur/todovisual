'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Textarea, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { Goal, GoalCategory, GoalPriority, Milestone, SmartCriteria, WeeklyPlanItem } from '@/types';
import { CheckCircle2, Plus, Sparkles, Target, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}

const colorOptions = [
  { value: '#4f46e5', label: 'Indigo' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#059669', label: 'Grün' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#dc2626', label: 'Rot' },
];

const categoryOptions: { value: GoalCategory; label: string }[] = [
  { value: 'health', label: 'Gesundheit' },
  { value: 'career', label: 'Karriere' },
  { value: 'finance', label: 'Finanzen' },
  { value: 'relationships', label: 'Beziehungen' },
  { value: 'personal', label: 'Persönlich' },
  { value: 'education', label: 'Lernen' },
  { value: 'creative', label: 'Kreativ' },
  { value: 'other', label: 'Sonstiges' },
];

const priorityOptions: { value: GoalPriority; label: string }[] = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
  { value: 'critical', label: 'Kritisch' },
];

const weekdays = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 0, label: 'Sonntag' },
];

const emptySmartCriteria: SmartCriteria = {
  specific: '',
  measurable: '',
  achievable: '',
  relevant: '',
  timeBound: '',
};

export function GoalModal({ isOpen, onClose, editGoal }: GoalModalProps) {
  const { addGoal, updateGoal } = useDataStore();

  const [activeTab, setActiveTab] = useState<'outcome' | 'smart' | 'execution'>('outcome');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [motivation, setMotivation] = useState('');
  const [reward, setReward] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [smartCriteria, setSmartCriteria] = useState<SmartCriteria>(emptySmartCriteria);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanItem[]>([]);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const [weeklyActionTitle, setWeeklyActionTitle] = useState('');
  const [weeklyActionDay, setWeeklyActionDay] = useState<number>(1);
  const [weeklyActionMinutes, setWeeklyActionMinutes] = useState<string>('');

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setDeadline(editGoal.deadline ? new Date(editGoal.deadline).toISOString().split('T')[0] : '');
      setColor(editGoal.color || '#4f46e5');
      setCategory(editGoal.category || 'personal');
      setPriority(editGoal.priority || 'medium');
      setMotivation(editGoal.motivation || '');
      setReward(editGoal.reward || '');
      setMilestones(editGoal.milestones || []);
      setSmartCriteria(editGoal.smartCriteria || emptySmartCriteria);
      setWeeklyPlan(editGoal.weeklyPlan || []);
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setColor('#4f46e5');
      setCategory('personal');
      setPriority('medium');
      setMotivation('');
      setReward('');
      setMilestones([]);
      setSmartCriteria(emptySmartCriteria);
      setWeeklyPlan([]);
    }

    setActiveTab('outcome');
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setWeeklyActionTitle('');
    setWeeklyActionDay(1);
    setWeeklyActionMinutes('');
  }, [editGoal, isOpen]);

  const smartFieldsCompleted = useMemo(() => {
    const values = [
      smartCriteria.specific,
      smartCriteria.measurable,
      smartCriteria.achievable,
      smartCriteria.relevant,
      smartCriteria.timeBound,
    ];
    return values.filter((value) => value && value.trim().length > 0).length;
  }, [smartCriteria]);

  const handleAddMilestone = () => {
    const titleValue = newMilestoneTitle.trim();
    if (!titleValue) return;

    setMilestones((current) => [
      ...current,
      {
        id: uuidv4(),
        title: titleValue,
        targetDate: newMilestoneDate ? new Date(newMilestoneDate) : undefined,
        completed: false,
      },
    ]);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const handleAddWeeklyAction = () => {
    const titleValue = weeklyActionTitle.trim();
    if (!titleValue) return;

    setWeeklyPlan((current) => [
      ...current,
      {
        id: uuidv4(),
        title: titleValue,
        weekday: weeklyActionDay,
        estimatedMinutes: weeklyActionMinutes ? parseInt(weeklyActionMinutes, 10) : undefined,
        autoCreateTask: true,
      },
    ]);

    setWeeklyActionTitle('');
    setWeeklyActionMinutes('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !deadline) return;

    const goalData = {
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline),
      color,
      category,
      priority,
      progress: editGoal?.progress ?? 0,
      motivation: motivation.trim() || undefined,
      reward: reward.trim() || undefined,
      milestones,
      smartCriteria,
      weeklyPlan,
      workflowMode: 'smart-hybrid' as const,
    };

    try {
      if (editGoal) {
        await updateGoal(editGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Ziels:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editGoal ? 'Ziel bearbeiten' : 'Neues Ziel erstellen'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('outcome')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'outcome' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Outcome
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('smart')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'smart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            SMART
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('execution')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'execution' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Ausführung
          </button>
        </div>

        {activeTab === 'outcome' && (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="Zieltitel"
              placeholder="Was willst du konkret erreichen?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              autoFocus
            />
            <Textarea
              label="Ergebnisbeschreibung"
              placeholder="Wie sieht ein erfolgreiches Ergebnis aus?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-900">Kategorie</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as GoalCategory)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">Priorität</label>
              <div className="grid grid-cols-4 gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      priority === option.value
                        ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">Farbe</label>
              <div className="flex gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={`h-7 w-7 rounded-full border-2 ${color === option.value ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
            <Textarea
              label="Warum ist das wichtig?"
              placeholder="Welche Bedeutung hat dieses Ziel für dich?"
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              rows={2}
            />
            <Input
              label="Belohnung nach Erreichen (optional)"
              placeholder="Wie belohnst du dich?"
              value={reward}
              onChange={(event) => setReward(event.target.value)}
            />
          </div>
        )}

        {activeTab === 'smart' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              SMART-Abdeckung: <span className="font-semibold">{smartFieldsCompleted}/5</span>
            </div>
            <Textarea
              label="Spezifisch"
              placeholder="Was genau wird erreicht?"
              value={smartCriteria.specific || ''}
              onChange={(event) => setSmartCriteria((current) => ({ ...current, specific: event.target.value }))}
              rows={2}
            />
            <Textarea
              label="Messbar"
              placeholder="Woran misst du Fortschritt und Erfolg?"
              value={smartCriteria.measurable || ''}
              onChange={(event) => setSmartCriteria((current) => ({ ...current, measurable: event.target.value }))}
              rows={2}
            />
            <Textarea
              label="Attraktiv/Erreichbar"
              placeholder="Warum ist es realistisch und machbar?"
              value={smartCriteria.achievable || ''}
              onChange={(event) => setSmartCriteria((current) => ({ ...current, achievable: event.target.value }))}
              rows={2}
            />
            <Textarea
              label="Relevant"
              placeholder="Wie passt es zu deinen Hauptprioritäten?"
              value={smartCriteria.relevant || ''}
              onChange={(event) => setSmartCriteria((current) => ({ ...current, relevant: event.target.value }))}
              rows={2}
            />
            <Textarea
              label="Terminiert"
              placeholder="Welche Zwischen- und Endtermine gelten?"
              value={smartCriteria.timeBound || ''}
              onChange={(event) => setSmartCriteria((current) => ({ ...current, timeBound: event.target.value }))}
              rows={2}
            />
          </div>
        )}

        {activeTab === 'execution' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target size={15} className="text-indigo-600" />
                <p className="text-sm font-semibold text-gray-900">Meilensteine</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_auto] gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(event) => setNewMilestoneTitle(event.target.value)}
                  placeholder="Meilenstein hinzufügen"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(event) => setNewMilestoneDate(event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={14} />
                </button>
              </div>
              {milestones.length > 0 && (
                <div className="mt-3 space-y-2">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                        {milestone.targetDate && (
                          <p className="text-xs text-gray-700">{new Date(milestone.targetDate).toLocaleDateString('de-DE')}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMilestones((current) => current.filter((entry) => entry.id !== milestone.id))}
                        className="rounded-md p-1 text-gray-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-indigo-600" />
                <p className="text-sm font-semibold text-gray-900">Wochenplan (Hybrid)</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_130px_auto] gap-2">
                <select
                  value={weeklyActionDay}
                  onChange={(event) => setWeeklyActionDay(parseInt(event.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={weeklyActionTitle}
                  onChange={(event) => setWeeklyActionTitle(event.target.value)}
                  placeholder="Wöchentliche Aktion"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="number"
                  value={weeklyActionMinutes}
                  onChange={(event) => setWeeklyActionMinutes(event.target.value)}
                  placeholder="Min"
                  min={0}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddWeeklyAction}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={14} />
                </button>
              </div>

              {weeklyPlan.length > 0 && (
                <div className="mt-3 space-y-2">
                  {weeklyPlan.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-700">
                          {weekdays.find((entry) => entry.value === item.weekday)?.label || 'Tag'}
                          {item.estimatedMinutes ? ` · ${item.estimatedMinutes} Min` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWeeklyPlan((current) => current.filter((entry) => entry.id !== item.id))}
                        className="rounded-md p-1 text-gray-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={15} />
              {editGoal ? 'Speichern' : 'Ziel erstellen'}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
