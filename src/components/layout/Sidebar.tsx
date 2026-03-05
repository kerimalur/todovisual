'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Calendar,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Timer,
  Settings,
  Archive,
  ListTodo,
  Moon,
  Play,
  FolderKanban,
  Zap,
  Star,
  Repeat,
  LogOut,
  StickyNote,
} from 'lucide-react';
import { useAppStore, useTimerStore, useDataStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { isToday } from 'date-fns';

const navItems = [
  { href: '/', label: 'Uebersicht', icon: LayoutDashboard },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo },
  { href: '/habits', label: 'Gewohnheiten', icon: Repeat },
  { href: '/goals', label: 'Ziele', icon: Target },
  { href: '/projects', label: 'Projekte', icon: FolderKanban },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp },
  { href: '/journal', label: 'Tagebuch', icon: BookOpen },
  { href: '/notes', label: 'Notizen', icon: StickyNote },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleZenMode, toggleZenWorkspace } = useAppStore();
  const { timer } = useTimerStore();
  const { tasks } = useDataStore();
  const { user, signOut } = useAuth();

  const stats = useMemo(() => {
    const completedToday = tasks.filter(
      (task) => task.status === 'completed' && task.completedAt && isToday(new Date(task.completedAt))
    ).length;

    const pendingToday = tasks.filter(
      (task) => task.status !== 'completed' && task.dueDate && isToday(new Date(task.dueDate))
    ).length;

    return { completedToday, pendingToday };
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Nutzer';

  const initials = (displayName?.[0] || user?.email?.[0] || 'N').toUpperCase();

  return (
    <aside
      className={`
        hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col
        border-r border-slate-200/80 backdrop-blur-xl
        transition-[width] duration-300
        ${sidebarCollapsed ? 'w-[84px]' : 'w-[210px]'}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(251,252,255,0.95) 0%, rgba(243,246,255,0.96) 100%)',
      }}
    >
      <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200/80">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-950/40">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
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
          {!sidebarCollapsed && <span className="font-semibold text-slate-800 text-base truncate">Productive</span>}
        </Link>

        <button
          onClick={toggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={sidebarCollapsed ? 'Erweitern' : 'Einfahren'}
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="mx-2.5 mt-3 rounded-xl border border-slate-200 px-3 py-2.5 bg-white/80">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Star size={13} className="text-amber-300" />
            <span>{stats.completedToday} erledigt</span>
            <span className="text-slate-300">|</span>
            <Zap size={13} className="text-sky-300" />
            <span>{stats.pendingToday} offen</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-2 text-[11px] uppercase tracking-wide text-slate-400 mb-2">Navigation</p>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl h-11 transition-colors border
                  ${
                    isActive
                      ? 'border-violet-300/60 bg-violet-100 text-violet-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-200 hover:bg-white'
                  }
                  ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} className="flex-shrink-0" />

                {!sidebarCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}

                {sidebarCollapsed && (
                  <span
                    className="
                      absolute left-[calc(100%+10px)] px-2.5 py-1.5 rounded-lg text-xs
                      border border-slate-200 bg-white text-slate-700 whitespace-nowrap shadow-sm
                      opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity
                    "
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {timer.isRunning && (
        <button
          type="button"
          onClick={toggleZenMode}
          className={`mx-2.5 mb-2.5 rounded-xl border border-emerald-300/50 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left ${
            sidebarCollapsed ? 'px-0 py-3 flex items-center justify-center' : 'px-3 py-2.5'
          }`}
        >
          {sidebarCollapsed ? (
            <Timer size={18} className="text-emerald-700" />
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1.5">
                <Timer size={13} />
                Fokus aktiv
              </div>
              <p className="font-mono text-lg font-semibold text-emerald-800 leading-none">{formatTime(timer.secondsRemaining)}</p>
            </>
          )}
        </button>
      )}

      <div className="border-t border-slate-200 p-2.5 space-y-2">
        <button
          onClick={toggleZenMode}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
            sidebarCollapsed ? 'px-0' : ''
          }`}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b7cff)' }}
        >
          <Play size={16} />
          {!sidebarCollapsed && 'Fokus starten'}
        </button>

        {!sidebarCollapsed && (
          <button
            onClick={toggleZenWorkspace}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Moon size={15} />
            Fokusraum
          </button>
        )}
      </div>

      <div className="border-t border-slate-200 p-2.5 space-y-1">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 mb-1 border border-slate-200 bg-white/85">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-800 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Link
          href="/archive"
          className={`relative flex items-center gap-3 h-10 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-colors group ${
            sidebarCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <Archive size={16} />
          {!sidebarCollapsed && <span>Archiv</span>}
          {sidebarCollapsed && (
            <span className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-sm">
              Archiv
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className={`relative flex items-center gap-3 h-10 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-colors group ${
            sidebarCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <Settings size={16} />
          {!sidebarCollapsed && <span>Einstellungen</span>}
          {sidebarCollapsed && (
            <span className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-sm">
              Einstellungen
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => signOut()}
          className={`relative w-full flex items-center gap-3 h-10 rounded-xl text-sm text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors group ${
            sidebarCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Abmelden</span>}
          {sidebarCollapsed && (
            <span className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-sm">
              Abmelden
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
