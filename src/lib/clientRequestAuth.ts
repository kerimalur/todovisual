import { supabase } from '@/lib/supabase';

type HeaderInput = Record<string, string> | undefined;

const normalizeHeaders = (headers?: HeaderInput): Record<string, string> => ({
  ...(headers || {}),
});

export const buildAuthorizedHeaders = async (
  headers?: HeaderInput
): Promise<Record<string, string>> => {
  const nextHeaders = normalizeHeaders(headers);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      nextHeaders.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Ignore auth lookup failures and return headers as-is.
  }

  return nextHeaders;
};

