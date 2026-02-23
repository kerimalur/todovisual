'use client';

import { useEffect, useMemo, useRef } from 'react';
import { format, startOfWeek } from 'date-fns';
import { useDataStore, useSettingsStore } from '@/store';
import { buildWeeklyReviewMessage } from '@/lib/weeklyReviewMessage';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { buildAuthorizedHeaders } from '@/lib/clientRequestAuth';

const CHECK_INTERVAL_MS = 60 * 1000;

const isWithinWeeklyReviewWindow = (now: Date, reminderTime: string): boolean => {
  if (now.getDay() !== 0) return false;

  const [hour, minute] = normalizeReminderTime(reminderTime).split(':').map(Number);
  const scheduledAt = new Date(now);
  scheduledAt.setHours(hour, minute, 0, 0);

  const windowEnd = new Date(scheduledAt);
  windowEnd.setMinutes(windowEnd.getMinutes() + 59);

  return now >= scheduledAt && now <= windowEnd;
};

export function ReminderScheduler() {
  const userId = useDataStore((state) => state.userId);
  const tasks = useDataStore((state) => state.tasks);
  const goals = useDataStore((state) => state.goals);
  const { settings } = useSettingsStore();
  const sendingRef = useRef(false);

  const storageKey = useMemo(
    () => `wa-weekly-review-last-sent:${userId || 'anonymous'}`,
    [userId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!userId) return;

    let active = true;

    const checkAndSendWeeklyReview = async () => {
      if (!active || sendingRef.current) return;
      if (!settings.whatsappRemindersEnabled || !settings.whatsappWeeklyReviewEnabled) return;

      const phoneNumber = settings.whatsappPhoneNumber.trim();
      if (!phoneNumber) return;

      const now = new Date();
      if (!isWithinWeeklyReviewWindow(now, settings.whatsappWeeklyReviewTime)) return;

      const weekStartsOn = settings.weekStartsOnMonday ? 1 : 0;
      const weekKey = format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd');
      const alreadySentWeek = localStorage.getItem(storageKey);
      if (alreadySentWeek === weekKey) return;

      const message = buildWeeklyReviewMessage({
        tasks,
        goals,
        now,
        weekStartsOnMonday: settings.weekStartsOnMonday,
      });

      sendingRef.current = true;
      try {
        const headers = await buildAuthorizedHeaders({
          'Content-Type': 'application/json',
        });
        const response = await fetch('/api/reminders/whatsapp/weekly-review', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phoneNumber,
            message,
          }),
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || 'Wochenrueckblick konnte nicht versendet werden.');
        }

        localStorage.setItem(storageKey, weekKey);
      } catch (error) {
        console.error('Weekly WhatsApp review failed:', error);
      } finally {
        sendingRef.current = false;
      }
    };

    void checkAndSendWeeklyReview();
    const intervalId = window.setInterval(() => {
      void checkAndSendWeeklyReview();
    }, CHECK_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [
    goals,
    settings.weekStartsOnMonday,
    settings.whatsappPhoneNumber,
    settings.whatsappRemindersEnabled,
    settings.whatsappWeeklyReviewEnabled,
    settings.whatsappWeeklyReviewTime,
    storageKey,
    tasks,
    userId,
  ]);

  return null;
}
