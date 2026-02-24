import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { isValidE164PhoneNumber } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

interface SyncNotificationSettingsBody {
  name?: string;
  email?: string;
  smsRemindersEnabled?: boolean;
  smsPhoneNumber?: string;
  smsLeadMinutes?: number;
  whatsappRemindersEnabled?: boolean;
  whatsappPhoneNumber?: string;
  whatsappTaskCreatedEnabled?: boolean;
  whatsappTaskCompletedEnabled?: boolean;
  whatsappTaskStartReminderEnabled?: boolean;
  whatsappWeeklyReviewEnabled?: boolean;
  whatsappEventAttendedEnabled?: boolean;
  whatsappWeeklyReviewTime?: string;
  whatsappTaskCreatedTemplate?: string;
  whatsappTaskCompletedTemplate?: string;
  whatsappTaskStartTemplate?: string;
  whatsappWeeklyReviewTemplate?: string;
  whatsappEventAttendedTemplate?: string;
  whatsappCustomRules?: unknown;
  weekStartsOnMonday?: boolean;
  timezone?: string;
  settingsSnapshot?: unknown;
}

interface NotificationSettingsRow {
  profile_name: string | null;
  profile_email: string | null;
  sms_reminders_enabled: boolean | null;
  sms_phone_number: string | null;
  sms_lead_minutes: number | null;
  whatsapp_reminders_enabled: boolean | null;
  whatsapp_phone_number: string | null;
  whatsapp_task_created_enabled: boolean | null;
  whatsapp_task_completed_enabled: boolean | null;
  whatsapp_task_start_reminder_enabled: boolean | null;
  whatsapp_weekly_review_enabled: boolean | null;
  whatsapp_event_attended_enabled: boolean | null;
  whatsapp_weekly_review_time: string | null;
  whatsapp_task_created_template: string | null;
  whatsapp_task_completed_template: string | null;
  whatsapp_task_start_template: string | null;
  whatsapp_weekly_review_template: string | null;
  whatsapp_event_attended_template: string | null;
  whatsapp_custom_rules: unknown;
  week_starts_on_monday: boolean | null;
  timezone: string | null;
  settings_snapshot: unknown;
}

type AuthenticatedUserResult =
  | {
      ok: true;
      userId: string;
      supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

const parseBearerToken = (request: NextRequest): string | null => {
  const authorizationHeader = request.headers.get('authorization')?.trim() || '';
  if (!authorizationHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : null;
};

const coerceBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const sanitizeTimezone = (value: unknown): string => {
  if (typeof value !== 'string') return 'UTC';
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 120) return 'UTC';
  return normalized;
};

const sanitizeTemplate = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 1500);
};

const sanitizeName = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 120);
};

const sanitizeEmail = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 320);
};

const sanitizeLeadMinutes = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 30;
  return Math.min(720, Math.max(0, Math.round(numeric)));
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeSettingsSnapshot = (value: unknown): Record<string, unknown> | null => {
  if (!isPlainObject(value)) return null;

  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.length > 50000) return null;
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const VALID_CUSTOM_RULE_TRIGGERS = ['task-created', 'task-completed', 'event-attended'] as const;

type SanitizedCustomRule = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: (typeof VALID_CUSTOM_RULE_TRIGGERS)[number];
  template: string;
};

const sanitizeCustomRules = (value: unknown): SanitizedCustomRule[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((rule, index) => {
      if (!rule || typeof rule !== 'object') return null;
      const candidate = rule as Record<string, unknown>;

      const template =
        typeof candidate.template === 'string' && candidate.template.trim()
          ? candidate.template.trim().slice(0, 1500)
          : '';
      if (!template) return null;

      const trigger =
        typeof candidate.trigger === 'string' &&
        VALID_CUSTOM_RULE_TRIGGERS.includes(candidate.trigger as (typeof VALID_CUSTOM_RULE_TRIGGERS)[number])
          ? (candidate.trigger as (typeof VALID_CUSTOM_RULE_TRIGGERS)[number])
          : null;
      if (!trigger) return null;

      return {
        id:
          typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id.trim().slice(0, 120)
            : `rule-${index + 1}`,
        name:
          typeof candidate.name === 'string' && candidate.name.trim()
            ? candidate.name.trim().slice(0, 80)
            : `Regel ${index + 1}`,
        enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
        trigger,
        template,
      };
    })
    .filter((rule): rule is SanitizedCustomRule => !!rule);
};

const DEFAULT_TASK_CREATED_TEMPLATE =
  'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';
const DEFAULT_TASK_COMPLETED_TEMPLATE =
  'Aufgabe erledigt: "{taskTitle}"\nErledigt am: {completedAt}\nProjekt: {project}\nWichtigkeit: {priority}';
