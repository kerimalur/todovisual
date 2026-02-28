'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Mail, Lock, ArrowRight,
  CheckCircle2, Target, Repeat, LayoutDashboard,
  FolderKanban, TrendingUp, Calendar, Zap,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    label: 'Cockpit',
    desc: 'Tagesübersicht auf einen Blick',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: CheckCircle2,
    label: 'Aufgaben',
    desc: 'Priorisiert & strukturiert',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Target,
    label: 'Ziele',
    desc: 'Langfristige Vision',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Repeat,
    label: 'Gewohnheiten',
    desc: 'Tägliche Routinen',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Calendar,
    label: 'Kalender',
    desc: 'Termine & Planung',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
  },
  {
    icon: TrendingUp,
    label: 'Fortschritt',
    desc: 'Wachstum verfolgen',
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-500/10',
  },
];

const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6'];

function LoginForm() {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setEmailSent(true);
        setSigningIn(false);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentifizierung fehlgeschlagen.';
      setError(message);
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white animate-subtle-bounce">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <p className="text-white/50 text-sm">Wird geladen…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ══════════════════════════════════════════
          LEFT PANEL — Brand & Feature Preview
          (only visible on lg+ screens)
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col items-center justify-center p-12">

        {/* Animated background orbs */}
        <div className="absolute top-[15%] left-[10%] w-96 h-96 bg-indigo-600/12 rounded-full blur-3xl animate-orb pointer-events-none" />
        <div className="absolute bottom-[15%] right-[10%] w-72 h-72 bg-purple-600/12 rounded-full blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[55%] left-[45%] w-56 h-56 bg-blue-600/10 rounded-full blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '1.5s' }} />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-lg w-full">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 mb-12 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/60 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Productive</span>
          </div>

          {/* Headline */}
          <div className="mb-10 animate-fade-in-up stagger-1">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Dein persönliches<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-flow">
                Produktivitäts-
              </span>
              <br />Cockpit
            </h1>
            <p className="text-white/45 text-base leading-relaxed">
              Aufgaben, Ziele, Gewohnheiten und Termine — alles an einem Ort.
              Strukturiert, übersichtlich und effektiv.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className={`glass rounded-xl p-3.5 flex items-center gap-3 animate-fade-in-up ${staggerClasses[i]}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">{feature.label}</p>
                    <p className="text-white/38 text-xs leading-tight mt-0.5 truncate">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom badge */}
          <div className="mt-10 flex items-center gap-2 animate-fade-in stagger-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-white/30 text-xs">Sicher · Privat · Immer verfügbar</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Login Form
      ══════════════════════════════════════════ */}
      <div className="flex-1 lg:max-w-[440px] flex flex-col relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        {/* Desktop background */}
        <div className="absolute inset-0 hidden lg:block bg-gray-50" />

        {/* Mobile animated orbs */}
        <div className="absolute top-[10%] right-[5%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl lg:hidden animate-orb pointer-events-none" />
        <div className="absolute bottom-[10%] left-[5%] w-48 h-48 bg-purple-600/10 rounded-full blur-3xl lg:hidden animate-orb pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">

            {/* Mobile-only logo */}
            <div className="lg:hidden text-center mb-10 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-900/50 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Productive</h1>
              <p className="text-white/40 text-sm mt-1">Dein Produktivitäts-Cockpit</p>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden animate-fade-in-up stagger-2">

              {/* Card header */}
              <div className="px-8 pt-8 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                    {isSignUp ? 'Registrieren' : 'Anmelden'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {isSignUp
                    ? 'Starte deine Produktivitätsreise'
                    : 'Melde dich an, um fortzufahren'}
                </p>
              </div>

              <div className="px-8 py-6 space-y-4">
                {/* Error message */}
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 animate-scale-in">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-red-600 text-[10px] font-bold leading-none">!</span>
                    </div>
                    <p className="text-sm text-red-600 leading-snug">{error}</p>
                  </div>
                )}

                {/* Email confirmation */}
                {emailSent && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl animate-scale-in">
                    <p className="text-sm text-emerald-700 font-semibold">Bestätigungsmail gesendet!</p>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      Prüfe deine E-Mails und klicke auf den Bestätigungslink.
                    </p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      E-Mail Adresse
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="beispiel@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Passwort
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {signingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? 'Konto erstellen' : 'Anmelden'}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Card footer */}
              <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setEmailSent(false);
                  }}
                  className="w-full text-sm text-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isSignUp ? 'Bereits registriert? ' : 'Noch kein Konto? '}
                  <span className="font-semibold text-indigo-600 hover:text-indigo-700">
                    {isSignUp ? 'Anmelden' : 'Registrieren'}
                  </span>
                </button>
              </div>
            </div>

            <p className="text-center mt-6 text-xs text-white/25 lg:text-gray-400">
              © 2017–2026 Productive
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <p className="text-white/40 text-sm">Productive wird geladen…</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
