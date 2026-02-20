import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle errors
  if (error) {
    console.error('Auth error:', error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Supabase ist nicht konfiguriert.')}`, request.url)
    );
  }

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      // Redirect to home page on successful auth
      return NextResponse.redirect(new URL('/', request.url));
    } catch (err) {
      console.error('Unexpected auth error:', err);
      return NextResponse.redirect(
        new URL('/login?error=unexpected_error', request.url)
      );
    }
  }

  // No code provided
  return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url));
}
