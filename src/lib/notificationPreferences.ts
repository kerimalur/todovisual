import { WhatsAppCustomRule, WhatsAppCustomRuleTrigger } from '@/types';

export interface NotificationPreferences {
  whatsappRemindersEnabled: boolean;
  whatsappTaskCreatedEnabled: boolean;
  whatsappTaskCompletedEnabled: boolean;
  whatsappTaskStartReminderEnabled: boolean;
  whatsappWeeklyReviewEnabled: boolean;
  whatsappEventAttendedEnabled: boolean;
  whatsappPhoneNumber: string;
  whatsappWeeklyReviewTime: string;
  whatsappTaskCreatedTemplate: string;
  whatsappTaskCompletedTemplate: string;
  whatsappTaskStartTemplate: string;
  whatsappWeeklyReviewTemplate: string;
  whatsappEventAttendedTemplate: string;
  whatsappCustomRules: WhatsAppCustomRule[];
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  whatsappRemindersEnabled: false,
  whatsappTaskCreatedEnabled: true,
  whatsappTaskCompletedEnabled: true,
  whatsappTaskStartReminderEnabled: true,
  whatsappWeeklyReviewEnabled: true,
  whatsappEventAttendedEnabled: true,
  whatsappPhoneNumber: '',
  whatsappWeeklyReviewTime: '22:00',
  whatsappTaskCreatedTemplate:
    'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  whatsappTaskCompletedTemplate:
    'Aufgabe erledigt: "{taskTitle}"\nErledigt am: {completedAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  whatsappTaskStartTemplate:
    'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  whatsappWeeklyReviewTemplate:
    'Wochenrueckblick ({weekRange})\n\n{review}',
  whatsappEventAttendedTemplate:
    'Anwesenheit bestaetigt: "{eventTitle}"\nZeit: {eventStart} - {eventEnd}\nDatum: {eventDate}',
  whatsappCustomRules: [],
};

interface PersistedSettingsShape {
  state?: {
    settings?: Partial<NotificationPreferences>;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const VALID_TRIGGERS: WhatsAppCustomRuleTrigger[] = ['task-created', 'task-completed', 'event-attended'];

const isValidTrigger = (value: unknown): value is WhatsAppCustomRuleTrigger =>
  typeof value === 'string' && VALID_TRIGGERS.includes(value as WhatsAppCustomRuleTrigger);

const sanitizeCustomRules = (value: unknown): WhatsAppCustomRule[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (!isRecord(entry)) return null;

      const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : `rule-${index + 1}`;
      const name =
        typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0, 80) : `Regel ${index + 1}`;
      const template =
        typeof entry.template === 'string' && entry.template.trim()
          ? entry.template.trim().slice(0, 1500)
          : '';

      if (!template || !isValidTrigger(entry.trigger)) return null;

      return {
        id,
        name,
        enabled: typeof entry.enabled === 'boolean' ? entry.enabled : true,
        trigger: entry.trigger,
        template,
      } satisfies WhatsAppCustomRule;
    })
    .filter((rule): rule is WhatsAppCustomRule => !!rule);
};

export const getNotificationPreferences = (): NotificationPreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem('settings-storage');
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(raw) as PersistedSettingsShape;
    const settings = parsed?.state?.settings;

    if (!isRecord(settings)) {
      return DEFAULT_PREFERENCES;
    }

    return {
      whatsappRemindersEnabled:
        typeof settings.whatsappRemindersEnabled === 'boolean'
          ? settings.whatsappRemindersEnabled
          : DEFAULT_PREFERENCES.whatsappRemindersEnabled,
      whatsappTaskCreatedEnabled:
        typeof settings.whatsappTaskCreatedEnabled === 'boolean'
          ? settings.whatsappTaskCreatedEnabled
          : DEFAULT_PREFERENCES.whatsappTaskCreatedEnabled,
      whatsappTaskCompletedEnabled:
        typeof settings.whatsappTaskCompletedEnabled === 'boolean'
          ? settings.whatsappTaskCompletedEnabled
          : DEFAULT_PREFERENCES.whatsappTaskCompletedEnabled,
      whatsappTaskStartReminderEnabled:
        typeof settings.whatsappTaskStartReminderEnabled === 'boolean'
          ? settings.whatsappTaskStartReminderEnabled
          : DEFAULT_PREFERENCES.whatsappTaskStartReminderEnabled,
      whatsappWeeklyReviewEnabled:
        typeof settings.whatsappWeeklyReviewEnabled === 'boolean'
          ? settings.whatsappWeeklyReviewEnabled
          : DEFAULT_PREFERENCES.whatsappWeeklyReviewEnabled,
      whatsappEventAttendedEnabled:
        typeof settings.whatsappEventAttendedEnabled === 'boolean'
          ? settings.whatsappEventAttendedEnabled
          : DEFAULT_PREFERENCES.whatsappEventAttendedEnabled,
      whatsappPhoneNumber:
        typeof settings.whatsappPhoneNumber === 'string'
          ? settings.whatsappPhoneNumber
          : DEFAULT_PREFERENCES.whatsappPhoneNumber,
      whatsappWeeklyReviewTime:
        typeof settings.whatsappWeeklyReviewTime === 'string'
          ? settings.whatsappWeeklyReviewTime
          : DEFAULT_PREFERENCES.whatsappWeeklyReviewTime,
      whatsappTaskCreatedTemplate:
        typeof settings.whatsappTaskCreatedTemplate === 'string'
          ? settings.whatsappTaskCreatedTemplate
          : DEFAULT_PREFERENCES.whatsappTaskCreatedTemplate,
      whatsappTaskCompletedTemplate:
        typeof settings.whatsappTaskCompletedTemplate === 'string'
          ? settings.whatsappTaskCompletedTemplate
          : DEFAULT_PREFERENCES.whatsappTaskCompletedTemplate,
      whatsappTaskStartTemplate:
        typeof settings.whatsappTaskStartTemplate === 'string'
          ? settings.whatsappTaskStartTemplate
          : DEFAULT_PREFERENCES.whatsappTaskStartTemplate,
      whatsappWeeklyReviewTemplate:
        typeof settings.whatsappWeeklyReviewTemplate === 'string'
          ? settings.whatsappWeeklyReviewTemplate
          : DEFAULT_PREFERENCES.whatsappWeeklyReviewTemplate,
      whatsappEventAttendedTemplate:
        typeof settings.whatsappEventAttendedTemplate === 'string'
          ? settings.whatsappEventAttendedTemplate
          : DEFAULT_PREFERENCES.whatsappEventAttendedTemplate,
      whatsappCustomRules: sanitizeCustomRules(settings.whatsappCustomRules),
    };
  } catch (error) {
    console.error('Unable to parse notification settings:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const normalizeReminderTime = (value: string, fallback = '22:00'): string => {
  const normalized = value.trim();
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return fallback;
  }
  return normalized;
};
