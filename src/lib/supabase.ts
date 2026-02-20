import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder.supabase.co') &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in deiner .env.local setzen.';

// Create a mock client for build time or when env vars are missing
const createSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseConfigured) {
    // Return a dummy client during build or if env vars are missing
    // This will be replaced with a real client at runtime
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl!, supabaseAnonKey!);
};

export const supabase = createSupabaseClient();

// Export types for auth
export type { Session, User } from '@supabase/supabase-js';
