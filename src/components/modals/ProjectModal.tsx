'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Select, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { Project, ProjectCategory, ProjectPriority } from '@/types';
import { 
  TrendingUp, 
  DollarSign, 
  Dumbbell, 
  Heart, 
  Code2, 
  Sparkles,
  FolderKanban,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProject?: Project | null;
  preselectedGoalId?: string;
  preselectedCategory?: string;
}

const categoryOptions: { value: ProjectCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'trading', label: 'Trading & Investment', icon: <TrendingUp size={16} />, color: 'text-emerald-600' },
  { value: 'finance', label: 'Finanzen & Budget', icon: <DollarSign size={16} />, color: 'text-green-600' },
  { value: 'fitness', label: 'Fitness & Gym', icon: <Dumbbell size={16} />, color: 'text-orange-600' },
  { value: 'health', label: 'Gesundheit & Wellness', icon: <Heart size={16} />, color: 'text-red-500' },
  { value: 'wealth', label: 'Vermögensaufbau', icon: <BarChart3 size={16} />, color: 'text-amber-600' },
  { value: 'programming', label: 'Programmieren & Tech', icon: <Code2 size={16} />, color: 'text-indigo-600' },
  { value: 'improvement', label: 'Stetige Verbesserung', icon: <Sparkles size={16} />, color: 'text-purple-600' },
  { value: 'other', label: 'Sonstiges', icon: <FolderKanban size={16} />, color: 'text-gray-600' },
];