const DEFAULT_TASK_START_TEMPLATE =
  'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';
const DEFAULT_WEEKLY_TEMPLATE = 'Wochenrueckblick ({weekRange})\n\n{review}';
const DEFAULT_EVENT_ATTENDED_TEMPLATE =
  'Anwesenheit bestaetigt: "{eventTitle}"\nZeit: {eventStart} - {eventEnd}\nDatum: {eventDate}';

const USER_SCOPED_TABLES_FOR_DELETE = [
  'notification_deliveries',
  'time_entries',
  'focus_sessions',
  'calendar_events',
  'tasks',
  'habits',
  'habit_categories',
  'journal_entries',
  'notes',
  'tags',
  'brainstorm_sessions',
  'daily_stats',
  'weekly_reflections',
  'projects',
  'goals',
  'notification_settings',
] as const;

const authenticateUser = async (request: NextRequest): Promise<AuthenticatedUserResult> => {
  const accessToken = parseBearerToken(request);
  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Nicht autorisiert (Bearer Token fehlt).' }, { status: 401 }),
    };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token ist ungueltig oder abgelaufen.' }, { status: 401 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
    supabaseAdmin,
  };
};

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabaseAdmin
      .from('notification_settings')
      .select(
        [
          'profile_name',
          'profile_email',
          'sms_reminders_enabled',
          'sms_phone_number',
          'sms_lead_minutes',
          'whatsapp_reminders_enabled',
          'whatsapp_phone_number',
          'whatsapp_task_created_enabled',
          'whatsapp_task_completed_enabled',
          'whatsapp_task_start_reminder_enabled',
          'whatsapp_weekly_review_enabled',
          'whatsapp_event_attended_enabled',
          'whatsapp_weekly_review_time',
          'whatsapp_task_created_template',
          'whatsapp_task_completed_template',
          'whatsapp_task_start_template',
          'whatsapp_weekly_review_template',
          'whatsapp_event_attended_template',
          'whatsapp_custom_rules',
          'week_starts_on_monday',
          'timezone',
          'settings_snapshot',
        ].join(', ')
      )
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load notification settings:', error);
      return NextResponse.json(
        { error: 'Benachrichtigungseinstellungen konnten nicht geladen werden.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        ok: true,
        settings: null,
        settingsSnapshot: null,
      });
    }

    const row = data as unknown as NotificationSettingsRow;

    return NextResponse.json({
      ok: true,
      settingsSnapshot: isPlainObject(row.settings_snapshot) ? row.settings_snapshot : null,
      settings: {
        name: row.profile_name || '',
        email: row.profile_email || '',
        smsRemindersEnabled: row.sms_reminders_enabled === true,
        smsPhoneNumber: row.sms_phone_number || '',
        smsLeadMinutes: typeof row.sms_lead_minutes === 'number' ? row.sms_lead_minutes : 30,
        whatsappRemindersEnabled: row.whatsapp_reminders_enabled === true,
        whatsappPhoneNumber: row.whatsapp_phone_number || '',
        whatsappTaskCreatedEnabled: row.whatsapp_task_created_enabled !== false,
        whatsappTaskCompletedEnabled: row.whatsapp_task_completed_enabled !== false,
        whatsappTaskStartReminderEnabled: row.whatsapp_task_start_reminder_enabled !== false,
        whatsappWeeklyReviewEnabled: row.whatsapp_weekly_review_enabled !== false,
        whatsappEventAttendedEnabled: row.whatsapp_event_attended_enabled !== false,
        whatsappWeeklyReviewTime: row.whatsapp_weekly_review_time || '22:00',
        whatsappTaskCreatedTemplate: row.whatsapp_task_created_template || DEFAULT_TASK_CREATED_TEMPLATE,
        whatsappTaskCompletedTemplate: row.whatsapp_task_completed_template || DEFAULT_TASK_COMPLETED_TEMPLATE,
        whatsappTaskStartTemplate: row.whatsapp_task_start_template || DEFAULT_TASK_START_TEMPLATE,
        whatsappWeeklyReviewTemplate: row.whatsapp_weekly_review_template || DEFAULT_WEEKLY_TEMPLATE,
        whatsappEventAttendedTemplate:
          row.whatsapp_event_attended_template || DEFAULT_EVENT_ATTENDED_TEMPLATE,
        whatsappCustomRules: Array.isArray(row.whatsapp_custom_rules) ? row.whatsapp_custom_rules : [],
        weekStartsOnMonday: row.week_starts_on_monday !== false,
      },
    });
  } catch (error) {
    console.error('Notification settings preload failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Laden der Benachrichtigungseinstellungen.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as SyncNotificationSettingsBody;

    const phoneNumberRaw = typeof body.whatsappPhoneNumber === 'string' ? body.whatsappPhoneNumber.trim() : '';
    const normalizedPhoneNumber = phoneNumberRaw.length > 0 ? phoneNumberRaw : null;

    if (normalizedPhoneNumber && !isValidE164PhoneNumber(normalizedPhoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige WhatsApp-Nummer. Bitte E.164 Format nutzen (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    const smsPhoneNumberRaw = typeof body.smsPhoneNumber === 'string' ? body.smsPhoneNumber.trim() : '';
    const normalizedSmsPhoneNumber = smsPhoneNumberRaw.length > 0 ? smsPhoneNumberRaw : null;

    if (normalizedSmsPhoneNumber && !isValidE164PhoneNumber(normalizedSmsPhoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige SMS-Nummer. Bitte E.164 Format nutzen (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    const settingsSnapshot = sanitizeSettingsSnapshot(body.settingsSnapshot);

    const payload: Record<string, unknown> = {
      user_id: auth.userId,
      profile_name: sanitizeName(body.name),
      profile_email: sanitizeEmail(body.email),
      sms_reminders_enabled: coerceBoolean(body.smsRemindersEnabled, false),
      sms_phone_number: normalizedSmsPhoneNumber,
      sms_lead_minutes: sanitizeLeadMinutes(body.smsLeadMinutes),
      whatsapp_reminders_enabled: coerceBoolean(body.whatsappRemindersEnabled, false),
      whatsapp_phone_number: normalizedPhoneNumber,
      whatsapp_task_created_enabled: coerceBoolean(body.whatsappTaskCreatedEnabled, true),
      whatsapp_task_completed_enabled: coerceBoolean(body.whatsappTaskCompletedEnabled, true),
      whatsapp_task_start_reminder_enabled: coerceBoolean(body.whatsappTaskStartReminderEnabled, true),
      whatsapp_weekly_review_enabled: coerceBoolean(body.whatsappWeeklyReviewEnabled, true),
      whatsapp_event_attended_enabled: coerceBoolean(body.whatsappEventAttendedEnabled, true),
      whatsapp_weekly_review_time: normalizeReminderTime(
        typeof body.whatsappWeeklyReviewTime === 'string' ? body.whatsappWeeklyReviewTime : '22:00',
        '22:00'
      ),
      whatsapp_task_created_template: sanitizeTemplate(
        body.whatsappTaskCreatedTemplate,
        DEFAULT_TASK_CREATED_TEMPLATE
      ),
      whatsapp_task_completed_template: sanitizeTemplate(
        body.whatsappTaskCompletedTemplate,
        DEFAULT_TASK_COMPLETED_TEMPLATE
      ),
      whatsapp_task_start_template: sanitizeTemplate(
        body.whatsappTaskStartTemplate,
        DEFAULT_TASK_START_TEMPLATE
      ),
      whatsapp_weekly_review_template: sanitizeTemplate(
        body.whatsappWeeklyReviewTemplate,
        DEFAULT_WEEKLY_TEMPLATE
      ),
      whatsapp_event_attended_template: sanitizeTemplate(
        body.whatsappEventAttendedTemplate,
        DEFAULT_EVENT_ATTENDED_TEMPLATE
      ),
      whatsapp_custom_rules: sanitizeCustomRules(body.whatsappCustomRules),
      week_starts_on_monday: coerceBoolean(body.weekStartsOnMonday, true),
      timezone: sanitizeTimezone(body.timezone),
      updated_at: new Date().toISOString(),
    };

    if (settingsSnapshot) {
      payload.settings_snapshot = settingsSnapshot;
    }

    const { error: upsertError } = await auth.supabaseAdmin.from('notification_settings').upsert(payload, {
      onConflict: 'user_id',
    });

    if (upsertError) {
      console.error('Failed to upsert notification settings:', upsertError);
      return NextResponse.json(
        { error: 'Benachrichtigungseinstellungen konnten nicht gespeichert werden.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Notification settings sync failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Sync der Benachrichtigungseinstellungen.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.ok) return auth.response;

    const summary: Record<string, number> = {};

    for (const tableName of USER_SCOPED_TABLES_FOR_DELETE) {
      const { error, count } = await auth.supabaseAdmin
        .from(tableName)
        .delete({ count: 'exact' })
        .eq('user_id', auth.userId);

      if (error) {
        return NextResponse.json(
          {
            error: `Daten in ${tableName} konnten nicht geloescht werden.`,
            details: error.message,
            partialSummary: summary,
          },
          { status: 500 }
        );
      }

      summary[tableName] = count ?? 0;
    }

    return NextResponse.json({ ok: true, deletedByTable: summary });
  } catch (error) {
    console.error('Delete-all endpoint failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Loeschen der Benutzerdaten.' },
      { status: 500 }
    );
  }
}
