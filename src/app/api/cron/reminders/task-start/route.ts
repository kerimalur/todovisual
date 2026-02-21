import { format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface NotificationSettingsRow {
  user_id: string;
  whatsapp_phone_number: string | null;
  timezone: string | null;
  whatsapp_task_start_template: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string;
  priority: TaskPriority;
  status: string;
  project_id: string | null;
  project_ids: string[] | null;
}

interface ProjectRow {
  id: string;
  title: string;
}

const REMINDER_TARGET_MINUTES = 60;
const WINDOW_TOLERANCE_MINUTES = 7;
const DEFAULT_TASK_START_TEMPLATE =
  'Start in 1 Stunde: "{taskTitle}"\nBeginn: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';

const isCronAuthorized = (request: NextRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization')?.trim();
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const customHeader = request.headers.get('x-cron-secret')?.trim();
  return customHeader === cronSecret;
};

const getProjectTitle = (task: TaskRow, projectsById: Map<string, string>): string => {
  const candidateIds: string[] = [];
  if (task.project_id) candidateIds.push(task.project_id);
  if (Array.isArray(task.project_ids)) {
    task.project_ids.forEach((id) => {
      if (id) candidateIds.push(id);
    });
  }

  for (const id of candidateIds) {
    const title = projectsById.get(id);
    if (title) return title;
  }

  return 'Kein Projekt';
};

const formatStartInTimezone = (date: Date, timezone: string | null): string => {
  const safeTimezone = timezone && timezone.length > 0 ? timezone : 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('de-DE', {
      timeZone: safeTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date).replace(',', '');
  } catch {
    return format(date, 'dd.MM.yyyy HH:mm');
  }
};

const buildTaskStartReminderMessage = (
  task: TaskRow,
  startAt: Date,
  timezone: string | null,
  projectTitle: string,
  templateRaw?: string | null
): string => {
  const priorityLabels: Record<TaskPriority, string> = {
    urgent: 'Dringend',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
  };

  const template = (templateRaw || '').trim() || DEFAULT_TASK_START_TEMPLATE;
  const renderedMessage = template
    .slice(0, 1500)
    .replace(/\{taskTitle\}/g, task.title)
    .replace(/\{startAt\}/g, `${formatStartInTimezone(startAt, timezone)} Uhr`)
    .replace(/\{project\}/g, projectTitle)
    .replace(/\{priority\}/g, priorityLabels[task.priority] || task.priority);
  if (renderedMessage.trim()) return renderedMessage;

  return DEFAULT_TASK_START_TEMPLATE
    .replace(/\{taskTitle\}/g, task.title)
    .replace(/\{startAt\}/g, `${formatStartInTimezone(startAt, timezone)} Uhr`)
    .replace(/\{project\}/g, projectTitle)
    .replace(/\{priority\}/g, priorityLabels[task.priority] || task.priority);
};

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
    console.error('Failed to update notification_deliveries status:', error);
  }
};

const loadProjectsById = async (userId: string, tasks: TaskRow[]): Promise<Map<string, string>> => {
  const projectIds = new Set<string>();
  tasks.forEach((task) => {
    if (task.project_id) projectIds.add(task.project_id);
    if (Array.isArray(task.project_ids)) {
      task.project_ids.forEach((projectId) => {
        if (projectId) projectIds.add(projectId);
      });
    }
  });

  if (projectIds.size === 0) return new Map<string, string>();

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, title')
    .eq('user_id', userId)
    .in('id', [...projectIds]);

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, string>((data as ProjectRow[]).map((project) => [project.id, project.title]));
};

const processTaskStartReminders = async () => {
  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();

  const windowStart = new Date(
    now.getTime() + (REMINDER_TARGET_MINUTES - WINDOW_TOLERANCE_MINUTES) * 60 * 1000
  );
  const windowEnd = new Date(
    now.getTime() + (REMINDER_TARGET_MINUTES + WINDOW_TOLERANCE_MINUTES) * 60 * 1000
  );

  const { data: settingsRows, error: settingsError } = await supabaseAdmin
    .from('notification_settings')
    .select('user_id, whatsapp_phone_number, timezone, whatsapp_task_start_template')
    .eq('whatsapp_reminders_enabled', true)
    .eq('whatsapp_task_start_reminder_enabled', true)
    .not('whatsapp_phone_number', 'is', null);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const rows = (settingsRows || []) as NotificationSettingsRow[];
  const summary = {
    usersChecked: rows.length,
    tasksMatched: 0,
    remindersSent: 0,
    remindersSkippedDuplicate: 0,
    remindersFailed: 0,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  };

  for (const setting of rows) {
    const userId = setting.user_id;
    const phoneNumber = setting.whatsapp_phone_number?.trim();
    if (!phoneNumber) continue;

    const { data: taskRows, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, due_date, priority, status, project_id, project_ids')
      .eq('user_id', userId)
      .in('status', ['todo', 'in-progress'])
      .gte('due_date', windowStart.toISOString())
      .lte('due_date', windowEnd.toISOString())
      .order('due_date', { ascending: true });

    if (taskError) {
      console.error(`Failed to load tasks for user ${userId}:`, taskError);
      continue;
    }

    const tasks = ((taskRows || []) as TaskRow[]).filter((task) => !!task.due_date);
    if (tasks.length === 0) continue;
    summary.tasksMatched += tasks.length;

    const projectsById = await loadProjectsById(userId, tasks);

    for (const task of tasks) {
      const startAt = new Date(task.due_date);
      if (Number.isNaN(startAt.getTime())) continue;

      const eventKey = `task-start:${task.id}:${startAt.toISOString()}`;
      const reserved = await reserveDeliverySlot(userId, eventKey, {
        taskId: task.id,
        dueDate: task.due_date,
      });

      if (!reserved) {
        summary.remindersSkippedDuplicate += 1;
        continue;
      }

      const projectTitle = getProjectTitle(task, projectsById);
      const message = buildTaskStartReminderMessage(
        task,
        startAt,
        setting.timezone,
        projectTitle,
        setting.whatsapp_task_start_template
      );

      try {
        await sendTwilioMessage({
          channel: 'whatsapp',
          to: phoneNumber,
          body: message,
        });

        await updateDeliveryStatus(eventKey, 'sent', {
          taskTitle: task.title,
          projectTitle,
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
          taskTitle: task.title,
          error: errorMessage,
        });
        summary.remindersFailed += 1;
      }
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

    const result = await processTaskStartReminders();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Task start reminder cron failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim serverseitigen Task-Reminder-Cron.' },
      { status: 500 }
    );
  }
}
