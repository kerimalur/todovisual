import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;

const getSupabaseAdminUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error('Supabase Admin URL fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_URL setzen.');
  }
  return url;
};

const getSupabaseServiceRoleKey = (): string => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in den Environment-Variablen setzen.');
  }
  return key;
};

export const getSupabaseAdmin = (): SupabaseClient => {
  if (cachedAdminClient) return cachedAdminClient;

  cachedAdminClient = createClient(getSupabaseAdminUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
};
