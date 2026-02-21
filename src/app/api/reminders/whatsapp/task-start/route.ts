import { NextRequest, NextResponse } from 'next/server';
import { isValidE164PhoneNumber, sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';

export const runtime = 'nodejs';

interface TaskStartReminderRequestBody {
  phoneNumber?: string;
  message?: string;
}

const buildFallbackMessage = () =>
  'Erinnerung: Deine geplante Aufgabe startet in 1 Stunde.';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TaskStartReminderRequestBody;
    const phoneNumber = body.phoneNumber?.trim() || '';
    const message = body.message?.trim() || buildFallbackMessage();

    if (!isValidE164PhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige Telefonnummer. Bitte im E.164-Format senden (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    const twilioResult = await sendTwilioMessage({
      channel: 'whatsapp',
      to: phoneNumber,
      body: message,
    });

    return NextResponse.json({
      ok: true,
      messageSid: twilioResult.messageSid,
    });
  } catch (error) {
    if (error instanceof TwilioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Task-start WhatsApp endpoint failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Senden der Start-Erinnerung.' },
      { status: 500 }
    );
  }
}
