import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface SmsRequestBody {
  phoneNumber?: string;
  message?: string;
  reminderTime?: string;
}

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const buildDefaultMessage = (reminderTime?: string) => {
  if (reminderTime) {
    return `Erinnerung: Heute um ${reminderTime} Uhr steht deine Planung an.`;
  }
  return 'Erinnerung: Bitte pruefe heute deine offenen Aufgaben und Termine.';
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SmsRequestBody;
    const phoneNumber = body.phoneNumber?.trim() || '';
    const message = body.message?.trim() || buildDefaultMessage(body.reminderTime);

    if (!E164_PHONE_REGEX.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Ungueltige Telefonnummer. Bitte im E.164-Format senden (z.B. +491234567890).' },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          error:
            'Twilio ist nicht konfiguriert. Bitte TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN und TWILIO_FROM_NUMBER setzen.',
        },
        { status: 500 }
      );
    }

    const payload = new URLSearchParams({
      To: phoneNumber,
      From: fromNumber,
      Body: message,
    });

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
        cache: 'no-store',
      }
    );

    const twilioResult = await twilioResponse.json();
    if (!twilioResponse.ok) {
      console.error('Twilio SMS error:', twilioResult);
      return NextResponse.json(
        { error: twilioResult?.message || 'Twilio konnte die SMS nicht senden.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageSid: twilioResult.sid as string | undefined,
    });
  } catch (error) {
    console.error('SMS test endpoint failed:', error);
    return NextResponse.json({ error: 'Interner Fehler beim Senden der Test-SMS.' }, { status: 500 });
  }
}
