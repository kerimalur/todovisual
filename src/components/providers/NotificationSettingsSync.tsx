'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/store';

const SYNC_DEBOUNCE_MS = 2400;
const RETRY_DELAY_MS = 500;

interface SyncResponsePayload {
  settingsSnapshot?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
}

const getLocalTimezone = (): string => {
  if (typeof window === 'undefined') return 'UTC';
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeFetchedSettings = (payload: SyncResponsePayload): Record<string, unknown> => {
  if (isPlainObject(payload.settingsSnapshot)) {
    return payload.settingsSnapshot;
  }

  if (isPlainObject(payload.settings)) {
    return payload.settings;
  }

  return {};
};

export function NotificationSettingsSync() {
  const { user, session } = useAuth();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const lastSuccessfulPayloadRef = useRef<string>('');
  const pendingPayloadRef = useRef<string>('');
  const inFlightRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const hydrationReadyRef = useRef(false);

  const payload = useMemo(
    () =>
      JSON.stringify({
        name: settings.name,
        email: settings.email,
        smsRemindersEnabled: settings.smsRemindersEnabled,
        smsPhoneNumber: settings.smsPhoneNumber.trim(),
        smsLeadMinutes: settings.smsLeadMinutes,
        whatsappRemindersEnabled: settings.whatsappRemindersEnabled,
        whatsappPhoneNumber: settings.whatsappPhoneNumber.trim(),
        whatsappTaskCreatedEnabled: settings.whatsappTaskCreatedEnabled,
        whatsappTaskCompletedEnabled: settings.whatsappTaskCompletedEnabled,
        whatsappTaskStartReminderEnabled: settings.whatsappTaskStartReminderEnabled,
        whatsappWeeklyReviewEnabled: settings.whatsappWeeklyReviewEnabled,
        whatsappEventAttendedEnabled: settings.whatsappEventAttendedEnabled,
        whatsappWeeklyReviewTime: settings.whatsappWeeklyReviewTime,
        whatsappTaskCreatedTemplate: settings.whatsappTaskCreatedTemplate,
        whatsappTaskCompletedTemplate: settings.whatsappTaskCompletedTemplate,
        whatsappTaskStartTemplate: settings.whatsappTaskStartTemplate,
        whatsappWeeklyReviewTemplate: settings.whatsappWeeklyReviewTemplate,
        whatsappEventAttendedTemplate: settings.whatsappEventAttendedTemplate,
        whatsappCustomRules: settings.whatsappCustomRules,
        weekStartsOnMonday: settings.weekStartsOnMonday,
        timezone: getLocalTimezone(),
        settingsSnapshot: settings,
      }),
    [settings]
  );

  const sendPayload = useCallback(async (payloadToSend: string, accessToken: string) => {
    const response = await fetch('/api/notifications/settings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: payloadToSend,
      cache: 'no-store',
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(result?.error || 'Notification-Settings Sync fehlgeschlagen.');
    }
  }, []);

  const flushPendingPayload = useCallback(async () => {
    const accessToken = session?.access_token;
    if (!user || !accessToken || !hydrationReadyRef.current) return;
    if (inFlightRef.current) return;

    const payloadToSend = pendingPayloadRef.current;
    if (!payloadToSend || payloadToSend === lastSuccessfulPayloadRef.current) return;

    inFlightRef.current = true;
    try {
      await sendPayload(payloadToSend, accessToken);
      if (pendingPayloadRef.current === payloadToSend) {
        pendingPayloadRef.current = '';
      }
      lastSuccessfulPayloadRef.current = payloadToSend;
    } catch (error) {
      console.error('Notification settings sync failed:', error);
    } finally {
      inFlightRef.current = false;
      if (pendingPayloadRef.current && pendingPayloadRef.current !== lastSuccessfulPayloadRef.current) {
        window.setTimeout(() => {
          void flushPendingPayload();
        }, RETRY_DELAY_MS);
      }
    }
  }, [sendPayload, session?.access_token, user]);

  useEffect(() => {
    const accessToken = session?.access_token;
    const userId = user?.id;

    if (!userId || !accessToken) {
      hydrationReadyRef.current = false;
      lastSuccessfulPayloadRef.current = '';
      pendingPayloadRef.current = '';
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    let active = true;
    hydrationReadyRef.current = false;

    const preloadFromServer = async () => {
      try {
        const response = await fetch('/api/notifications/settings/sync', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || 'Settings konnten nicht geladen werden.');
        }

        const result = (await response.json().catch(() => null)) as SyncResponsePayload | null;
        if (!active || !result) return;

        const remoteSettings = normalizeFetchedSettings(result);
        if (Object.keys(remoteSettings).length > 0) {
          updateSettings(remoteSettings as Partial<typeof settings>);
        }
      } catch (error) {
        console.error('Notification settings preload failed:', error);
      } finally {
        if (!active) return;
        hydrationReadyRef.current = true;
      }
    };

    void preloadFromServer();

    return () => {
      active = false;
    };
  }, [session?.access_token, updateSettings, user?.id]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!user || !accessToken) return;
    if (!hydrationReadyRef.current) return;
    if (payload === lastSuccessfulPayloadRef.current) return;

    pendingPayloadRef.current = payload;
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void flushPendingPayload();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [flushPendingPayload, payload, session?.access_token, user]);

  return null;
}

