'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen, Smile, Meh, Frown, Trash2, Edit2,
  Star, Plus, X, ChevronDown, ChevronRight, Lightbulb,
  Target, Zap, Brain, Coffee, Sparkles, Calendar, CheckCircle2,
  Clock, TrendingUp, Award, AlertCircle, ArrowRight
} from 'lucide-react';
import { useDataStore } from '@/store';
import { ConfirmModal } from '@/components/modals';
import { format, isSunday, startOfWeek, endOfWeek, subWeeks, isThisWeek, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { JournalEntry, DailyReflection, WeeklyReflection } from '@/types';

// Prompts für produktives Journaling
const journalPrompts = [
  { icon: Target, text: "Was ist dein wichtigstes Ziel für diese Woche?", category: "Ziele" },
  { icon: Zap, text: "Welche 3 Dinge haben heute am meisten Energie gekostet?", category: "Energie" },
  { icon: Brain, text: "Was hast du heute Neues gelernt?", category: "Lernen" },
  { icon: Coffee, text: "Wofür bist du heute dankbar?", category: "Dankbarkeit" },
  { icon: Sparkles, text: "Was würdest du heute anders machen?", category: "Reflexion" },
  { icon: Target, text: "Welchen Fortschritt hast du bei deinen Zielen gemacht?", category: "Fortschritt" },
  { icon: Zap, text: "Was hat dich heute motiviert?", category: "Motivation" },
  { icon: Brain, text: "Welche Gewohnheit möchtest du aufbauen/ablegen?", category: "Gewohnheiten" },
];

// Star Rating Component
function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-white/50">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              size={16}
              className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Journal Entry Summary Card
function JournalSummaryCard({ entry, onEdit, onDelete }: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const moodIcons = {
    great: <Smile className="text-green-400" size={16} />,
    good: <Smile className="text-green-400" size={16} />,
    neutral: <Meh className="text-yellow-400" size={16} />,
    bad: <Frown className="text-orange-400" size={16} />,
    terrible: <Frown className="text-red-400" size={16} />,
  };

  const moodLabels = {
    great: 'Super',
    good: 'Gut',
    neutral: 'Okay',
    bad: 'Mäßig',
    terrible: 'Schlecht',
  };

  // Kurze Zusammenfassung erstellen (erste 100 Zeichen)
  const summary = entry.content.length > 100
    ? entry.content.substring(0, 100) + '...'
    : entry.content;

  return (
    <div className="group border border-white/08 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
      {/* Header - immer sichtbar */}
      <div
        className="p-4 cursor-pointer flex items-start justify-between hover:bg-white/[0.02] transition-colors rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {format(new Date(entry.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </span>
            {entry.mood && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {moodIcons[entry.mood]}
                <span className="text-xs text-white/50">{moodLabels[entry.mood]}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/60 line-clamp-2">{summary}</p>

          {/* Quick Stats */}
          {entry.reflection && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                Produktivität: {entry.reflection.productivity}/5
              </span>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Zap size={10} className="text-blue-400" />
                Energie: {entry.reflection.energy}/5
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 hover:bg-white/08 rounded transition-colors"
            >
              <Edit2 size={14} className="text-white/40" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
            >
              <Trash2 size={14} className="text-white/40 hover:text-red-400" />
            </button>
          </div>
          {expanded ? (
            <ChevronDown size={16} className="text-white/30" />
          ) : (
            <ChevronRight size={16} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/08 pt-3 animate-fadeIn">
          {/* Full Content */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Vollständiger Eintrag
            </h4>
            <p className="text-sm text-white/70 whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {entry.content}
            </p>
          </div>

          {/* Reflection Details */}
          {entry.reflection && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Tägliche Reflexion
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.10)' }}>
                  <span className="text-xs text-violet-400 font-medium">Produktivität</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.productivity ? 'text-amber-400 fill-amber-400' : 'text-white/15'} />
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.10)' }}>
                  <span className="text-xs text-blue-400 font-medium">Energie</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.energy ? 'text-amber-400 fill-amber-400' : 'text-white/15'} />
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.10)' }}>
                  <span className="text-xs text-amber-400 font-medium">Fokus</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.focus ? 'text-amber-400 fill-amber-400' : 'text-white/15'} />
                    ))}
                  </div>
                </div>
              </div>

              {entry.reflection.wentWell && (
                <div className="p-3 rounded-lg border border-green-500/20" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <span className="text-xs text-green-400 font-medium">✓ Was lief gut</span>
                  <p className="text-sm text-green-300/80 mt-1">{entry.reflection.wentWell}</p>
                </div>
              )}

              {entry.reflection.couldImprove && (
                <div className="p-3 rounded-lg border border-orange-500/20" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  <span className="text-xs text-orange-400 font-medium">↗ Verbesserungspotenzial</span>
                  <p className="text-sm text-orange-300/80 mt-1">{entry.reflection.couldImprove}</p>
                </div>
              )}

              {entry.reflection.gratitude && (
                <div className="p-3 rounded-lg border border-pink-500/20" style={{ background: 'rgba(236,72,153,0.08)' }}>
                  <span className="text-xs text-pink-400 font-medium">💝 Dankbarkeit</span>
                  <p className="text-sm text-pink-300/80 mt-1">{entry.reflection.gratitude}</p>
                </div>
              )}

              {entry.reflection.tomorrowPriority && (
                <div className="p-3 rounded-lg border border-violet-500/20" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <span className="text-xs text-violet-400 font-medium">🎯 Priorität für morgen</span>
                  <p className="text-sm text-violet-300/80 mt-1">{entry.reflection.tomorrowPriority}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const [journalContent, setJournalContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood'] | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [weeklyReflectionStep, setWeeklyReflectionStep] = useState(0);

  const [reflection, setReflection] = useState<DailyReflection>({
    productivity: 3,
    energy: 3,
    focus: 3,
    wentWell: '',
    couldImprove: '',
    gratitude: '',
    tomorrowPriority: '',
  });

  const [weeklyReflection, setWeeklyReflection] = useState<Partial<WeeklyReflection>>({
    wentWell: '',
    couldImprove: '',
    lessonsLearned: '',
    proudOf: '',
    nextWeekPlan: '',
    nextWeekPriorities: ['', '', ''],
    productivityRating: 3,
    energyRating: 3,
    satisfactionRating: 3,
  });

  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    tasks,
    timeEntries = [],
    habits = [],
  } = useDataStore();

  const today = new Date();
  const isSundayToday = isSunday(today);
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Check if weekly reflection exists for this week
  const existingWeeklyReflection = useMemo(() => {
    return journalEntries.find(entry =>
      entry.isWeeklyReflection &&
      isThisWeek(new Date(entry.date), { weekStartsOn: 1 })
    );
  }, [journalEntries]);

  // Calculate week statistics for weekly reflection
  const weekStats = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const completedTasks = tasks.filter(t => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      return completed >= weekStart && completed <= weekEnd;
    }).length;

    const focusMinutes = timeEntries
      .filter(e => {
        const start = new Date(e.startTime);
        return start >= weekStart && start <= weekEnd;
      })
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    // Count habits - just count how many habits exist as a simple metric
    const habitsCompleted = habits.length;

    return { completedTasks, focusMinutes, habitsCompleted };
  }, [tasks, timeEntries, habits, today]);

  const handleSaveJournal = async () => {
    const entryData = {
      date: new Date(),
      content: journalContent,
      mood: selectedMood || undefined,
      tags: [],
      reflection: showReflection ? reflection : undefined,
    };

    try {
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, entryData);
        setEditingEntry(null);
      } else {
        await addJournalEntry(entryData);
      }
      resetForm();
    } catch (error) {
      console.error('Fehler beim Speichern des Journaleintrags:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const handleSaveWeeklyReflection = async () => {
    const entryData = {
      date: new Date(),
      content: `Wochenreflexion KW ${format(thisWeekStart, 'w')}: ${weeklyReflection.wentWell || ''}`,
      mood: undefined,
      tags: ['wochenreflexion'],
      isWeeklyReflection: true,
      weeklyReflection: {
        ...weeklyReflection,
        id: `wr-${Date.now()}`,
        weekStart: thisWeekStart,
        weekEnd: thisWeekEnd,
        completedTasks: weekStats.completedTasks,
        focusMinutes: weekStats.focusMinutes,
        habitsCompleted: weekStats.habitsCompleted,
      } as WeeklyReflection,
    };

    try {
      await addJournalEntry(entryData);
      setShowWeeklyReflection(false);
      setWeeklyReflectionStep(0);
      setWeeklyReflection({
        wentWell: '',
        couldImprove: '',
        lessonsLearned: '',
        proudOf: '',
        nextWeekPlan: '',
        nextWeekPriorities: ['', '', ''],
        productivityRating: 3,
        energyRating: 3,
        satisfactionRating: 3,
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Wochenreflexion:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const resetForm = () => {
    setJournalContent('');
    setSelectedMood(null);
    setShowReflection(false);
    setShowForm(false);
    setReflection({
      productivity: 3,
      energy: 3,
      focus: 3,
      wentWell: '',
      couldImprove: '',
      gratitude: '',
      tomorrowPriority: '',
    });
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setJournalContent(entry.content);
    setSelectedMood(entry.mood || null);
    setShowForm(true);
    if (entry.reflection) {
      setReflection(entry.reflection);
      setShowReflection(true);
    }
  };

  const moods = [
    { value: 'great' as const, icon: Smile, color: 'text-green-400', bg: 'hover:bg-green-500/10', label: 'Super' },
    { value: 'good' as const, icon: Smile, color: 'text-green-400', bg: 'hover:bg-green-500/10', label: 'Gut' },
    { value: 'neutral' as const, icon: Meh, color: 'text-yellow-400', bg: 'hover:bg-yellow-500/10', label: 'Okay' },
    { value: 'bad' as const, icon: Frown, color: 'text-orange-400', bg: 'hover:bg-orange-500/10', label: 'Mäßig' },
    { value: 'terrible' as const, icon: Frown, color: 'text-red-400', bg: 'hover:bg-red-500/10', label: 'Schlecht' },
  ];

  const moodIcons = {
    great: <Smile className="text-green-400" size={14} />,
    good: <Smile className="text-green-400" size={14} />,
    neutral: <Meh className="text-yellow-400" size={14} />,
    bad: <Frown className="text-orange-400" size={14} />,
    terrible: <Frown className="text-red-400" size={14} />,
  };

  // Group entries by month
  const groupedEntries = journalEntries.reduce((acc, entry) => {
    const month = format(new Date(entry.date), 'MMMM yyyy', { locale: de });
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  // Weekly Reflection Steps
  const weeklyReflectionSteps = [
    { title: 'Rückblick', icon: Calendar, description: 'Was ist diese Woche passiert?' },
    { title: 'Lernen', icon: Brain, description: 'Was hast du gelernt?' },
    { title: 'Bewertung', icon: Star, description: 'Wie war deine Woche?' },
    { title: 'Nächste Woche', icon: Target, description: 'Was planst du?' },
  ];

  const handleConfirmDelete = () => {
    const entryId = showDeleteConfirm;
    if (!entryId) return;

    setShowDeleteConfirm(null);
    void (async () => {
      try {
        await deleteJournalEntry(entryId);
      } catch (error) {
        console.error('Fehler beim Löschen des Journal-Eintrags:', error);
        alert('Löschen fehlgeschlagen. Bitte erneut versuchen.');
      }
    })();
  };
  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Journal</h1>
              <p className="text-white/50 mt-1">{format(today, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showForm && !showWeeklyReflection && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                <Plus size={16} />
                Neuer Eintrag
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sunday Weekly Reflection Prompt */}
      {isSundayToday && !existingWeeklyReflection && !showWeeklyReflection && !showForm && (
        <div className="mb-6 p-5 rounded-xl border border-violet-500/20" style={{ background: 'rgba(124,58,237,0.08)' }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Calendar size={24} className="text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Zeit für deine Wochenreflexion! 📝</h3>
              <p className="text-sm text-white/60 mb-3">
                Jeden Sonntag ist eine gute Zeit, um auf die vergangene Woche zurückzublicken und die nächste zu planen.
              </p>
              <div className="flex items-center gap-3 text-sm text-white/40 mb-4">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-400" />
                  {weekStats.completedTasks} Aufgaben erledigt
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  {Math.round(weekStats.focusMinutes / 60)}h fokussiert
                </span>
              </div>
              <button
                onClick={() => setShowWeeklyReflection(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Wochenreflexion starten
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Reflection Form */}
      {showWeeklyReflection && (
        <div className="mb-6 border border-violet-500/20 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {/* Header */}
          <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Wochenreflexion</h3>
                <p className="text-violet-200 text-sm">
                  KW {format(thisWeekStart, 'w')} • {format(thisWeekStart, 'd.M.', { locale: de })} - {format(thisWeekEnd, 'd.M.yyyy', { locale: de })}
                </p>
              </div>
              <button
                onClick={() => { setShowWeeklyReflection(false); setWeeklyReflectionStep(0); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Schließen"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-4">
              {weeklyReflectionSteps.map((step, index) => (
                <div key={step.title} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      index === weeklyReflectionStep
                        ? 'bg-white text-violet-700'
                        : index < weeklyReflectionStep
                        ? 'bg-violet-500 text-white'
                        : 'bg-violet-500/50 text-violet-200'
                    }`}
                  >
                    <step.icon size={12} />
                    {step.title}
                  </div>
                  {index < weeklyReflectionSteps.length - 1 && (
                    <div className={`w-6 h-0.5 mx-1 ${index < weeklyReflectionStep ? 'bg-violet-400' : 'bg-violet-500/50'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Week Stats Summary */}
          <div className="p-4 border-b border-white/08" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <CheckCircle2 size={20} className="mx-auto text-green-400 mb-1" />
                <p className="text-xl font-bold text-white">{weekStats.completedTasks}</p>
                <p className="text-xs text-white/40">Aufgaben erledigt</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Clock size={20} className="mx-auto text-blue-400 mb-1" />
                <p className="text-xl font-bold text-white">{Math.round(weekStats.focusMinutes / 60)}h</p>
                <p className="text-xs text-white/40">Fokuszeit</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <TrendingUp size={20} className="mx-auto text-violet-400 mb-1" />
                <p className="text-xl font-bold text-white">{weekStats.habitsCompleted}</p>
                <p className="text-xs text-white/40">Habits erledigt</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-5">
            {/* Step 0: Rückblick */}
            {weeklyReflectionStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    ✅ Was lief diese Woche richtig gut?
                  </label>
                  <textarea
                    value={weeklyReflection.wentWell || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, wentWell: e.target.value }))}
                    placeholder="Erfolge, positive Momente, erreichte Ziele..."
                    className="w-full px-4 py-3 text-sm text-white placeholder:text-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 border border-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    🔄 Was hätte besser laufen können?
                  </label>
                  <textarea
                    value={weeklyReflection.couldImprove || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, couldImprove: e.target.value }))}
                    placeholder="Herausforderungen, Hindernisse, was du ändern möchtest..."
                    className="w-full px-4 py-3 text-sm text-white placeholder:text-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 border border-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Lernen */}
            {weeklyReflectionStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    💡 Was hast du diese Woche gelernt?
                  </label>
                  <textarea
                    value={weeklyReflection.lessonsLearned || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                    placeholder="Neue Erkenntnisse, Skills, Einsichten..."
                    className="w-full px-4 py-3 text-sm text-white placeholder:text-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 border border-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    🏆 Worauf bist du stolz?
                  </label>
                  <textarea
                    value={weeklyReflection.proudOf || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, proudOf: e.target.value }))}
                    placeholder="Deine Erfolge, auch die kleinen..."
                    className="w-full px-4 py-3 text-sm text-white placeholder:text-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 border border-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Bewertung */}
            {weeklyReflectionStep === 2 && (
              <div className="space-y-5">
                <p className="text-sm text-white/50 mb-4">
                  Wie würdest du diese Woche auf einer Skala von 1-5 bewerten?
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.10)' }}>
                    <StarRating
                      value={weeklyReflection.productivityRating || 3}
                      onChange={(v) => setWeeklyReflection(prev => ({ ...prev, productivityRating: v as 1|2|3|4|5 }))}
                      label="Produktivität"
                    />
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.10)' }}>
                    <StarRating
                      value={weeklyReflection.energyRating || 3}
                      onChange={(v) => setWeeklyReflection(prev => ({ ...prev, energyRating: v as 1|2|3|4|5 }))}
                      label="Energie"
                    />
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.10)' }}>
                    <StarRating
                      value={weeklyReflection.satisfactionRating || 3}
                      onChange={(v) => setWeeklyReflection(prev => ({ ...prev, satisfactionRating: v as 1|2|3|4|5 }))}
                      label="Zufriedenheit"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Nächste Woche */}
            {weeklyReflectionStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    🎯 Top 3 Prioritäten für nächste Woche
                  </label>
                  <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        value={weeklyReflection.nextWeekPriorities?.[index] || ''}
                        onChange={(e) => {
                          const newPriorities = [...(weeklyReflection.nextWeekPriorities || ['', '', ''])];
                          newPriorities[index] = e.target.value;
                          setWeeklyReflection(prev => ({ ...prev, nextWeekPriorities: newPriorities }));
                        }}
                        placeholder={`Priorität ${index + 1}`}
                        className="w-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    📋 Weitere Pläne & Ziele
                  </label>
                  <textarea
                    value={weeklyReflection.nextWeekPlan || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, nextWeekPlan: e.target.value }))}
                    placeholder="Was willst du nächste Woche erreichen?"
                    className="w-full px-4 py-3 text-sm text-white placeholder:text-white/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 border border-white/10 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-4 border-t border-white/08 flex items-center justify-between">
            <button
              onClick={() => setWeeklyReflectionStep(prev => Math.max(0, prev - 1))}
              disabled={weeklyReflectionStep === 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                weeklyReflectionStep === 0
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/60 hover:bg-white/08'
              }`}
            >
              Zurück
            </button>

            {weeklyReflectionStep < 3 ? (
              <button
                onClick={() => setWeeklyReflectionStep(prev => prev + 1)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleSaveWeeklyReflection}
                className="px-6 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                Wochenreflexion speichern
              </button>
            )}
          </div>
        </div>
      )}

      {/* New Entry Form */}
      {showForm && (
        <div className="mb-6 border border-white/08 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">
              {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-white/08 rounded transition-colors"
            >
              <X size={16} className="text-white/40" />
            </button>
          </div>

          {/* Mood Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">Stimmung</label>
            <div className="flex gap-2">
              {moods.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`
                      p-2.5 rounded-lg border-2 transition-all focus:outline-none
                      ${selectedMood === mood.value
                        ? 'border-violet-500 shadow-sm'
                        : 'border-white/10 ' + mood.bg
                      }
                    `}
                    style={selectedMood === mood.value ? { background: 'rgba(124,58,237,0.15)' } : { background: 'rgba(255,255,255,0.04)' }}
                    title={mood.label}
                  >
                    <Icon size={20} className={mood.color} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white/70">Was beschäftigt dich?</label>
              <button
                onClick={() => setShowPrompts(!showPrompts)}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <Lightbulb size={12} />
                {showPrompts ? 'Prompts ausblenden' : 'Schreib-Ideen'}
              </button>
            </div>

            {/* Journal Prompts */}
            {showPrompts && (
              <div className="mb-3 p-3 rounded-lg border border-violet-500/20" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <p className="text-xs font-medium text-violet-400 mb-2">💡 Klicke auf einen Prompt, um ihn zu nutzen:</p>
                <div className="grid grid-cols-2 gap-2">
                  {journalPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setJournalContent(prev => prev + (prev ? '\n\n' : '') + prompt.text + '\n');
                        }}
                        className="flex items-start gap-2 p-2 rounded-md border border-violet-500/20 hover:border-violet-500/40 hover:bg-white/[0.03] transition-all text-left"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <Icon size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-white/60">{prompt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Schreibe deine Gedanken auf..."
              rows={4}
              className="w-full px-4 py-3 text-white placeholder:text-white/30 rounded-lg resize-none border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Reflection Toggle */}
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="text-sm text-violet-400 hover:text-violet-300 hover:underline mb-4 transition-colors"
          >
            {showReflection ? 'Reflexion ausblenden' : '+ Tägliche Reflexion hinzufügen'}
          </button>

          {/* Reflection Section */}
          {showReflection && (
            <div className="border-t border-white/08 pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <StarRating
                  value={reflection.productivity}
                  onChange={(v) => setReflection({ ...reflection, productivity: v as 1 | 2 | 3 | 4 | 5 })}
                  label="Produktivität"
                />
                <StarRating
                  value={reflection.energy}
                  onChange={(v) => setReflection({ ...reflection, energy: v as 1 | 2 | 3 | 4 | 5 })}
                  label="Energie"
                />
                <StarRating
                  value={reflection.focus}
                  onChange={(v) => setReflection({ ...reflection, focus: v as 1 | 2 | 3 | 4 | 5 })}
                  label="Fokus"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Was lief gut?</label>
                  <textarea
                    value={reflection.wentWell}
                    onChange={(e) => setReflection({ ...reflection, wentWell: e.target.value })}
                    className="w-full px-3 py-2.5 text-white placeholder:text-white/30 rounded-lg resize-none border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={2}
                    placeholder="Erfolge, Fortschritte..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Was kann besser werden?</label>
                  <textarea
                    value={reflection.couldImprove}
                    onChange={(e) => setReflection({ ...reflection, couldImprove: e.target.value })}
                    className="w-full px-3 py-2.5 text-white placeholder:text-white/30 rounded-lg resize-none border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    rows={2}
                    placeholder="Verbesserungen..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Wofür bist du dankbar?</label>
                <input
                  type="text"
                  value={reflection.gratitude}
                  onChange={(e) => setReflection({ ...reflection, gratitude: e.target.value })}
                  className="w-full px-3 py-2.5 text-white placeholder:text-white/30 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="Dankbarkeit..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Priorität für morgen</label>
                <input
                  type="text"
                  value={reflection.tomorrowPriority}
                  onChange={(e) => setReflection({ ...reflection, tomorrowPriority: e.target.value })}
                  className="w-full px-3 py-2.5 text-white placeholder:text-white/30 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  placeholder="Wichtigste Aufgabe..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/08">
            <button
              onClick={handleSaveJournal}
              disabled={!journalContent.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              {editingEntry ? 'Speichern' : 'Eintrag erstellen'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-xl border border-white/10 hover:bg-white/08 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Entries List - Vergangene Einträge */}
      {journalEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <BookOpen size={28} className="text-violet-400" />
          </div>
          <p className="font-medium text-white/70 mb-1">Noch keine Einträge</p>
          <p className="text-sm text-white/40">Starte mit deinem ersten Journal-Eintrag.</p>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" />
            Vergangene Einträge
            <span className="text-xs text-white/40 font-normal">({journalEntries.length} insgesamt)</span>
          </h2>

          {Object.entries(groupedEntries).map(([month, entries]) => (
            <div key={month} className="mb-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 sticky top-0 bg-[var(--background)] py-1">
                {month}
                <span className="ml-2 text-white/20">({entries.length} Einträge)</span>
              </h3>

              <div className="space-y-3">
                {entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <JournalSummaryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={() => handleEditEntry(entry)}
                      onDelete={() => setShowDeleteConfirm(entry.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Eintrag löschen"
        message="Möchtest du diesen Journal-Eintrag wirklich löschen?"
      />
    </div>
  );
}


