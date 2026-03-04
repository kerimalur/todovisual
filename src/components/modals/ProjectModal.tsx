'use client';

import { useEffect, useState } from 'react';
import { Modal, Input, Textarea, Button } from '../ui/Modal';
import { useDataStore } from '@/store';
import { Project, ProjectCategory, ProjectPriority, ProjectMilestone } from '@/types';
import { CalendarClock, Milestone, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProject?: Project | null;
  preselectedGoalId?: string;
  preselectedCategory?: string;
}

const categoryOptions: { value: ProjectCategory; label: string }[] = [
  { value: 'trading', label: 'Trading' },
  { value: 'finance', label: 'Finanzen' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'health', label: 'Gesundheit' },
  { value: 'wealth', label: 'Vermögen' },
  { value: 'programming', label: 'Programmieren' },
  { value: 'improvement', label: 'Verbesserung' },
  { value: 'other', label: 'Sonstiges' },
];

const priorityOptions: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
  { value: 'critical', label: 'Kritisch' },
];

const statusOptions: { value: Project['status']; label: string }[] = [
  { value: 'planning', label: 'Planung' },
  { value: 'active', label: 'Aktiv' },
  { value: 'on-hold', label: 'Pausiert' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'archived', label: 'Archiviert' },
];

export function ProjectModal({
  isOpen,
  onClose,
  editProject,
  preselectedGoalId,
  preselectedCategory,
}: ProjectModalProps) {
  const { addProject, updateProject, goals } = useDataStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('other');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [status, setStatus] = useState<Project['status']>('active');
  const [notes, setNotes] = useState('');
  const [reviewCadence, setReviewCadence] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [timelinePhases, setTimelinePhases] = useState<ProjectMilestone[]>([]);

  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');
  const [newPhaseDate, setNewPhaseDate] = useState('');

  useEffect(() => {
    if (editProject) {
      const initialGoalIds = editProject.goalIds?.length
        ? editProject.goalIds
        : (editProject.goalId ? [editProject.goalId] : []);

      setTitle(editProject.title);
      setDescription(editProject.description || '');
      setGoalIds(initialGoalIds);
      setDeadline(editProject.deadline ? new Date(editProject.deadline).toISOString().split('T')[0] : '');
      setStartDate(editProject.startDate ? new Date(editProject.startDate).toISOString().split('T')[0] : '');
      setCategory(editProject.category || 'other');
      setPriority(editProject.priority || 'medium');
      setStatus(editProject.status || 'active');
      setNotes(editProject.notes || '');
      setReviewCadence(editProject.reviewCadence || 'weekly');
      setRiskLevel(editProject.riskLevel || 'medium');
      setTimelinePhases(editProject.timelinePhases || editProject.milestones || []);
    } else {
      setTitle('');
      setDescription('');
      setGoalIds(preselectedGoalId ? [preselectedGoalId] : []);
      setDeadline('');
      setStartDate('');
      setCategory((preselectedCategory as ProjectCategory) || 'other');
      setPriority('medium');
      setStatus('active');
      setNotes('');
      setReviewCadence('weekly');
      setRiskLevel('medium');
      setTimelinePhases([]);
    }

    setNewPhaseTitle('');
    setNewPhaseDescription('');
    setNewPhaseDate('');
  }, [editProject, isOpen, preselectedGoalId, preselectedCategory]);

  const toggleGoalLink = (goalId: string) => {
    setGoalIds((current) =>
      current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId]
    );
  };

  const addPhase = () => {
    const phaseTitle = newPhaseTitle.trim();
    if (!phaseTitle) return;

    setTimelinePhases((current) => [
      ...current,
      {
        id: uuidv4(),
        title: phaseTitle,
        description: newPhaseDescription.trim() || undefined,
        targetDate: newPhaseDate ? new Date(newPhaseDate) : undefined,
        completed: false,
      },
    ]);

    setNewPhaseTitle('');
    setNewPhaseDescription('');
    setNewPhaseDate('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    const projectData = {
      title: title.trim(),
      description: description.trim(),
      goalId: goalIds[0] || undefined,
      goalIds,
      deadline: deadline ? new Date(deadline) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      status,
      category,
      priority,
      notes: notes.trim() || undefined,
      milestones: timelinePhases,
      timelinePhases,
      workflowMode: 'timeline' as const,
      reviewCadence,
      riskLevel,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editProject ? 'Projekt bearbeiten' : 'Neues Projekt'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Projektname"
          placeholder="Wie heißt das Projekt?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          autoFocus
        />

        <Textarea
          label="Projektziel"
          placeholder="Welches Ergebnis liefert dieses Projekt?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Kategorie</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ProjectCategory)}
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ background: '#1a1d31' }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Project['status'])}
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ background: '#1a1d31' }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/80">Priorität</label>
          <div className="grid grid-cols-4 gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  priority === option.value
                    ? 'border-violet-500/40 text-violet-300'
                    : 'text-white/50 hover:text-white/70'
                }`}
                style={priority === option.value
                  ? { background: 'rgba(124,58,237,0.20)' }
                  : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
          <label className="block text-sm font-medium text-white/80 mb-2">Ziele verknüpfen (mehrfach möglich)</label>
          {goals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {goals.map((goal) => {
                const active = goalIds.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoalLink(goal.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      active
                        ? 'border-violet-500/40 text-violet-300'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                    style={active
                      ? { background: 'rgba(124,58,237,0.20)' }
                      : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }
                    }
                  >
                    {goal.title}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/40">Noch keine Ziele vorhanden.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Startdatum" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input label="Deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Review-Takt</label>
            <select
              value={reviewCadence}
              onChange={(event) => setReviewCadence(event.target.value as 'daily' | 'weekly' | 'biweekly')}
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <option value="daily" style={{ background: '#1a1d31' }}>Täglich</option>
              <option value="weekly" style={{ background: '#1a1d31' }}>Wöchentlich</option>
              <option value="biweekly" style={{ background: '#1a1d31' }}>Alle 2 Wochen</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Risikolevel</label>
            <select
              value={riskLevel}
              onChange={(event) => setRiskLevel(event.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <option value="low" style={{ background: '#1a1d31' }}>Niedrig</option>
              <option value="medium" style={{ background: '#1a1d31' }}>Mittel</option>
              <option value="high" style={{ background: '#1a1d31' }}>Hoch</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl p-3 space-y-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2">
            <Milestone size={15} className="text-violet-400" />
            <p className="text-sm font-semibold text-white">Timeline-Phasen</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_150px_auto] gap-2">
            <input
              type="text"
              value={newPhaseTitle}
              onChange={(event) => setNewPhaseTitle(event.target.value)}
              placeholder="Phase (z. B. Planung, Umsetzung, Abnahme)"
              className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            />
            <input
              type="text"
              value={newPhaseDescription}
              onChange={(event) => setNewPhaseDescription(event.target.value)}
              placeholder="Beschreibung"
              className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            />
            <input
              type="date"
              value={newPhaseDate}
              onChange={(event) => setNewPhaseDate(event.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', colorScheme: 'dark' }}
            />
            <button
              type="button"
              onClick={addPhase}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              <Plus size={14} />
            </button>
          </div>

          {timelinePhases.length > 0 && (
            <div className="space-y-2">
              {timelinePhases.map((phase) => (
                <div key={phase.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{phase.title}</p>
                    <p className="text-xs text-white/40">
                      {phase.description || 'Ohne Beschreibung'}
                      {phase.targetDate ? ` · ${new Date(phase.targetDate).toLocaleDateString('de-DE')}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimelinePhases((current) => current.filter((entry) => entry.id !== phase.id))}
                    className="rounded-md p-1 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-3" style={{ border: '1px solid rgba(124,58,237,0.20)', background: 'rgba(124,58,237,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={15} className="text-violet-400" />
            <p className="text-sm font-semibold text-white/80">Delivery-Notizen</p>
          </div>
          <Textarea
            placeholder="Blocker, offene Risiken, Abhängigkeiten, nächste Entscheidungen ..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">{editProject ? 'Speichern' : 'Projekt erstellen'}</Button>
        </div>
      </form>
    </Modal>
  );
}
