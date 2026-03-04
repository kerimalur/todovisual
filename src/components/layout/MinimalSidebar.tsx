'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Target,
  Timer,
  Settings,
  Archive,
  Play,
  LogOut,
  Menu,
  X,
  FolderKanban,
  TrendingUp,
  BookOpen,
  Repeat,
  StickyNote,
} from 'lucide-react';
import { useAppStore, useTimerStore, useDataStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', label: 'Uebersicht', icon: LayoutDashboard, color: 'from-indigo-500 to-violet-500' },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo, color: 'from-emerald-500 to-teal-500' },
  { href: '/habits', label: 'Gewohnheiten', icon: Repeat, color: 'from-pink-500 to-fuchsia-500' },
  { href: '/goals', label: 'Ziele', icon: Target, color: 'from-amber-500 to-orange-500' },
  { href: '/projects', label: 'Projekte', icon: FolderKanban, color: 'from-violet-500 to-indigo-500' },
  { href: '/calendar', label: 'Kalender', icon: Calendar, color: 'from-sky-500 to-blue-500' },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp, color: 'from-rose-500 to-red-500' },
  { href: '/journal', label: 'Tagebuch', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { href: '/notes', label: 'Notizen', icon: StickyNote, color: 'from-yellow-500 to-amber-500' },
];

function MobileNavLink({
  href,
  label,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors
        ${
          active
            ? 'border-violet-300/45 bg-violet-300/20 text-[#f8f7ff]'
            : 'border-transparent text-white/70 hover:text-white hover:border-white/10 hover:bg-white/8'
        }
      `}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${color}`}>
        <Icon size={14} className="text-white" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export function MinimalSidebar() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, toggleZenMode } = useAppStore();
  const { timer } = useTimerStore();
  const { tasks } = useDataStore();
  const { user, signOut } = useAuth();

  const openTasksCount = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived').length,
    [tasks]
  );

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const closeSidebar = () => setMobileSidebarOpen(false);

  return (
    <>
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 border-b border-white/10"
        style={{
          background:
            'linear-gradient(90deg, rgba(28,34,74,0.96) 0%, rgba(20,25,58,0.96) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Navigation oeffnen"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="text-sm font-semibold text-[#f4f6ff]">
          Productive
        </Link>

        {timer.isRunning ? (
          <button
            onClick={toggleZenMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"
            title="Fokus oeffnen"
          >
            <Timer size={17} />
          </button>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-250 ${
          mobileSidebarOpen ? 'opacity-100 bg-[#030511]/70 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      <aside
        className={`
          md:hidden fixed left-0 top-0 bottom-0 z-50 w-[268px] border-r border-white/10
          transition-transform duration-300 flex flex-col
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background:
            'linear-gradient(180deg, rgba(28,34,74,0.98) 0%, rgba(18,22,49,0.97) 100%)',
        }}
      >
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/35">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-[#f4f6ff]">Productive</span>
          </Link>

          <button
            onClick={closeSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Navigation schliessen"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              color={item.color}
              active={pathname === item.href}
              onClick={closeSidebar}
            />
          ))}
        </div>

        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-2.5">
            <p className="text-xs text-white/45">Offene Aufgaben</p>
            <p className="text-lg leading-none font-semibold text-white mt-1">{openTasksCount}</p>
          </div>

          <button
            onClick={() => {
              closeSidebar();
              toggleZenMode();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b7cff)' }}
          >
            <Play size={15} />
            Fokus starten
          </button>

          <Link
            href="/archive"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Archive size={15} />
            Archiv
          </Link>
          <Link
            href="/settings"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Settings size={15} />
            Einstellungen
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-300 hover:text-red-200 hover:bg-red-500/15 transition-colors"
            >
              <LogOut size={15} />
              Abmelden
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
