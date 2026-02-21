'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/store';

const SYNC_DEBOUNCE_MS = 800;

const getLocalTimezone = (): string => {
  if (typeof window === 'undefined') return 'UTC';
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

export function NotificationSettingsSync() {
  const { user, session } = useAuth();
  const settings = useSettingsStore((state) => state.settings);
  const lastSuccessfulPayloadRef = useRef<string>('');

  const payload = useMemo(
    () =>
      JSON.stringify({
        whatsappRemindersEnabled: settings.whatsappRemindersEnabled,
        whatsappPhoneNumber: settings.whatsappPhoneNumber.trim(),
        whatsappTaskCreatedEnabled: settings.whatsappTaskCreatedEnabled,
        whatsappTaskStartReminderEnabled: settings.whatsappTaskStartReminderEnabled,
        whatsappWeeklyReviewEnabled: settings.whatsappWeeklyReviewEnabled,
        whatsappWeeklyReviewTime: settings.whatsappWeeklyReviewTime,
        whatsappTaskCreatedTemplate: settings.whatsappTaskCreatedTemplate,
        whatsappTaskStartTemplate: settings.whatsappTaskStartTemplate,
        whatsappWeeklyReviewTemplate: settings.whatsappWeeklyReviewTemplate,
        weekStartsOnMonday: settings.weekStartsOnMonday,
        timezone: getLocalTimezone(),
      }),
    [
      settings.weekStartsOnMonday,
      settings.whatsappPhoneNumber,
      settings.whatsappRemindersEnabled,
      settings.whatsappTaskCreatedEnabled,
      settings.whatsappTaskCreatedTemplate,
      settings.whatsappTaskStartReminderEnabled,
      settings.whatsappTaskStartTemplate,
      settings.whatsappWeeklyReviewEnabled,
      settings.whatsappWeeklyReviewTime,
      settings.whatsappWeeklyReviewTemplate,
    ]
  );

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!user || !accessToken) return;
    if (payload === lastSuccessfulPayloadRef.current) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/notifications/settings/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: payload,
          cache: 'no-store',
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || 'Notification-Settings Sync fehlgeschlagen.');
        }

        if (!cancelled) {
          lastSuccessfulPayloadRef.current = payload;
        }
      } catch (error) {
        console.error('Notification settings sync failed:', error);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [payload, session?.access_token, user]);

  return null;
}
