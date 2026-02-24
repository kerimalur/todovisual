'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';

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
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
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
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : 'Authentifizierung fehlgeschlagen.';
      setError(message);
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl animate-[floatOrbA_9s_ease-in-out_infinite]" />
        <div className="absolute top-10 right-0 h-40 w-40 rounded-full bg-fuchsia-200/35 blur-3xl animate-[floatOrbB_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-sky-200/35 blur-3xl animate-[floatOrbC_10s_ease-in-out_infinite]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-[fadeSlideIn_550ms_ease-out]">
          <div className="logoShell inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="brandTitle text-3xl font-bold mb-2">Productive</h1>
          <p className="text-gray-700">Melde dich an, um fortzufahren</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-gray-200 p-8 animate-[fadeSlideIn_700ms_ease-out]">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Anmelden</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {emailSent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 font-medium">Bestaetigungsmail gesendet!</p>
              <p className="text-sm text-green-600 mt-1">
                Pruefe deine E-Mails und klicke auf den Bestaetigungslink.
              </p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">E-Mail Adresse</label>
              <input
                type="email"
                placeholder="beispiel@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                  title={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail size={18} />
                  {isSignUp ? 'Registrieren' : 'Anmelden'}
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setEmailSent(false);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Konto? Registrieren'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-700">(c) 2017-2026</div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatOrbA {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(16px, 14px, 0);
          }
        }

        @keyframes floatOrbB {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-12px, 16px, 0);
          }
        }

        @keyframes floatOrbC {
          0%,
          100% {
            transform: translate3d(-50%, 0, 0);
          }
          50% {
            transform: translate3d(calc(-50% + 10px), -12px, 0);
          }
        }

        @keyframes logoPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }

        @keyframes brandShine {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        .logoShell {
          animation: logoPulse 5.6s ease-in-out infinite;
        }

        .brandTitle {
          color: transparent;
          background-image: linear-gradient(90deg, #111827 0%, #3730a3 45%, #111827 90%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: brandShine 5s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

