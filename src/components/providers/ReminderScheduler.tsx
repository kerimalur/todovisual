'use client';

import { useEffect, useMemo, useRef } from 'react';
import { format, startOfWeek } from 'date-fns';
import { useDataStore, useSettingsStore } from '@/store';
import { buildWeeklyReviewMessage } from '@/lib/weeklyReviewMessage';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { Project, Task } from '@/types';

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
  const projects = useDataStore((state) => state.projects);
  const { settings } = useSettingsStore();
  const weeklySendingRef = useRef(false);
  const taskReminderSendingRef = useRef(false);

  const storageKey = useMemo(
    () => `wa-weekly-review-last-sent:${userId || 'anonymous'}`,
    [userId]
  );

  const taskReminderStoragePrefix = useMemo(
    () => `wa-task-start-reminder:${userId || 'anonymous'}`,
    [userId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!userId) return;

    let active = true;
    const priorityLabel: Record<Task['priority'], string> = {
      urgent: 'Dringend',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    };

    const isTaskOpen = (task: Task) => task.status !== 'completed' && task.status !== 'archived';
    const getLinkedProjectTitle = (task: Task): string => {
      const linkedProjectIds = task.projectIds?.length ? task.projectIds : (task.projectId ? [task.projectId] : []);
      if (linkedProjectIds.length === 0) return 'Kein Projekt';
      const linkedProject = projects.find((project: Project) => linkedProjectIds.includes(project.id));
      return linkedProject?.title || 'Kein Projekt';
    };

    const buildTaskReminderMessage = (task: Task, startAt: Date): string => {
      const projectTitle = getLinkedProjectTitle(task);
      const importance = priorityLabel[task.priority] || task.priority;
      const startText = format(startAt, 'dd.MM.yyyy HH:mm');
      return [
        `Start in 1 Stunde: "${task.title}"`,
        `Beginn: ${startText} Uhr`,
        `Projekt: ${projectTitle}`,
        `Wichtigkeit: ${importance}`,
      ].join('\n');
    };

    const checkAndSendWeeklyReview = async () => {
      if (!active || weeklySendingRef.current) return;
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

      weeklySendingRef.current = true;
      try {
        const response = await fetch('/api/reminders/whatsapp/weekly-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
        weeklySendingRef.current = false;
      }
    };

    const checkAndSendTaskStartReminders = async () => {
      if (!active || taskReminderSendingRef.current) return;
      if (!settings.whatsappRemindersEnabled || !settings.whatsappTaskStartReminderEnabled) return;

      const phoneNumber = settings.whatsappPhoneNumber.trim();
      if (!phoneNumber) return;

      taskReminderSendingRef.current = true;
      try {
        const now = new Date();
        const candidates = tasks.filter((task) => {
          if (!isTaskOpen(task) || !task.dueDate) return false;
          const startAt = new Date(task.dueDate);
          if (Number.isNaN(startAt.getTime())) return false;
          if (startAt <= now) return false;
          const reminderAt = new Date(startAt.getTime() - 60 * 60 * 1000);
          return now >= reminderAt && now < startAt;
        });

        for (const task of candidates) {
          const startAt = new Date(task.dueDate as Date);
          const reminderKey = `${taskReminderStoragePrefix}:${task.id}:${startAt.toISOString()}`;
          if (localStorage.getItem(reminderKey) === 'sent') continue;

          const response = await fetch('/api/reminders/whatsapp/task-start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber,
              message: buildTaskReminderMessage(task, startAt),
            }),
          });

          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(result?.error || `Start-Erinnerung fuer "${task.title}" konnte nicht versendet werden.`);
          }

          localStorage.setItem(reminderKey, 'sent');
        }
      } catch (error) {
        console.error('Task start WhatsApp reminder failed:', error);
      } finally {
        taskReminderSendingRef.current = false;
      }
    };

    void checkAndSendWeeklyReview();
    void checkAndSendTaskStartReminders();
    const intervalId = window.setInterval(() => {
      void checkAndSendWeeklyReview();
      void checkAndSendTaskStartReminders();
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
    settings.whatsappTaskStartReminderEnabled,
    settings.whatsappWeeklyReviewEnabled,
    settings.whatsappWeeklyReviewTime,
    projects,
    storageKey,
    taskReminderStoragePrefix,
    tasks,
    userId,
  ]);

  return null;
}
