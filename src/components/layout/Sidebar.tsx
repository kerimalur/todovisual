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
  User,
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
    const completedToday = tasks.filter(t =>
      t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    ).length;

    const pendingToday = tasks.filter(t =>
      t.status !== 'completed' && t.dueDate && isToday(new Date(t.dueDate))
    ).length;

    return { completedToday, pendingToday };
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 flex-col z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
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
          {!sidebarCollapsed && <span className="font-bold text-gray-900 text-lg">Productive</span>}
        </Link>

        <button
          onClick={toggleSidebar}
          className={`w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all ${sidebarCollapsed ? 'absolute -right-3.5 top-6 shadow-sm' : ''}`}
          title={sidebarCollapsed ? 'Erweitern' : 'Minimieren'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Quick Stats */}
      {!sidebarCollapsed && (
        <div className="flex items-center gap-3 px-4 py-3 mx-3 mt-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Star size={14} className="text-amber-500" />
            <span className="font-medium">{stats.completedToday} erledigt</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Zap size={14} className="text-blue-500" />
            <span className="font-medium">{stats.pendingToday} offen</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {!sidebarCollapsed && <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Navigation</span>}
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <div className="flex-shrink-0">
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                </div>
                {!sidebarCollapsed && (
                  <span>{item.label}</span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Timer Widget */}
      {timer.isRunning && (
        <div 
          onClick={toggleZenMode}
          className="mx-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold mb-2">
            <Timer size={16} />
            {!sidebarCollapsed && <span>Fokus aktiv</span>}
          </div>
          <div className={`font-mono font-bold text-emerald-800 ${sidebarCollapsed ? 'text-lg' : 'text-2xl'}`}>
            {formatTime(timer.secondsRemaining)}
          </div>
          {!sidebarCollapsed && (
            <div className="h-1.5 bg-emerald-200 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((timer.totalSeconds - timer.secondsRemaining) / timer.totalSeconds) * 100}%` 
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3 space-y-2">
        <button 
          onClick={toggleZenMode} 
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all ${sidebarCollapsed ? 'px-0' : ''}`}
        >
          <Play size={18} />
          {!sidebarCollapsed && <span>Fokus starten</span>}
        </button>

        {!sidebarCollapsed && (
          <button 
            onClick={toggleZenWorkspace} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
          >
            <Moon size={16} />
            <span>Zen Mode</span>
          </button>
        )}
      </div>

      {/* User Info & Footer Links */}
      <div className="border-t border-gray-100">
        {/* User Info */}
        {!sidebarCollapsed && user && (
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {user.user_metadata?.full_name?.[0] || user.user_metadata?.name?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 space-y-1">
          <Link
            href="/archive"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Archive size={16} />
            {!sidebarCollapsed && <span>Archiv</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Archiv
              </div>
            )}
          </Link>

          <Link
            href="/settings"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>Einstellungen</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Einstellungen
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Abmelden</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Abmelden
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
