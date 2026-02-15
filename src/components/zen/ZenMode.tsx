'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, Timer, CheckCircle2, Clock, Pause, Play, SkipForward, Target, Circle, Plus, Minus, AlertTriangle, Lock } from 'lucide-react';
import { useAppStore, useTimerStore, useDataStore, useMotivationStore } from '@/store';
import { Task } from '@/types';

type ZenPhase = 'select-task' | 'set-timer' | 'focus';

export function ZenMode() {
  const { toggleZenMode } = useAppStore();
  const { timer, tick, startTimer, stopTimer, pauseTimer, resumeTimer } = useTimerStore();
  const { tasks, completeTask } = useDataStore();
  const { triggerMotivation } = useMotivationStore();
  
  const [phase, setPhase] = useState<ZenPhase>(timer.isRunning ? 'focus' : 'select-task');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get incomplete tasks sorted by priority
  const incompleteTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      });
  }, [tasks]);

  // Find task if timer is already running
  useEffect(() => {
    if (timer.isRunning && timer.currentTaskId) {
      const task = tasks.find(t => t.id === timer.currentTaskId);
      if (task) {
        setSelectedTask(task);
        setPhase('focus');
      }
    }
  }, [timer.isRunning, timer.currentTaskId, tasks]);

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused, tick]);

  // Document title
  useEffect(() => {
    if (phase === 'focus' && timer.isRunning) {
      const mins = Math.floor(timer.secondsRemaining / 60);
      const secs = timer.secondsRemaining % 60;
      document.title = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} - Fokus`;
    } else {
      document.title = 'Zen Mode';
    }
    return () => { document.title = 'Productivity Suite'; };
  }, [phase, timer.secondsRemaining, timer.isRunning]);

  // Timer completion
  useEffect(() => {
    if (timer.isRunning && timer.secondsRemaining === 0) {
      triggerMotivation('timer-done');
      stopTimer();
      setPhase('select-task');
    }
  }, [timer.secondsRemaining, timer.isRunning, triggerMotivation, stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setTimerMinutes(task.estimatedMinutes || 25);
    setPhase('set-timer');
  };

  const handleStartTimer = () => {
    if (selectedTask) {
      startTimer(timerMinutes, selectedTask.id);
      setPhase('focus');
    }
  };

  const handleCompleteTask = () => {
    if (selectedTask) {
      completeTask(selectedTask.id);
      triggerMotivation('task-complete');
      stopTimer();
      setSelectedTask(null);
      setPhase('select-task');
    }
  };

  const handleExit = () => {
    // If timer is running, show confirmation or block exit
    if (timer.isRunning && !timer.isPaused) {
      setShowExitConfirm(true);
      return;
    }
    if (timer.isRunning) {
      stopTimer();
    }
    toggleZenMode();
  };

  const handleForceExit = () => {
    stopTimer();
    toggleZenMode();
  };

  // State for exit confirmation
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Block keyboard navigation and escape during focus
  useEffect(() => {
    if (phase === 'focus' && timer.isRunning && !timer.isPaused) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block escape and common navigation shortcuts during active focus
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowExitConfirm(true);
        }
        // Block CMD+W, CMD+Q, Alt+F4 etc.
        if ((e.metaKey || e.ctrlKey) && ['w', 'q', 't'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [phase, timer.isRunning, timer.isPaused]);

  const progress = timer.totalSeconds > 0 
    ? ((timer.totalSeconds - timer.secondsRemaining) / timer.totalSeconds) * 100 
    : 0;

  const priorityColors = {
    urgent: 'border-l-red-500',
    high: 'border-l-orange-400',
    medium: 'border-l-blue-400',
    low: 'border-l-gray-300',
  };

  return (
    <div className="fixed inset-0 bg-[#191919] flex flex-col z-[100]">
      {/* Exit Confirmation Modal - Blocks leaving during focus */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
          <div className="bg-[#252525] rounded-xl p-6 max-w-md mx-4 border border-[#3f3f3f]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Fokus unterbrechen?</h3>
            </div>
            <p className="text-[#9b9b9b] text-sm mb-6">
              Du bist mitten in einer Fokus-Session. Jede Unterbrechung zerstört deinen Flow. 
              Bist du sicher, dass du aufhören willst?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#2383e2] text-white font-medium hover:bg-[#1a73c7] transition-colors"
                title="Fokus-Session fortsetzen"
              >
                Weitermachen
              </button>
              <button
                onClick={handleForceExit}
                className="px-4 py-2.5 rounded-lg bg-[#3f3f3f] text-[#9b9b9b] font-medium hover:bg-[#4f4f4f] transition-colors"
                title="Fokus-Session beenden"
              >
                Trotzdem beenden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f2f2f]">
        <div className="text-[#9b9b9b] text-sm font-mono">
          {formatClock(currentTime)}
        </div>
        <div className="flex items-center gap-2">
          {phase === 'focus' && timer.isRunning && !timer.isPaused && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2f2f2f]">
              <Lock size={12} className="text-[#f59e0b]" />
              <span className="text-[10px] text-[#f59e0b] uppercase tracking-wider">Fokus aktiv</span>
            </div>
          )}
          <span className="text-[#9b9b9b] text-xs tracking-wider uppercase">
            {phase === 'select-task' && 'Aufgabe wählen'}
            {phase === 'set-timer' && 'Timer einstellen'}
            {phase === 'focus' && 'Fokus Mode'}
          </span>
        </div>
        <button 
          onClick={handleExit} 
          className={`p-2 rounded transition-colors ${
            phase === 'focus' && timer.isRunning && !timer.isPaused 
              ? 'hover:bg-red-500/20 text-red-400' 
              : 'hover:bg-[#2f2f2f] text-[#9b9b9b]'
          }`}
          title={phase === 'focus' && timer.isRunning ? 'Fokus unterbrechen' : 'Schließen'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-auto">
        
        {/* Phase 1: Select Task */}
        {phase === 'select-task' && (
          <div className="w-full max-w-xl">
            <h1 className="text-2xl font-semibold text-white mb-2 text-center">
              Wähle eine Aufgabe
            </h1>
            <p className="text-[#9b9b9b] text-sm text-center mb-8">
              Worauf möchtest du dich fokussieren?
            </p>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {incompleteTasks.length > 0 ? (
                incompleteTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`
                      w-full text-left p-4 rounded-lg bg-[#252525] border-l-4 
                      hover:bg-[#2f2f2f] transition-all group
                      ${priorityColors[task.priority]}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Circle size={18} className="text-[#5c5c5c] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#e8e8e8] font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-[#9b9b9b] text-sm mt-1 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {task.estimatedMinutes && (
                            <span className="text-[#6b6b6b] text-xs flex items-center gap-1">
                              <Clock size={12} />
                              {task.estimatedMinutes} min
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {task.priority === 'urgent' ? 'Dringend' :
                             task.priority === 'high' ? 'Hoch' :
                             task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <Target size={48} className="mx-auto mb-4 text-[#5c5c5c]" />
                  <p className="text-[#9b9b9b]">Keine offenen Aufgaben</p>
                  <button 
                    onClick={handleExit}
                    className="mt-4 text-blue-400 hover:underline text-sm"
                  >
                    Zurück zum Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: Set Timer */}
        {phase === 'set-timer' && selectedTask && (
          <div className="text-center max-w-md">
            <div className="mb-8">
              <p className="text-[#9b9b9b] text-sm uppercase tracking-wider mb-3">Aufgabe</p>
              <h1 className="text-3xl font-semibold text-white leading-tight">
                {selectedTask.title}
              </h1>
            </div>

            <div className="mb-10">
              <p className="text-[#9b9b9b] text-sm uppercase tracking-wider mb-4">Timer einstellen</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setTimerMinutes(Math.max(5, timerMinutes - 5))}
                  className="p-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] transition-colors"
                  title="Timer verringern"
                >
                  <Minus size={20} className="text-[#9b9b9b]" />
                </button>
                <div className="text-6xl font-mono font-bold text-white w-32">
                  {timerMinutes}
                </div>
                <button
                  onClick={() => setTimerMinutes(Math.min(120, timerMinutes + 5))}
                  className="p-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] transition-colors"
                  title="Timer erhöhen"
                >
                  <Plus size={20} className="text-[#9b9b9b]" />
                </button>
              </div>
              <p className="text-[#6b6b6b] text-sm mt-2">Minuten</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setPhase('select-task')}
                className="px-6 py-3 rounded-lg bg-[#252525] text-[#9b9b9b] hover:bg-[#2f2f2f] transition-all"
              >
                Zurück
              </button>
              <button
                onClick={handleStartTimer}
                className="px-10 py-3 rounded-lg bg-white text-[#191919] font-semibold hover:bg-[#e8e8e8] transition-all"
              >
                Starten
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Focus Mode */}
        {phase === 'focus' && selectedTask && (
          <div className="text-center max-w-3xl">
            {/* Task Title - Main Focus */}
            <div className="mb-12">
              <p className="text-[#6b6b6b] text-sm uppercase tracking-widest mb-4">Fokus</p>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                {selectedTask.title}
              </h1>
              {selectedTask.description && (
                <p className="text-[#9b9b9b] text-lg mt-4 max-w-xl mx-auto">
                  {selectedTask.description}
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="mb-12">
              <div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tight">
                {formatTime(timer.secondsRemaining)}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6 max-w-md mx-auto h-1 bg-[#2f2f2f] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={timer.isPaused ? resumeTimer : pauseTimer}
                className="p-4 rounded-xl bg-[#252525] hover:bg-[#2f2f2f] transition-colors"
              >
                {timer.isPaused ? <Play size={24} className="text-white" /> : <Pause size={24} className="text-white" />}
              </button>
              <button
                onClick={handleCompleteTask}
                className="px-8 py-4 rounded-xl bg-white text-[#191919] font-semibold hover:bg-[#e8e8e8] transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={20} />
                Erledigt
              </button>
              <button
                onClick={() => { stopTimer(); setPhase('select-task'); }}
                className="px-6 py-4 rounded-xl bg-[#252525] text-[#9b9b9b] hover:bg-[#2f2f2f] transition-all"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
