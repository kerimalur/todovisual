import { endOfWeek, format, startOfWeek } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { Goal, Task } from '@/types';
import { normalizeReminderTime } from '@/lib/notificationPreferences';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';
import { buildWeeklyReviewMessage } from '@/lib/weeklyReviewMessage';

export const runtime = 'nodejs';

interface NotificationSettingsRow {
  user_id: string;
  whatsapp_phone_number: string | null;
  timezone: string | null;
  week_starts_on_monday: boolean;
  whatsapp_weekly_review_time: string | null;
  whatsapp_weekly_review_template: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  priority: Task['priority'];
  status: Task['status'];
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
  goal_id: string | null;
  goal_ids: string[] | null;
  tags: string[] | null;
}

interface GoalRow {
  id: string;
  title: string;
  progress: number | null;
  weekly_plan: unknown;
}

interface LocalDateTimeParts {
  weekday: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const WINDOW_TOLERANCE_MINUTES = 9;
const DEFAULT_WEEKLY_TEMPLATE = 'Wochenrueckblick ({weekRange})\n\n{review}';

const isCronAuthorized = (request: NextRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization')?.trim();
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const customHeader = request.headers.get('x-cron-secret')?.trim();
  return customHeader === cronSecret;
};

const getLocalDateTimeParts = (date: Date, timezone: string): LocalDateTimeParts | null => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const getPart = (type: string): string =>
      parts.find((part) => part.type === type)?.value || '';

    const weekdayLabel = getPart('weekday');
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const weekday = weekdayMap[weekdayLabel];
    const year = Number(getPart('year'));
    const month = Number(getPart('month'));
    const day = Number(getPart('day'));
    const hour = Number(getPart('hour'));
    const minute = Number(getPart('minute'));

    if (
      !Number.isFinite(weekday) ||
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute)
    ) {
      return null;
    }

    return { weekday, year, month, day, hour, minute };
  } catch {
    return null;
  }
};

const getWeeklyWindowInfo = (setting: NotificationSettingsRow, now: Date) => {
  const timezone = setting.timezone?.trim() || 'UTC';
  const localNow = getLocalDateTimeParts(now, timezone);
  if (!localNow) return null;
  if (localNow.weekday !== 0) return null;

  const [scheduledHour, scheduledMinute] = normalizeReminderTime(
    setting.whatsapp_weekly_review_time || '22:00',
    '22:00'
  )
    .split(':')
    .map(Number);

  const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
  const nowTotalMinutes = localNow.hour * 60 + localNow.minute;
  const inWindow =
    nowTotalMinutes >= scheduledTotalMinutes &&
    nowTotalMinutes <= scheduledTotalMinutes + WINDOW_TOLERANCE_MINUTES;

  if (!inWindow) return null;

  const weekStartsOn = setting.week_starts_on_monday ? 1 : 0;
  const localAnchorDate = new Date(Date.UTC(localNow.year, localNow.month - 1, localNow.day, 12, 0, 0));
  const weekStart = startOfWeek(localAnchorDate, { weekStartsOn });
  const weekEnd = endOfWeek(localAnchorDate, { weekStartsOn });

  return {
    timezone,
    weekStartsOnMonday: setting.week_starts_on_monday,
    weekKey: format(weekStart, 'yyyy-MM-dd'),
    weekRange: `${format(weekStart, 'dd.MM')} - ${format(weekEnd, 'dd.MM')}`,
    weekAnchorDate: localAnchorDate,
  };
};

const sanitizeTemplate = (templateRaw: string | null | undefined): string => {
  const normalized = (templateRaw || '').trim();
  if (!normalized) return DEFAULT_WEEKLY_TEMPLATE;
  return normalized.slice(0, 1800);
};

const applyTemplate = (template: string, values: Record<string, string>): string =>
  template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => values[key] || '');

const reserveDeliverySlot = async (
  userId: string,
  eventKey: string,
  meta: Record<string, unknown>
): Promise<boolean> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('notification_deliveries').insert({
    user_id: userId,
    channel: 'whatsapp',
    event_key: eventKey,
    status: 'pending',
    meta,
    sent_at: new Date().toISOString(),
  });

  if (!error) return true;
  if (error.code === '23505') return false;
  throw new Error(error.message);
};

const updateDeliveryStatus = async (
  eventKey: string,
  status: 'sent' | 'failed',
  metaPatch?: Record<string, unknown>
) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: rows } = await supabaseAdmin
    .from('notification_deliveries')
    .select('meta')
    .eq('channel', 'whatsapp')
    .eq('event_key', eventKey)
    .limit(1);

  const existingMeta = (rows?.[0]?.meta ?? {}) as Record<string, unknown>;
  const { error } = await supabaseAdmin
    .from('notification_deliveries')
    .update({
      status,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      meta: {
        ...existingMeta,
        ...(metaPatch || {}),
      },
    })
    .eq('channel', 'whatsapp')
    .eq('event_key', eventKey);

  if (error) {
    console.error('Failed to update weekly review delivery status:', error);
  }
};

