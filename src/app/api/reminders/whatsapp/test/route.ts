import { NextRequest, NextResponse } from 'next/server';
import { isValidE164PhoneNumber, sendTwilioMessage, TwilioError } from '@/lib/twilioMessaging';
import { requireApiUserOrSecret } from '@/lib/apiRequestAuth';

export const runtime = 'nodejs';

interface WhatsAppTestRequestBody {
  phoneNumber?: string;
  message?: string;
}

const buildDefaultMessage = () =>
  'WhatsApp Test erfolgreich. Deine Produktivitaets-Benachrichtigungen sind aktiv.';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUserOrSecret(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as WhatsAppTestRequestBody;
    const phoneNumber = body.phoneNumber?.trim() || '';
    const message = body.message?.trim() || buildDefaultMessage();

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

    console.error('WhatsApp test endpoint failed:', error);
    return NextResponse.json(
      { error: 'Interner Fehler beim Senden der Test-WhatsApp.' },
      { status: 500 }
    );
  }
}
