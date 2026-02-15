'use client';

import { useEffect } from 'react';
import { useTimerStore, useMotivationStore } from '@/store';

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { timer, tick, stopTimer } = useTimerStore();
  const { triggerMotivation } = useMotivationStore();

  // Timer tick effect
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.isPaused, tick]);

  // Update browser title with timer
  useEffect(() => {
    if (timer.isRunning) {
      const mins = Math.floor(timer.secondsRemaining / 60);
      const secs = timer.secondsRemaining % 60;
      document.title = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} - Fokus`;
    } else {
      document.title = 'Productivity Suite';
    }
  }, [timer.secondsRemaining, timer.isRunning]);

  // Check if timer completed
  useEffect(() => {
    if (timer.isRunning && timer.secondsRemaining === 0) {
      triggerMotivation('timer-done');
      stopTimer();
      
      // Play notification sound (optional)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Fokus-Session beendet!', {
            body: 'Zeit für eine kurze Pause.',
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [timer.secondsRemaining, timer.isRunning, triggerMotivation, stopTimer]);

  return <>{children}</>;
}
