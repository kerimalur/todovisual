'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { Goal, GoalCategory, GoalPriority, Milestone } from '@/types';
import { Plus, X, Target, Trophy, Sparkles, Flame } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}

const colorOptions = [
  { value: '#3b82f6', label: 'Blau' },
  { value: '#10b981', label: 'Grün' },
  { value: '#8b5cf6', label: 'Lila' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6366f1', label: 'Indigo' },
];

const categoryOptions: { value: GoalCategory; label: string; icon: string }[] = [
  { value: 'health', label: 'Gesundheit & Fitness', icon: '💪' },
  { value: 'career', label: 'Karriere & Beruf', icon: '💼' },
  { value: 'finance', label: 'Finanzen', icon: '💰' },
  { value: 'relationships', label: 'Beziehungen', icon: '❤️' },
  { value: 'personal', label: 'Persönliche Entwicklung', icon: '🧠' },
  { value: 'education', label: 'Bildung & Lernen', icon: '📚' },
  { value: 'creative', label: 'Kreativität', icon: '🎨' },
  { value: 'other', label: 'Sonstiges', icon: '✨' },
];

const priorityOptions: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Mittel', color: 'bg-blue-100 text-blue-600' },
  { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-600' },
  { value: 'critical', label: 'Kritisch', color: 'bg-red-100 text-red-600' },
];

export function GoalModal({ isOpen, onClose, editGoal }: GoalModalProps) {
  const { addGoal, updateGoal } = useDataStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [motivation, setMotivation] = useState('');
  const [reward, setReward] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description);
      setDeadline(new Date(editGoal.deadline).toISOString().split('T')[0]);
      setColor(editGoal.color);
      setCategory(editGoal.category || 'personal');
      setPriority(editGoal.priority || 'medium');
      setMotivation(editGoal.motivation || '');
      setReward(editGoal.reward || '');
      setMilestones(editGoal.milestones || []);
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setColor('#3b82f6');
      setCategory('personal');
      setPriority('medium');
      setMotivation('');
      setReward('');
      setMilestones([]);
    }
    setActiveTab('basic');
  }, [editGoal, isOpen]);

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setMilestones([...milestones, { id: uuidv4(), title: newMilestone, completed: false }]);
      setNewMilestone('');
    }
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      title,
      description,
      deadline: new Date(deadline),
      color,
      category,
      priority,
      progress: 0,
      motivation: motivation || undefined,
      reward: reward || undefined,
      milestones: milestones.length > 0 ? milestones : undefined,
    };

    if (editGoal) {
      updateGoal(editGoal.id, goalData);
    } else {
      addGoal(goalData);
    }

    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editGoal ? 'Ziel bearbeiten' : 'Neues Ziel definieren'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'basic'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target size={14} className="inline mr-2" />
            Grundlagen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'advanced'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} className="inline mr-2" />
            Motivation & Meilensteine
          </button>
        </div>

        {activeTab === 'basic' ? (
          <div className="space-y-4 animate-fadeIn">
            <Input
              label="Ziel-Titel"
              placeholder="Was willst du erreichen?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <Textarea
              label="Beschreibung"
              placeholder="Beschreibe dein Ziel genauer. Was bedeutet Erfolg?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Category Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Kategorie
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`
                      px-3 py-2 rounded-lg text-xs font-medium transition-all text-center
                      ${category === opt.value
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <span className="block text-lg mb-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Priorität
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${priority === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Zieldatum"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />

            {/* Color Picker */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Farbe
              </label>
              <div className="flex gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={`
                      w-8 h-8 rounded-full transition-all hover:scale-110
                      ${color === opt.value ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}
                    `}
                    style={{ backgroundColor: opt.value }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {/* Motivation */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Flame size={14} className="text-orange-500" />
                Warum ist dieses Ziel wichtig?
              </label>
              <Textarea
                placeholder="Was treibt dich an? Was passiert, wenn du es NICHT erreichst? Denk an die Konsequenzen..."
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={3}
              />
            </div>

            {/* Reward */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Trophy size={14} className="text-yellow-500" />
                Belohnung bei Erreichen
              </label>
              <Input
                placeholder="Wie belohnst du dich selbst?"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Meilensteine (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Neuer Meilenstein..."
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {milestones.length > 0 && (
                <div className="space-y-2 mt-2">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg group"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-900">{milestone.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(milestone.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Motivational Quote */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <p className="text-sm text-orange-800 italic">
                "Niemand wird sich an deine Ausreden erinnern. Nur an deine Ergebnisse."
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!title.trim() || !deadline}>
            {editGoal ? 'Speichern' : 'Ziel erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
