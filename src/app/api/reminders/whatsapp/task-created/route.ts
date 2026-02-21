import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidE164PhoneNumber, sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskCreatedWhatsAppBody {
  phoneNumber?: string;
  taskTitle?: string;
  userId?: string;
  taskId?: string;
  taskStartAt?: string | null;
  priority?: TaskPriority;
  projectTitle?: string;
  messageTemplate?: string;
  timezone?: string;
}

const DEFAULT_TASK_CREATED_TEMPLATE =
  'Neue Aufgabe gespeichert: "{taskTitle}"\nStart: {startAt}\nProjekt: {project}\nWichtigkeit: {priority}';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Dringend',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const sanitizeTemplate = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_TASK_CREATED_TEMPLATE;
  const normalized = value.trim();
  if (!normalized) return DEFAULT_TASK_CREATED_TEMPLATE;
  return normalized.slice(0, 1500);
};

const hasSupabaseAdminEnv = (): boolean =>
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);

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
  if (!hasSupabaseAdminEnv()) return;
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
    console.error('Failed to update task-created notification delivery status:', error);
  }
};

const formatStartInTimezone = (startAtIso: string | null | undefined, timezone: string | undefined): string => {
  if (!startAtIso) return 'Nicht geplant';
  const startAt = new Date(startAtIso);
  if (Number.isNaN(startAt.getTime())) return 'Nicht geplant';

  const safeTimezone = timezone && timezone.trim().length > 0 ? timezone.trim() : 'UTC';
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
    return `${formatter.format(startAt).replace(',', '')} Uhr`;
  } catch {
    return `${format(startAt, 'dd.MM.yyyy HH:mm')} Uhr`;
  }
};

const applyTemplate = (
  template: string,
  values: Record<string, string>
): string => template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => values[key] || '');

export async function POST(request: NextRequest) {
  let deliveryEventKey = '';
  try {
    const body = (await request.json()) as TaskCreatedWhatsAppBody;
    const phoneNumber = body.phoneNumber?.trim() || '';
    const taskTitle = body.taskTitle?.trim() || '';
    const taskId = body.taskId?.trim() || '';
    const userId = body.userId?.trim() || '';
    const priorityLabel = PRIORITY_LABELS[body.priority || 'medium'] || 'Mittel';
    const projectTitle = body.projectTitle?.trim() || 'Kein Projekt';
    const template = sanitizeTemplate(body.messageTemplate);
    const startAtLabel = formatStartInTimezone(body.taskStartAt, body.timezone);
    const eventKey = taskId ? `task-created:${taskId}` : '';
    deliveryEventKey = eventKey;

    if (!isValidE164PhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige Telefonnummer. Bitte im E.164-Format senden (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    if (!taskTitle) {
      return NextResponse.json({ error: 'taskTitle fehlt.' }, { status: 400 });
    }

    if (userId && eventKey && hasSupabaseAdminEnv()) {
      const reserved = await reserveDeliverySlot(userId, eventKey, {
        taskId,
        taskTitle,
        projectTitle,
        priority: priorityLabel,
        startAt: body.taskStartAt || null,
      });
      if (!reserved) {
        return NextResponse.json({ ok: true, skippedDuplicate: true });
      }
    }

    const fallbackMessage = applyTemplate(DEFAULT_TASK_CREATED_TEMPLATE, {
      taskTitle,
      startAt: startAtLabel,
      project: projectTitle,
      priority: priorityLabel,
    });
    const renderedMessage = applyTemplate(template, {
      taskTitle,
      startAt: startAtLabel,
      project: projectTitle,
      priority: priorityLabel,
    });
    const message = renderedMessage.trim() ? renderedMessage : fallbackMessage;

    const twilioResult = await sendTwilioMessage({
      channel: 'whatsapp',
      to: phoneNumber,
      body: message,
    });

    if (eventKey) {
      await updateDeliveryStatus(eventKey, 'sent', {
        deliveredAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      messageSid: twilioResult.messageSid,
    });
  } catch (error) {
    if (deliveryEventKey) {
      await updateDeliveryStatus(deliveryEventKey, 'failed', {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    }

    if (error instanceof TwilioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Task-created WhatsApp endpoint failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Senden der Task-WhatsApp.' },
      { status: 500 }
    );
  }
}
