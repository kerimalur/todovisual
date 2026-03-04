'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Mail, Shield } from 'lucide-react';

function LoginForm() {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) setError(decodeURIComponent(errorParam));
  }, [searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Bitte E-Mail und Passwort eingeben.'); return; }
    setSigningIn(true); setError(null);
    try {
      if (isSignUp) { await signUpWithEmail(email, password); setEmailSent(true); setSigningIn(false); }
      else { await signInWithEmail(email, password); }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentifizierung fehlgeschlagen.';
      setError(message);
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f1e' }}>
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: '#0d0f1e' }}>
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-orb"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl animate-orb"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl animate-orb"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animationDelay: '-2s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl shadow-violet-900/50 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Productive</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Dein persönliches Produktivitäts-Cockpit
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            {isSignUp ? 'Konto erstellen' : 'Anmelden'}
          </h2>

          {error && (
            <div className="mb-5 p-4 rounded-xl border border-red-500/25 bg-red-500/10">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {emailSent && (
            <div className="mb-5 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <p className="text-sm font-medium text-emerald-400">Bestätigungsmail gesendet!</p>
              <p className="text-sm text-emerald-400/70 mt-1">Prüfe deine E-Mails und klicke auf den Link.</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">E-Mail Adresse</label>
              <input
                type="email"
                placeholder="beispiel@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-white rounded-xl border border-white/10 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-white rounded-xl border border-white/10 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                  title={showPassword ? 'Ausblenden' : 'Anzeigen'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              {signingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail size={16} />
                  {isSignUp ? 'Registrieren' : 'Anmelden'}
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setEmailSent(false); }}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Konto? Registrieren'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <Shield size={12} />
          <span className="text-xs">Sicher · Privat · Immer verfügbar</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f1e' }}>
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