const priorityOptions: { value: ProjectPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Mittel', color: 'bg-blue-100 text-blue-600' },
  { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-600' },
  { value: 'critical', label: 'Kritisch', color: 'bg-red-100 text-red-600' },
];

const statusOptions = [
  { value: 'planning', label: 'Planung' },
  { value: 'active', label: 'Aktiv' },
  { value: 'on-hold', label: 'Pausiert' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
];

export function ProjectModal({ isOpen, onClose, editProject, preselectedGoalId, preselectedCategory }: ProjectModalProps) {
  const { addProject, updateProject, goals } = useDataStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('other');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [status, setStatus] = useState<Project['status']>('active');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Category-specific fields
  const [tradingStrategy, setTradingStrategy] = useState('');
  const [tradingRiskLevel, setTradingRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [tradingTargetReturn, setTradingTargetReturn] = useState('');
  
  const [fitnessExerciseType, setFitnessExerciseType] = useState('');
  const [fitnessTargetWeight, setFitnessTargetWeight] = useState('');
  
  const [financeBudget, setFinanceBudget] = useState('');
  const [financeSavingsTarget, setFinanceSavingsTarget] = useState('');
  
  const [programmingTechStack, setProgrammingTechStack] = useState('');
  const [programmingRepository, setProgrammingRepository] = useState('');

  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title);
      setDescription(editProject.description);
      setGoalId(editProject.goalId || '');
      setDeadline(editProject.deadline ? new Date(editProject.deadline).toISOString().split('T')[0] : '');
      setCategory(editProject.category || 'other');
      setPriority(editProject.priority || 'medium');
      setStatus(editProject.status);
      setNotes(editProject.notes || '');
      
      // Category-specific
      if (editProject.tradingData) {
        setTradingStrategy(editProject.tradingData.strategy || '');
        setTradingRiskLevel(editProject.tradingData.riskLevel || 'medium');
        setTradingTargetReturn(editProject.tradingData.targetReturn?.toString() || '');
      }
      if (editProject.fitnessData) {
        setFitnessExerciseType(editProject.fitnessData.exerciseType || '');
        setFitnessTargetWeight(editProject.fitnessData.targetWeight?.toString() || '');
      }
      if (editProject.financeData) {
        setFinanceBudget(editProject.financeData.budget?.toString() || '');
        setFinanceSavingsTarget(editProject.financeData.savingsTarget?.toString() || '');
      }
      if (editProject.programmingData) {
        setProgrammingTechStack(editProject.programmingData.techStack?.join(', ') || '');
        setProgrammingRepository(editProject.programmingData.repository || '');
      }
      
      setShowAdvanced(true);
    } else {
      setTitle('');
      setDescription('');
      setGoalId(preselectedGoalId || '');
      setDeadline('');
      setCategory((preselectedCategory as ProjectCategory) || 'other');
      setPriority('medium');
      setStatus('active');
      setNotes('');
      setTradingStrategy('');
      setTradingRiskLevel('medium');
      setTradingTargetReturn('');
      setFitnessExerciseType('');
      setFitnessTargetWeight('');
      setFinanceBudget('');
      setFinanceSavingsTarget('');
      setProgrammingTechStack('');
      setProgrammingRepository('');
      setShowAdvanced(!!preselectedCategory);
    }
  }, [editProject, isOpen, preselectedGoalId, preselectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      title,
      description,
      goalId: goalId || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      status,
      category,
      priority,
      notes: notes || undefined,
      tradingData: category === 'trading' ? {
        strategy: tradingStrategy || undefined,
        riskLevel: tradingRiskLevel,
        targetReturn: tradingTargetReturn ? parseFloat(tradingTargetReturn) : undefined,
      } : undefined,
      fitnessData: category === 'fitness' ? {
        exerciseType: fitnessExerciseType || undefined,
        targetWeight: fitnessTargetWeight ? parseFloat(fitnessTargetWeight) : undefined,
      } : undefined,
      financeData: category === 'finance' || category === 'wealth' ? {
        budget: financeBudget ? parseFloat(financeBudget) : undefined,
        savingsTarget: financeSavingsTarget ? parseFloat(financeSavingsTarget) : undefined,
      } : undefined,
      programmingData: category === 'programming' ? {
        techStack: programmingTechStack ? programmingTechStack.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        repository: programmingRepository || undefined,
      } : undefined,
    };

    try {
      if (editProject) {
        await updateProject(editProject.id, projectData);
      } else {
        await addProject(projectData);
      }
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Projekts:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const selectedCategoryConfig = categoryOptions.find(c => c.value === category);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editProject ? 'Projekt bearbeiten' : 'Neues Projekt'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Kategorie</label>
          <div className="grid grid-cols-4 gap-2">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1
                  ${category === opt.value 
                    ? `bg-gray-50 border-gray-300 ring-2 ring-indigo-200 ${opt.color}` 
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              >
                {opt.icon}
                <span className="text-[10px] font-medium">{opt.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <Input
            label="Projekt-Name"
            placeholder="Wie heißt das Projekt?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Beschreibung"
            placeholder="Was soll mit diesem Projekt erreicht werden?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Project['status'])}
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Priorität</label>
            <div className="grid grid-cols-4 gap-1">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all border
                    ${priority === opt.value 
                      ? `${opt.color} ring-1 ring-offset-1` 
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deadline & Goal */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Deadline (optional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <Select
            label="Zugehöriges Ziel (optional)"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            options={[
              { value: '', label: 'Kein Ziel' },
              ...goals.map(g => ({ value: g.id, label: g.title }))
            ]}
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700
                     flex items-center justify-center gap-2 transition-colors
                     bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100"
        >
          {selectedCategoryConfig?.icon}
          {showAdvanced ? 'Weniger Details' : `${selectedCategoryConfig?.label || 'Kategorie'}-Details`}
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Category-Specific Fields */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100 animate-fadeIn">
            {category === 'trading' && (
              <>
                <Input
                  label="Trading-Strategie"
                  placeholder="z.B. Swing Trading, Day Trading, Value Investing"
                  value={tradingStrategy}
                  onChange={(e) => setTradingStrategy(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Risiko-Level</label>
                    <select
                      value={tradingRiskLevel}
                      onChange={(e) => setTradingRiskLevel(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                    </select>
                  </div>
                  <Input
                    label="Ziel-Return (%)"
                    type="number"
                    placeholder="z.B. 15"
                    value={tradingTargetReturn}
                    onChange={(e) => setTradingTargetReturn(e.target.value)}
                  />
                </div>
              </>
            )}

            {category === 'fitness' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Trainingsart"
                  placeholder="z.B. Krafttraining, Cardio, HIIT"
                  value={fitnessExerciseType}
                  onChange={(e) => setFitnessExerciseType(e.target.value)}
                />
                <Input
                  label="Zielgewicht (kg)"
                  type="number"
                  placeholder="z.B. 75"
                  value={fitnessTargetWeight}
                  onChange={(e) => setFitnessTargetWeight(e.target.value)}
                />
              </div>
            )}

            {(category === 'finance' || category === 'wealth') && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Budget (€)"
                  type="number"
                  placeholder="z.B. 5000"
                  value={financeBudget}
                  onChange={(e) => setFinanceBudget(e.target.value)}
                />
                <Input
                  label="Sparziel (€)"
                  type="number"
                  placeholder="z.B. 10000"
                  value={financeSavingsTarget}
                  onChange={(e) => setFinanceSavingsTarget(e.target.value)}
                />
              </div>
            )}

            {category === 'programming' && (
              <>
                <Input
                  label="Tech Stack"
                  placeholder="z.B. React, TypeScript, Node.js"
                  value={programmingTechStack}
                  onChange={(e) => setProgrammingTechStack(e.target.value)}
                />
                <Input
                  label="Repository URL"
                  placeholder="https://github.com/..."
                  value={programmingRepository}
                  onChange={(e) => setProgrammingRepository(e.target.value)}
                />
              </>
            )}

            <Textarea
              label="Notizen"
              placeholder="Zusätzliche Notizen zum Projekt..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium
                       rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editProject ? 'Speichern' : 'Projekt erstellen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
