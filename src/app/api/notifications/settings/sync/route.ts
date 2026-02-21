import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { isValidE164PhoneNumber } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

interface SyncNotificationSettingsBody {
  whatsappRemindersEnabled?: boolean;
  whatsappPhoneNumber?: string;
  whatsappTaskCreatedEnabled?: boolean;
  whatsappTaskStartReminderEnabled?: boolean;
  whatsappWeeklyReviewEnabled?: boolean;
  whatsappWeeklyReviewTime?: string;
  whatsappTaskCreatedTemplate?: string;
  whatsappTaskStartTemplate?: string;
  whatsappWeeklyReviewTemplate?: string;
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

const DEFAULT_TASK_CREATED_TEMPLATE =
  'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';
const DEFAULT_TASK_START_TEMPLATE =
  'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';
const DEFAULT_WEEKLY_TEMPLATE = 'Wochenrueckblick ({weekRange})\n\n{review}';

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
      whatsapp_task_start_reminder_enabled: coerceBoolean(body.whatsappTaskStartReminderEnabled, true),
      whatsapp_weekly_review_enabled: coerceBoolean(body.whatsappWeeklyReviewEnabled, true),
      whatsapp_weekly_review_time: normalizeReminderTime(
        typeof body.whatsappWeeklyReviewTime === 'string' ? body.whatsappWeeklyReviewTime : '22:00',
        '22:00'
      ),
      whatsapp_task_created_template: sanitizeTemplate(
        body.whatsappTaskCreatedTemplate,
        DEFAULT_TASK_CREATED_TEMPLATE
      ),
      whatsapp_task_start_template: sanitizeTemplate(
        body.whatsappTaskStartTemplate,
        DEFAULT_TASK_START_TEMPLATE
      ),
      whatsapp_weekly_review_template: sanitizeTemplate(
        body.whatsappWeeklyReviewTemplate,
        DEFAULT_WEEKLY_TEMPLATE
      ),
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
