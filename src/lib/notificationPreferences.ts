export interface NotificationPreferences {
  whatsappRemindersEnabled: boolean;
  whatsappTaskCreatedEnabled: boolean;
  whatsappTaskStartReminderEnabled: boolean;
  whatsappWeeklyReviewEnabled: boolean;
  whatsappPhoneNumber: string;
  whatsappWeeklyReviewTime: string;
  whatsappTaskCreatedTemplate: string;
  whatsappTaskStartTemplate: string;
  whatsappWeeklyReviewTemplate: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  whatsappRemindersEnabled: false,
  whatsappTaskCreatedEnabled: true,
  whatsappTaskStartReminderEnabled: true,
  whatsappWeeklyReviewEnabled: true,
  whatsappPhoneNumber: '',
  whatsappWeeklyReviewTime: '22:00',
  whatsappTaskCreatedTemplate:
    'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  whatsappTaskStartTemplate:
    'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}',
  whatsappWeeklyReviewTemplate:
    'Wochenrueckblick ({weekRange})\n\n{review}',
};

interface PersistedSettingsShape {
  state?: {
    settings?: Partial<NotificationPreferences>;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
      whatsappTaskStartReminderEnabled:
        typeof settings.whatsappTaskStartReminderEnabled === 'boolean'
          ? settings.whatsappTaskStartReminderEnabled
          : DEFAULT_PREFERENCES.whatsappTaskStartReminderEnabled,
      whatsappWeeklyReviewEnabled:
        typeof settings.whatsappWeeklyReviewEnabled === 'boolean'
          ? settings.whatsappWeeklyReviewEnabled
          : DEFAULT_PREFERENCES.whatsappWeeklyReviewEnabled,
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
      whatsappTaskStartTemplate:
        typeof settings.whatsappTaskStartTemplate === 'string'
          ? settings.whatsappTaskStartTemplate
          : DEFAULT_PREFERENCES.whatsappTaskStartTemplate,
      whatsappWeeklyReviewTemplate:
        typeof settings.whatsappWeeklyReviewTemplate === 'string'
          ? settings.whatsappWeeklyReviewTemplate
          : DEFAULT_PREFERENCES.whatsappWeeklyReviewTemplate,
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
