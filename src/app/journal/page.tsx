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
      <span className="text-xs text-[#9b9a97]">{label}</span>
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
              className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
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
    great: <Smile className="text-green-500" size={16} />,
    good: <Smile className="text-green-400" size={16} />,
    neutral: <Meh className="text-yellow-500" size={16} />,
    bad: <Frown className="text-orange-500" size={16} />,
    terrible: <Frown className="text-red-500" size={16} />,
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
    <div className="group border border-[#e9e9e7] rounded-lg bg-white hover:shadow-md transition-all">
      {/* Header - immer sichtbar */}
      <div 
        className="p-4 cursor-pointer flex items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#37352f]">
              {format(new Date(entry.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </span>
            {entry.mood && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full">
                {moodIcons[entry.mood]}
                <span className="text-xs text-gray-500">{moodLabels[entry.mood]}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[#6b6b6b] line-clamp-2">{summary}</p>
          
          {/* Quick Stats */}
          {entry.reflection && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-[#9b9a97] flex items-center gap-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                Produktivität: {entry.reflection.productivity}/5
              </span>
              <span className="text-xs text-[#9b9a97] flex items-center gap-1">
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
              className="p-1.5 hover:bg-[rgba(55,53,47,0.08)] rounded"
            >
              <Edit2 size={14} className="text-[#9b9a97]" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} className="text-[#9b9a97] hover:text-red-500" />
            </button>
          </div>
          {expanded ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f0f0ef] pt-3 animate-fadeIn">
          {/* Full Content */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-[#9b9a97] uppercase tracking-wider mb-2">
              Vollständiger Eintrag
            </h4>
            <p className="text-sm text-[#37352f] whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {entry.content}
            </p>
          </div>

          {/* Reflection Details */}
          {entry.reflection && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-[#9b9a97] uppercase tracking-wider">
                Tägliche Reflexion
              </h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                  <span className="text-xs text-purple-600 font-medium">Produktivität</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.productivity ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <span className="text-xs text-blue-600 font-medium">Energie</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.energy ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                  <span className="text-xs text-amber-600 font-medium">Fokus</span>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= entry.reflection!.focus ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
              </div>

              {entry.reflection.wentWell && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-xs text-green-600 font-medium">✓ Was lief gut</span>
                  <p className="text-sm text-green-800 mt-1">{entry.reflection.wentWell}</p>
                </div>
              )}

              {entry.reflection.couldImprove && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="text-xs text-orange-600 font-medium">↗ Verbesserungspotenzial</span>
                  <p className="text-sm text-orange-800 mt-1">{entry.reflection.couldImprove}</p>
                </div>
              )}

              {entry.reflection.gratitude && (
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                  <span className="text-xs text-pink-600 font-medium">💝 Dankbarkeit</span>
                  <p className="text-sm text-pink-800 mt-1">{entry.reflection.gratitude}</p>
                </div>
              )}

              {entry.reflection.tomorrowPriority && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-xs text-indigo-600 font-medium">🎯 Priorität für morgen</span>
                  <p className="text-sm text-indigo-800 mt-1">{entry.reflection.tomorrowPriority}</p>
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

  const handleSaveJournal = () => {
    const entryData = {
      date: new Date(),
      content: journalContent,
      mood: selectedMood || undefined,
      tags: [],
      reflection: showReflection ? reflection : undefined,
    };

    if (editingEntry) {
      updateJournalEntry(editingEntry.id, entryData);
      setEditingEntry(null);
    } else {
      addJournalEntry(entryData);
    }
    
    resetForm();
  };

  const handleSaveWeeklyReflection = () => {
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

    addJournalEntry(entryData);
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
    { value: 'great' as const, icon: Smile, color: 'text-green-500', bg: 'hover:bg-green-50', label: 'Super' },
    { value: 'good' as const, icon: Smile, color: 'text-green-400', bg: 'hover:bg-green-50', label: 'Gut' },
    { value: 'neutral' as const, icon: Meh, color: 'text-yellow-500', bg: 'hover:bg-yellow-50', label: 'Okay' },
    { value: 'bad' as const, icon: Frown, color: 'text-orange-500', bg: 'hover:bg-orange-50', label: 'Mäßig' },
    { value: 'terrible' as const, icon: Frown, color: 'text-red-500', bg: 'hover:bg-red-50', label: 'Schlecht' },
  ];

  const moodIcons = {
    great: <Smile className="text-green-500" size={14} />,
    good: <Smile className="text-green-400" size={14} />,
    neutral: <Meh className="text-yellow-500" size={14} />,
    bad: <Frown className="text-orange-500" size={14} />,
    terrible: <Frown className="text-red-500" size={14} />,
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Journal</h1>
            <p className="text-gray-500 mt-1">{format(today, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {!showForm && !showWeeklyReflection && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
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
        <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Zeit für deine Wochenreflexion! 📝</h3>
              <p className="text-sm text-gray-600 mb-3">
                Jeden Sonntag ist eine gute Zeit, um auf die vergangene Woche zurückzublicken und die nächste zu planen.
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-500" />
                  {weekStats.completedTasks} Aufgaben erledigt
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-500" />
                  {Math.round(weekStats.focusMinutes / 60)}h fokussiert
                </span>
              </div>
              <button
                onClick={() => setShowWeeklyReflection(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
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
        <div className="mb-6 border border-purple-200 rounded-xl bg-white overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Wochenreflexion</h3>
                <p className="text-purple-100 text-sm">
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
                        ? 'bg-white text-purple-700'
                        : index < weeklyReflectionStep
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-500/50 text-purple-200'
                    }`}
                  >
                    <step.icon size={12} />
                    {step.title}
                  </div>
                  {index < weeklyReflectionSteps.length - 1 && (
                    <div className={`w-6 h-0.5 mx-1 ${index < weeklyReflectionStep ? 'bg-purple-400' : 'bg-purple-500/50'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Week Stats Summary */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <CheckCircle2 size={20} className="mx-auto text-green-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{weekStats.completedTasks}</p>
                <p className="text-xs text-gray-500">Aufgaben erledigt</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <Clock size={20} className="mx-auto text-blue-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{Math.round(weekStats.focusMinutes / 60)}h</p>
                <p className="text-xs text-gray-500">Fokuszeit</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <TrendingUp size={20} className="mx-auto text-purple-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{weekStats.habitsCompleted}</p>
                <p className="text-xs text-gray-500">Habits erledigt</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-5">
            {/* Step 0: Rückblick */}
            {weeklyReflectionStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✅ Was lief diese Woche richtig gut?
                  </label>
                  <textarea
                    value={weeklyReflection.wentWell || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, wentWell: e.target.value }))}
                    placeholder="Erfolge, positive Momente, erreichte Ziele..."
                    className="w-full px-4 py-3 text-sm bg-green-50 border border-green-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔄 Was hätte besser laufen können?
                  </label>
                  <textarea
                    value={weeklyReflection.couldImprove || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, couldImprove: e.target.value }))}
                    placeholder="Herausforderungen, Hindernisse, was du ändern möchtest..."
                    className="w-full px-4 py-3 text-sm bg-orange-50 border border-orange-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Lernen */}
            {weeklyReflectionStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💡 Was hast du diese Woche gelernt?
                  </label>
                  <textarea
                    value={weeklyReflection.lessonsLearned || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                    placeholder="Neue Erkenntnisse, Skills, Einsichten..."
                    className="w-full px-4 py-3 text-sm bg-blue-50 border border-blue-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏆 Worauf bist du stolz?
                  </label>
                  <textarea
                    value={weeklyReflection.proudOf || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, proudOf: e.target.value }))}
                    placeholder="Deine Erfolge, auch die kleinen..."
                    className="w-full px-4 py-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-400"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Bewertung */}
            {weeklyReflectionStep === 2 && (
              <div className="space-y-5">
                <p className="text-sm text-gray-600 mb-4">
                  Wie würdest du diese Woche auf einer Skala von 1-5 bewerten?
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <StarRating
                      value={weeklyReflection.productivityRating || 3}
                      onChange={(v) => setWeeklyReflection(prev => ({ ...prev, productivityRating: v as 1|2|3|4|5 }))}
                      label="Produktivität"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <StarRating
                      value={weeklyReflection.energyRating || 3}
                      onChange={(v) => setWeeklyReflection(prev => ({ ...prev, energyRating: v as 1|2|3|4|5 }))}
                      label="Energie"
                    />
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 Weitere Pläne & Ziele
                  </label>
                  <textarea
                    value={weeklyReflection.nextWeekPlan || ''}
                    onChange={(e) => setWeeklyReflection(prev => ({ ...prev, nextWeekPlan: e.target.value }))}
                    placeholder="Was willst du nächste Woche erreichen?"
                    className="w-full px-4 py-3 text-sm bg-indigo-50 border border-indigo-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setWeeklyReflectionStep(prev => Math.max(0, prev - 1))}
              disabled={weeklyReflectionStep === 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                weeklyReflectionStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Zurück
            </button>
            
            {weeklyReflectionStep < 3 ? (
              <button
                onClick={() => setWeeklyReflectionStep(prev => prev + 1)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleSaveWeeklyReflection}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
              >
                Wochenreflexion speichern
              </button>
            )}
          </div>
        </div>
      )}

      {/* New Entry Form */}
      {showForm && (
        <div className="mb-6 border border-[#e9e9e7] rounded-md bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#37352f]">
              {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-[rgba(55,53,47,0.08)] rounded"
            >
              <X size={16} className="text-[#9b9a97]" />
            </button>
          </div>
          
          {/* Mood Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Stimmung</label>
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
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 ' + mood.bg
                      }
                    `}
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
              <label className="block text-sm font-medium text-gray-700">Was beschäftigt dich?</label>
              <button
                onClick={() => setShowPrompts(!showPrompts)}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
              >
                <Lightbulb size={12} />
                {showPrompts ? 'Prompts ausblenden' : 'Schreib-Ideen'}
              </button>
            </div>
            
            {/* Journal Prompts */}
            {showPrompts && (
              <div className="mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <p className="text-xs font-medium text-indigo-600 mb-2">💡 Klicke auf einen Prompt, um ihn zu nutzen:</p>
                <div className="grid grid-cols-2 gap-2">
                  {journalPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setJournalContent(prev => prev + (prev ? '\n\n' : '') + prompt.text + '\n');
                        }}
                        className="flex items-start gap-2 p-2 bg-white rounded-md border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                      >
                        <Icon size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700">{prompt.text}</span>
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
              className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg resize-none
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400
                         transition-all"
            />
          </div>

          {/* Reflection Toggle */}
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="text-sm text-[#2383e2] hover:underline mb-4"
          >
            {showReflection ? 'Reflexion ausblenden' : '+ Tägliche Reflexion hinzufügen'}
          </button>

          {/* Reflection Section */}
          {showReflection && (
            <div className="border-t border-[#e9e9e7] pt-4 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Was lief gut?</label>
                  <textarea
                    value={reflection.wentWell}
                    onChange={(e) => setReflection({ ...reflection, wentWell: e.target.value })}
                    className="w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg resize-none
                               placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    rows={2}
                    placeholder="Erfolge, Fortschritte..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Was kann besser werden?</label>
                  <textarea
                    value={reflection.couldImprove}
                    onChange={(e) => setReflection({ ...reflection, couldImprove: e.target.value })}
                    className="w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg resize-none
                               placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    rows={2}
                    placeholder="Verbesserungen..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Wofür bist du dankbar?</label>
                <input
                  type="text"
                  value={reflection.gratitude}
                  onChange={(e) => setReflection({ ...reflection, gratitude: e.target.value })}
                  className="w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg
                             placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  placeholder="Dankbarkeit..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priorität für morgen</label>
                <input
                  type="text"
                  value={reflection.tomorrowPriority}
                  onChange={(e) => setReflection({ ...reflection, tomorrowPriority: e.target.value })}
                  className="w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg
                             placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  placeholder="Wichtigste Aufgabe..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveJournal}
              disabled={!journalContent.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingEntry ? 'Speichern' : 'Eintrag erstellen'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Entries List - Vergangene Einträge */}
      {journalEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-indigo-500" />
          </div>
          <p className="font-medium text-gray-700 mb-1">Noch keine Einträge</p>
          <p className="text-sm text-gray-500">Starte mit deinem ersten Journal-Eintrag.</p>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-[#37352f] mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" />
            Vergangene Einträge
            <span className="text-xs text-[#9b9a97] font-normal">({journalEntries.length} insgesamt)</span>
          </h2>
          
          {Object.entries(groupedEntries).map(([month, entries]) => (
            <div key={month} className="mb-6">
              <h3 className="text-xs font-medium text-[#9b9a97] uppercase tracking-wider mb-3 sticky top-0 bg-[var(--background)] py-1">
                {month}
                <span className="ml-2 text-[#c3c3c1]">({entries.length} Einträge)</span>
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
        onConfirm={() => {
          if (showDeleteConfirm) {
            deleteJournalEntry(showDeleteConfirm);
            setShowDeleteConfirm(null);
          }
        }}
        title="Eintrag löschen"
        message="Möchtest du diesen Journal-Eintrag wirklich löschen?"
      />
    </div>
  );
}
