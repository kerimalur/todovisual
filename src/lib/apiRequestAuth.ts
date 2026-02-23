import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface ApiAuthSuccess {
  ok: true;
  authType: 'user' | 'secret';
  userId: string | null;
}

interface ApiAuthFailure {
  ok: false;
  response: NextResponse;
}

type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

let cachedAuthClient: SupabaseClient | null = null;

const parseBearerToken = (request: NextRequest): string | null => {
  const authorizationHeader = request.headers.get('authorization')?.trim() || '';
  if (!authorizationHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : null;
};

const resolveReminderSecret = (): string | null => {
  const secret =
    process.env.REMINDER_API_SECRET?.trim() || process.env.CRON_SECRET?.trim() || '';
  return secret.length > 0 ? secret : null;
};

const resolveSupabaseAuthConfig = (): { url: string; anonKey: string } | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

const getSupabaseAuthClient = (): SupabaseClient | null => {
  if (cachedAuthClient) return cachedAuthClient;

  const config = resolveSupabaseAuthConfig();
  if (!config) return null;

  cachedAuthClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAuthClient;
};

const isSecretAuthorized = (request: NextRequest, secret: string): boolean => {
  const secretHeader = request.headers.get('x-reminder-secret')?.trim() || '';
  if (secretHeader && secretHeader === secret) return true;

  const bearerToken = parseBearerToken(request);
  return !!bearerToken && bearerToken === secret;
};

export const requireApiUserOrSecret = async (request: NextRequest): Promise<ApiAuthResult> => {
  const secret = resolveReminderSecret();
  if (secret && isSecretAuthorized(request, secret)) {
    return {
      ok: true,
      authType: 'secret',
      userId: null,
    };
  }

  const bearerToken = parseBearerToken(request);
  if (!bearerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Nicht autorisiert. Bitte mit einem gueltigen Token anmelden.' },
        { status: 401 }
      ),
    };
  }

  const authClient = getSupabaseAuthClient();
  if (!authClient) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Supabase Auth ist nicht konfiguriert.' },
        { status: 500 }
      ),
    };
  }

  try {
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(bearerToken);

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Token ist ungueltig oder abgelaufen.' }, { status: 401 }),
      };
    }

    return {
      ok: true,
      authType: 'user',
      userId: user.id,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentifizierung konnte nicht geprueft werden.' },
        { status: 500 }
      ),
    };
  }
};

export const requireApiUser = async (request: NextRequest): Promise<ApiAuthResult> => {
  const auth = await requireApiUserOrSecret(request);
  if (!auth.ok) return auth;

  if (auth.authType !== 'user' || !auth.userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Ein angemeldeter Benutzer ist erforderlich.' },
        { status: 401 }
      ),
    };
  }

  return auth;
};