const mapTaskRowToTask = (row: TaskRow, userId: string): Task => ({
  id: row.id,
  userId,
  title: row.title,
  description: undefined,
  dueDate: row.due_date ? new Date(row.due_date) : undefined,
  createdAt: new Date(row.created_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  priority: row.priority || 'medium',
  status: row.status || 'todo',
  tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
  goalId: row.goal_id || undefined,
  goalIds: Array.isArray(row.goal_ids) ? row.goal_ids.filter(Boolean) : undefined,
});

const mapGoalRowToGoal = (row: GoalRow, userId: string): Goal => ({
  id: row.id,
  userId,
  title: row.title,
  description: '',
  deadline: new Date(),
  createdAt: new Date(),
  progress: typeof row.progress === 'number' ? row.progress : 0,
  color: '#0f766e',
  weeklyPlan: Array.isArray(row.weekly_plan) ? (row.weekly_plan as Goal['weeklyPlan']) : [],
});

const processWeeklyReviews = async () => {
  const now = new Date();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: settingRows, error: settingError } = await supabaseAdmin
    .from('notification_settings')
    .select(
      'user_id, whatsapp_phone_number, timezone, week_starts_on_monday, whatsapp_weekly_review_time, whatsapp_weekly_review_template'
    )
    .eq('whatsapp_reminders_enabled', true)
    .eq('whatsapp_weekly_review_enabled', true)
    .not('whatsapp_phone_number', 'is', null);

  if (settingError) {
    throw new Error(settingError.message);
  }

  const settings = (settingRows || []) as NotificationSettingsRow[];
  const summary = {
    usersChecked: settings.length,
    usersInWindow: 0,
    remindersSent: 0,
    remindersSkippedDuplicate: 0,
    remindersFailed: 0,
  };

  for (const setting of settings) {
    const phoneNumber = setting.whatsapp_phone_number?.trim();
    if (!phoneNumber) continue;

    const windowInfo = getWeeklyWindowInfo(setting, now);
    if (!windowInfo) continue;
    summary.usersInWindow += 1;

    const eventKey = `weekly-review:${setting.user_id}:${windowInfo.weekKey}`;
    const reserved = await reserveDeliverySlot(setting.user_id, eventKey, {
      weekKey: windowInfo.weekKey,
      timezone: windowInfo.timezone,
    });

    if (!reserved) {
      summary.remindersSkippedDuplicate += 1;
      continue;
    }

    try {
      const [{ data: taskRows, error: taskError }, { data: goalRows, error: goalError }] = await Promise.all([
        supabaseAdmin
          .from('tasks')
          .select(
            'id, title, priority, status, due_date, created_at, completed_at, archived_at, goal_id, goal_ids, tags'
          )
          .eq('user_id', setting.user_id),
        supabaseAdmin.from('goals').select('id, title, progress, weekly_plan').eq('user_id', setting.user_id),
      ]);

      if (taskError) throw new Error(taskError.message);
      if (goalError) throw new Error(goalError.message);

      const tasks = ((taskRows || []) as TaskRow[]).map((task) =>
        mapTaskRowToTask(task, setting.user_id)
      );
      const goals = ((goalRows || []) as GoalRow[]).map((goal) =>
        mapGoalRowToGoal(goal, setting.user_id)
      );

      const reviewMessage = buildWeeklyReviewMessage({
        tasks,
        goals,
        now: windowInfo.weekAnchorDate,
        weekStartsOnMonday: windowInfo.weekStartsOnMonday,
      });

      const fallbackMessage = applyTemplate(DEFAULT_WEEKLY_TEMPLATE, {
        weekRange: windowInfo.weekRange,
        review: reviewMessage,
      });
      const renderedMessage = applyTemplate(
        sanitizeTemplate(setting.whatsapp_weekly_review_template),
        {
          weekRange: windowInfo.weekRange,
          review: reviewMessage,
        }
      );
      const message = (renderedMessage.trim() ? renderedMessage : fallbackMessage).slice(0, 1800);

      await sendTwilioMessage({
        channel: 'whatsapp',
        to: phoneNumber,
        body: message,
      });

      await updateDeliveryStatus(eventKey, 'sent', {
        deliveredAt: new Date().toISOString(),
      });
      summary.remindersSent += 1;
    } catch (error) {
      const errorMessage =
        error instanceof TwilioError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unbekannter Fehler';
      await updateDeliveryStatus(eventKey, 'failed', {
        error: errorMessage,
      });
      summary.remindersFailed += 1;
    }
  }

  return summary;
};

export async function GET(request: NextRequest) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET ist nicht gesetzt.' }, { status: 500 });
    }

    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    }

    const result = await processWeeklyReviews();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Weekly review cron failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim serverseitigen Wochenrueckblick-Cron.' },
      { status: 500 }
    );
  }
}
