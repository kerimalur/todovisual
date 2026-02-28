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
  Timer,
  Settings,
  Archive,
  ListTodo,
  Moon,
  Play,
  FolderKanban,
  Zap,
  CheckCircle2,
  Repeat,
  LogOut,
  StickyNote,
} from 'lucide-react';
import { useAppStore, useTimerStore, useDataStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { isToday } from 'date-fns';

const navItems = [
  { href: '/', label: 'Cockpit', icon: LayoutDashboard, description: 'Übersicht' },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo, description: 'Alle Tasks' },
  { href: '/habits', label: 'Gewohnheiten', icon: Repeat, description: 'Daily Habits' },
  { href: '/goals', label: 'Ziele', icon: Target, description: 'Zielverfolgung' },
  { href: '/projects', label: 'Projekte', icon: FolderKanban, description: 'Projekte' },
  { href: '/calendar', label: 'Kalender', icon: Calendar, description: 'Termine' },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp, description: 'Statistiken' },
  { href: '/journal', label: 'Journal', icon: BookOpen, description: 'Tagebuch' },
  { href: '/notes', label: 'Notizen', icon: StickyNote, description: 'Ideen & Notizen' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleZenMode, toggleZenWorkspace } = useAppStore();
  const { timer } = useTimerStore();
  const { tasks } = useDataStore();
  const { user, signOut } = useAuth();

  const stats = useMemo(() => {
    const completedToday = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    ).length;
    const pendingToday = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && isToday(new Date(t.dueDate))
    ).length;
    return { completedToday, pendingToday };
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tooltipClass =
    'absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 shadow-xl';
  const tooltipArrow =
    'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900';

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 flex flex-col z-50 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-white border-r border-gray-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50/70 pointer-events-none" />

      {/* ── Logo / Header ── */}
      <div className="relative h-16 flex items-center justify-between px-4 border-b border-gray-100/80">
        <Link href="/" className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-300/40 transition-transform duration-200 hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-gray-900 text-lg tracking-tight truncate animate-fade-in">
              Productive
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Erweitern' : 'Minimieren'}
          className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 ${
            sidebarCollapsed ? 'rotate-180' : ''
          } ${sidebarCollapsed ? 'absolute -right-3.5 top-4 shadow-sm' : ''}`}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* ── Quick Stats ── */}
      {!sidebarCollapsed && (
        <div className="relative px-3 pt-3 animate-fade-in">
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gradient-to-r from-indigo-50/90 to-purple-50/60 rounded-xl border border-indigo-100/70">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{stats.completedToday}</span>
              <span className="text-xs text-gray-400 hidden xl:inline">erledigt</span>
            </div>
            <div className="w-px h-4 bg-indigo-200/60 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Zap size={12} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{stats.pendingToday}</span>
              <span className="text-xs text-gray-400 hidden xl:inline">offen</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-3">
        {!sidebarCollapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Navigation
          </p>
        )}

        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white nav-active-glow'
                    : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <div
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-white' : ''
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                </div>

                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                {/* Active indicator dot (collapsed) */}
                {sidebarCollapsed && isActive && (
                  <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}

                {/* Tooltip (collapsed) */}
                {sidebarCollapsed && (
                  <div className={tooltipClass}>
                    {item.label}
                    <div className={tooltipArrow} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Timer Widget ── */}
      {timer.isRunning && (
        <div className="relative mx-3 mb-2 animate-fade-in">
          <div
            onClick={toggleZenMode}
            className={`p-3.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl cursor-pointer hover:from-emerald-400 hover:to-green-500 transition-all shadow-md shadow-emerald-300/30 hover:shadow-emerald-300/50 ${
              sidebarCollapsed ? 'flex items-center justify-center' : ''
            }`}
          >
            <div className={`flex items-center gap-2 text-white/90 text-xs font-semibold ${sidebarCollapsed ? '' : 'mb-1.5'}`}>
              <Timer size={13} className="animate-timer-ping flex-shrink-0" />
              {!sidebarCollapsed && <span>Fokus läuft</span>}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="font-mono font-bold text-white text-xl">
                  {formatTime(timer.secondsRemaining)}
                </div>
                <div className="h-1 bg-white/25 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{
                      width: `${((timer.totalSeconds - timer.secondsRemaining) / timer.totalSeconds) * 100}%`,
                    }}
                  />
                </div>
              </>
            )}
            {sidebarCollapsed && (
              <div className="font-mono font-bold text-white text-sm mt-1">
                {formatTime(timer.secondsRemaining)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="relative p-3 space-y-1.5">
        <button
          onClick={toggleZenMode}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-300/30 hover:shadow-indigo-400/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 ${
            sidebarCollapsed ? 'px-0' : ''
          }`}
        >
          <Play size={17} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Fokus starten</span>}
        </button>

        {!sidebarCollapsed && (
          <button
            onClick={toggleZenWorkspace}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-medium rounded-xl transition-all duration-200 active:scale-[0.99]"
          >
            <Moon size={15} />
            <span>Zen Mode</span>
          </button>
        )}
      </div>

      {/* ── User Info & Footer ── */}
      <div className="relative border-t border-gray-100">
        {/* User info row */}
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
                {user.user_metadata?.full_name?.[0] ||
                  user.user_metadata?.name?.[0] ||
                  user.email?.[0]?.toUpperCase() ||
                  'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className="p-3 space-y-0.5">
          <Link
            href="/archive"
            className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Archive size={16} />
            {!sidebarCollapsed && <span>Archiv</span>}
            {sidebarCollapsed && (
              <div className={tooltipClass}>
                Archiv
                <div className={tooltipArrow} />
              </div>
            )}
          </Link>

          <Link
            href="/settings"
            className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>Einstellungen</span>}
            {sidebarCollapsed && (
              <div className={tooltipClass}>
                Einstellungen
                <div className={tooltipArrow} />
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Abmelden</span>}
            {sidebarCollapsed && (
              <div className={tooltipClass}>
                Abmelden
                <div className={tooltipArrow} />
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
