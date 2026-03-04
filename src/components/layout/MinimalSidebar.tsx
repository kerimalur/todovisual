'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Target,
  ChevronDown,
  Timer,
  Settings,
  Archive,
  Play,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  FolderKanban,
  TrendingUp,
  BookOpen,
  Repeat,
  StickyNote,
} from 'lucide-react';
import { useAppStore, useTimerStore, useDataStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const primaryNavItems = [
  { href: '/', label: 'Cockpit', icon: LayoutDashboard, color: 'from-violet-600 to-purple-600' },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo, color: 'from-emerald-500 to-teal-500' },
  { href: '/calendar', label: 'Kalender', icon: Calendar, color: 'from-blue-500 to-cyan-500' },
  { href: '/goals', label: 'Ziele', icon: Target, color: 'from-orange-500 to-amber-500' },
];

const secondaryNavItems = [
  { href: '/projects', label: 'Projekte', icon: FolderKanban, color: 'from-violet-500 to-indigo-500' },
  { href: '/habits', label: 'Gewohnheiten', icon: Repeat, color: 'from-pink-500 to-rose-500' },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp, color: 'from-red-500 to-orange-500' },
  { href: '/journal', label: 'Journal', icon: BookOpen, color: 'from-sky-500 to-blue-500' },
  { href: '/notes', label: 'Notizen', icon: StickyNote, color: 'from-amber-500 to-yellow-500' },
];

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: { href: string; label: string; icon: React.ElementType; color: string };
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-white'
          : 'text-white/55 hover:bg-white/06 hover:text-white/80'
      }`}
      style={isActive ? { background: 'rgba(255,255,255,0.08)' } : {}}
    >
      <span className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${item.color} flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        <Icon size={13} strokeWidth={2} className="text-white" />
      </span>
      <span className="truncate">{item.label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
      )}
    </Link>
  );
}

export function MinimalSidebar() {
  const pathname = usePathname();
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    toggleZenMode,
  } = useAppStore();
  const { timer } = useTimerStore();
  const { tasks } = useDataStore();
  const { user, signOut } = useAuth();

  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setShowMore(false);
  }, [pathname, setMobileSidebarOpen]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  const openTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').length,
    [tasks]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const isSecondaryActive = secondaryNavItems.some((item) => pathname === item.href);

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div className="h-13 flex items-center px-3 border-b border-white/08 flex-shrink-0" style={{ height: '52px' }}>
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-900/30 transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm">Productive</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            onClick={onClose}
          />
        ))}

        {/* Divider */}
        <div className="my-2 border-t border-white/06" />

        {/* More toggle */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
            isSecondaryActive ? 'text-white/80' : 'text-white/45'
          } hover:text-white/70`}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md flex items-center justify-center bg-white/08">
              <MoreHorizontal size={13} className="text-white/60" />
            </span>
            Mehr
          </span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 text-white/40 ${showMore ? 'rotate-180' : ''}`}
          />
        </button>

        {(showMore || isSecondaryActive) && (
          <div className="ml-1.5 space-y-0.5 animate-fade-in">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Timer Widget */}
      {timer.isRunning && (
        <div
          onClick={() => { onClose?.(); toggleZenMode(); }}
          className="mx-2.5 mb-2.5 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/15 transition-colors"
        >
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
            <Timer size={12} />
            <span>Fokus aktiv</span>
          </div>
          <div className="font-mono text-base font-bold text-emerald-300">
            {formatTime(timer.secondsRemaining)}
          </div>
        </div>
      )}

      {/* Focus Button */}
      {!timer.isRunning && (
        <div className="px-2.5 pb-2.5">
          <button
            onClick={() => { onClose?.(); toggleZenMode(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Play size={13} fill="currentColor" />
            Fokus starten
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/06 px-2.5 py-2 space-y-0.5 flex-shrink-0">
        <Link
          href="/archive"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/65 hover:bg-white/05 transition-all"
        >
          <Archive size={14} />
          <span>Archiv</span>
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/65 hover:bg-white/05 transition-all"
        >
          <Settings size={14} />
          <span>Einstellungen</span>
        </Link>
        {user && (
          <button
            type="button"
            onClick={() => { onClose?.(); signOut(); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={14} />
            <span>Abmelden</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ========== MOBILE HEADER ========== */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 border-b border-white/08"
        style={{ background: 'rgba(13,15,30,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-white/50 hover:text-white/80 hover:bg-white/08 transition-all"
          aria-label="Menü öffnen"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="font-semibold text-white text-sm">
          Productive
        </Link>

        {timer.isRunning ? (
          <button
            onClick={toggleZenMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
          >
            <Timer size={18} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* ========== MOBILE OVERLAY ========== */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          mobileSidebarOpen
            ? 'bg-black/65 opacity-100 backdrop-blur-sm'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={closeMobileSidebar}
      />

      {/* ========== MOBILE SIDEBAR ========== */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-[240px] z-50 flex flex-col transition-transform duration-300 border-r border-white/08 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0d0f1e' }}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/08">
          <span className="font-semibold text-white text-sm">Productive</span>
          <button
            onClick={closeMobileSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 hover:bg-white/08 transition-all"
            aria-label="Menü schließen"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <SidebarContent onClose={closeMobileSidebar} />
        </div>
      </aside>

      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-[196px] flex-col z-50 border-r border-white/08"
        style={{ background: '#0d0f1e' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
