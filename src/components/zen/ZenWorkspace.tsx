'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, CheckCircle2, Clock, Circle, Target, Calendar, Zap, Coffee, Sparkles, Music } from 'lucide-react';
import { useAppStore, useDataStore, useSettingsStore, useMotivationStore } from '@/store';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const quotes = [
  { text: "Der beste Weg, etwas zu erledigen, ist anzufangen.", author: "Walt Disney" },
  { text: "Erfolg ist die Summe kleiner Anstrengungen, die sich Tag für Tag wiederholen.", author: "Robert Collier" },
  { text: "Es ist nicht wenig Zeit, die wir haben, sondern viel Zeit, die wir nicht nutzen.", author: "Seneca" },
  { text: "Konzentriere dich auf das, was du kontrollieren kannst.", author: "Epiktet" },
  { text: "Jeder Meister war einst ein Anfänger.", author: "Unbekannt" },
  { text: "Kleine Fortschritte sind immer noch Fortschritte.", author: "Unbekannt" },
  { text: "Der Weg entsteht beim Gehen.", author: "Antonio Machado" },
  { text: "Ruhe ist auch eine Form von Produktivität.", author: "Unbekannt" },
];

export function ZenWorkspace() {
  const { toggleZenWorkspace } = useAppStore();
  const { tasks, completeTask } = useDataStore();
  const { settings } = useSettingsStore();
  const { triggerMotivation } = useMotivationStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  const [completedAnimation, setCompletedAnimation] = useState<string | null>(null);

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get incomplete tasks sorted by priority
  const incompleteTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      });
  }, [tasks]);

  // Stats
  const todayCompleted = tasks.filter(t => {
    if (!t.completedAt) return false;
    const today = new Date();
    const completed = new Date(t.completedAt);
    return completed.toDateString() === today.toDateString();
  }).length;

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeconds = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { second: '2-digit' }).split(':').pop();
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const name = settings.name ? `, ${settings.name}` : '';
    const base = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : hour < 22 ? 'Guten Abend' : 'Gute Nacht';

    if (settings.greetingStyle === 'direct') {
      return settings.name ? `${settings.name}, Fokus halten.` : 'Fokus halten.';
    }

    if (settings.greetingStyle === 'motivational') {
      return `${base}${name}. Du machst Fortschritt.`;
    }

    return `${base}${name}`;
  };

  const handleCompleteTask = (taskId: string) => {
    setCompletedAnimation(taskId);
    setTimeout(() => {
      completeTask(taskId);
      triggerMotivation('task-complete');
      setCompletedAnimation(null);
    }, 300);
  };

  // Background style based on settings
  const getBackgroundStyle = () => {
    switch (settings.zenBackgroundStyle) {
      case 'gradient':
        return 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]';
      case 'animated':
        return 'bg-[#0d1117] zen-animated-bg';
      default:
        return 'bg-[#141414]';
    }
  };

  return (
    <div className={`fixed inset-0 ${getBackgroundStyle()} flex flex-col z-[100] transition-all duration-500`}>
      {/* Ambient light effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Top Bar - Minimal */}
      <div className="relative flex items-center justify-between px-10 py-8">
        <div className="flex items-center gap-6">
          <Coffee size={20} className="text-amber-400/60" />
          <span className="text-[#555] text-sm">{formatDate(currentTime)}</span>
        </div>
        
        <button 
          onClick={toggleZenWorkspace} 
          className="p-3 rounded-xl hover:bg-white/5 transition-all duration-300 group"
          title="Zen Modus beenden"
        >
          <X size={20} className="text-[#555] group-hover:text-white/80 transition-colors" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-10 overflow-hidden">
        
        {/* Greeting & Clock */}
        {settings.zenShowClock && (
          <div className="text-center mb-16">
            <p className="text-[#666] text-lg mb-4 tracking-wide">{getGreeting()}</p>
            {settings.personalMotto.trim() && (
              <p className="text-white/45 text-sm mb-4 tracking-wide">{settings.personalMotto.trim()}</p>
            )}
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl md:text-8xl font-extralight text-white/90 tracking-tight">
                {formatClock(currentTime)}
              </span>
              <span className="text-2xl text-white/30 font-light">
                {formatSeconds(currentTime)}
              </span>
            </div>
          </div>
        )}

        {/* Task List - Floating Card */}
        <div className="w-full max-w-2xl">
          <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.05] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={16} className="text-blue-400/70" />
                <span className="text-white/60 text-sm font-medium">Aufgaben für heute</span>
              </div>
              <span className="text-white/30 text-xs">{incompleteTasks.length} offen</span>
            </div>

            {/* Task List */}
            <div className="max-h-[40vh] overflow-auto">
              {incompleteTasks.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {incompleteTasks.slice(0, 8).map((task) => (
                    <div
                      key={task.id}
                      className={[
                        'group',
                        'flex',
                        'items-center',
                        'gap-4',
                        'px-6',
                        'py-4',
                        'hover:bg-white/[0.02]',
                        'transition-all',
                        'duration-300',
                        completedAnimation === task.id ? 'opacity-0 translate-x-4' : ''
                      ].filter(Boolean).join(' ')}
                    >
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-5 h-5 rounded-full border-2 border-white/20 hover:border-green-400/60 hover:bg-green-400/10 flex items-center justify-center transition-all duration-300 flex-shrink-0"
                        title="Als erledigt markieren"
                      >
                        <CheckCircle2 size={12} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {task.dueDate && (
                            <span className="text-white/30 text-xs flex items-center gap-1">
                              <Calendar size={10} />
                              {format(new Date(task.dueDate), 'd. MMM', { locale: de })}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            task.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-white/10 text-white/40'
                          }`}>
                            {task.priority === 'urgent' ? 'Dringend' :
                             task.priority === 'high' ? 'Hoch' :
                             task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Sparkles size={32} className="mx-auto mb-4 text-amber-400/40" />
                  <p className="text-white/60 text-lg">Alles erledigt!</p>
                  <p className="text-white/30 text-sm mt-2">Zeit für eine wohlverdiente Pause ✨</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {settings.zenShowStats && (
          <div className="flex gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-light text-white/80">{todayCompleted}</p>
              <p className="text-white/30 text-xs mt-1">Heute erledigt</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-light text-amber-400/80">
                {incompleteTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
              </p>
              <p className="text-white/30 text-xs mt-1">Wichtig</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-light text-blue-400/80">{incompleteTasks.length}</p>
              <p className="text-white/30 text-xs mt-1">Offen</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quote */}
      {settings.zenShowQuotes && (
        <div className="relative px-10 py-8 text-center">
          <p className="text-white/40 text-sm italic max-w-xl mx-auto">
            &ldquo;{currentQuote.text}&rdquo;
          </p>
          <p className="text-white/20 text-xs mt-2">— {currentQuote.author}</p>
        </div>
      )}

      {/* CSS for animated background */}
      <style jsx>{`
        .zen-animated-bg {
          background: linear-gradient(-45deg, #0d1117, #161b22, #1f2937, #111827);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
