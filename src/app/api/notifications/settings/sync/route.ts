import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { isValidE164PhoneNumber } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

interface SyncNotificationSettingsBody {
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
}

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

export async function POST(request: NextRequest) {
  try {
    const accessToken = parseBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Nicht autorisiert (Bearer Token fehlt).' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token ist ungueltig oder abgelaufen.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as SyncNotificationSettingsBody;
    const phoneNumberRaw = typeof body.whatsappPhoneNumber === 'string' ? body.whatsappPhoneNumber.trim() : '';
    const normalizedPhoneNumber = phoneNumberRaw.length > 0 ? phoneNumberRaw : null;

    if (normalizedPhoneNumber && !isValidE164PhoneNumber(normalizedPhoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige WhatsApp-Nummer. Bitte E.164 Format nutzen (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    const payload = {
      user_id: user.id,
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

    const { error: upsertError } = await supabaseAdmin.from('notification_settings').upsert(payload, {
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
    return NextResponse.json({ error: 'Interner Fehler beim Sync der Benachrichtigungseinstellungen.' }, { status: 500 });
  }
}
