import { NextRequest, NextResponse } from 'next/server';
import { isValidE164PhoneNumber, sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

interface TaskCreatedWhatsAppBody {
  phoneNumber?: string;
  taskTitle?: string;
}

const buildTaskCreatedMessage = (taskTitle: string) =>
  `Neue Aufgabe gespeichert: "${taskTitle}". Kurz planen und direkt starten.`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TaskCreatedWhatsAppBody;
    const phoneNumber = body.phoneNumber?.trim() || '';
    const taskTitle = body.taskTitle?.trim() || '';

    if (!isValidE164PhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige Telefonnummer. Bitte im E.164-Format senden (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    if (!taskTitle) {
      return NextResponse.json({ error: 'taskTitle fehlt.' }, { status: 400 });
    }

    const twilioResult = await sendTwilioMessage({
      channel: 'whatsapp',
      to: phoneNumber,
      body: buildTaskCreatedMessage(taskTitle),
    });

    return NextResponse.json({
      ok: true,
      messageSid: twilioResult.messageSid,
    });
  } catch (error) {
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
