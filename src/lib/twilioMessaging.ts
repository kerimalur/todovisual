const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

type MessagingChannel = 'sms' | 'whatsapp';

interface SendTwilioMessageInput {
  channel: MessagingChannel;
  to: string;
  body: string;
}

interface TwilioApiResponse {
  sid?: string;
  message?: string;
}

class TwilioError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'TwilioError';
    this.status = status;
  }
}

const ensureE164Phone = (value: string): string => {
  const normalized = value.trim().replace(/^whatsapp:/i, '');
  if (!E164_PHONE_REGEX.test(normalized)) {
    throw new TwilioError(
      'Ungueltige Telefonnummer. Bitte E.164 Format nutzen (z.B. +491234567890).',
      400
    );
  }
  return normalized;
};

const asWhatsAppAddress = (phone: string) => `whatsapp:${phone}`;

const resolveTwilioFrom = (channel: MessagingChannel): string => {
  if (channel === 'sms') {
    const smsFrom = process.env.TWILIO_FROM_NUMBER?.trim();
    if (!smsFrom) {
      throw new TwilioError(
        'Twilio SMS ist nicht konfiguriert. Bitte TWILIO_FROM_NUMBER setzen.',
        500
      );
    }
    if (smsFrom.toLowerCase().startsWith('whatsapp:')) {
      throw new TwilioError(
        'TWILIO_FROM_NUMBER darf fuer SMS nicht mit "whatsapp:" beginnen.',
        500
      );
    }
    return smsFrom;
  }

  const whatsappFrom =
    process.env.TWILIO_WHATSAPP_FROM?.trim() || process.env.TWILIO_FROM_NUMBER?.trim();
  if (!whatsappFrom) {
    throw new TwilioError(
      'Twilio WhatsApp ist nicht konfiguriert. Bitte TWILIO_WHATSAPP_FROM setzen.',
      500
    );
  }

  return whatsappFrom.toLowerCase().startsWith('whatsapp:')
    ? whatsappFrom
    : asWhatsAppAddress(ensureE164Phone(whatsappFrom));
};

const resolveTwilioCredentials = (): { accountSid: string; authToken: string } => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new TwilioError(
      'Twilio ist nicht konfiguriert. Bitte TWILIO_ACCOUNT_SID und TWILIO_AUTH_TOKEN setzen.',
      500
    );
  }

  return { accountSid, authToken };
};

export const isValidE164PhoneNumber = (value: string): boolean => {
  return E164_PHONE_REGEX.test(value.trim().replace(/^whatsapp:/i, ''));
};

export const sendTwilioMessage = async ({
  channel,
  to,
  body,
}: SendTwilioMessageInput): Promise<{ messageSid?: string }> => {
  const { accountSid, authToken } = resolveTwilioCredentials();
  const toPhone = ensureE164Phone(to);
  const from = resolveTwilioFrom(channel);
  const toAddress = channel === 'whatsapp' ? asWhatsAppAddress(toPhone) : toPhone;

  const payload = new URLSearchParams({
    To: toAddress,
    From: from,
    Body: body,
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

  const result = (await twilioResponse
    .json()
    .catch(() => ({}))) as TwilioApiResponse;

  if (!twilioResponse.ok) {
    throw new TwilioError(
      result.message || 'Twilio konnte die Nachricht nicht senden.',
      twilioResponse.status
    );
  }

  return {
    messageSid: result.sid,
  };
};

export { TwilioError };
