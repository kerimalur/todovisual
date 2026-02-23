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
import { isToday } from 'date-fns';

// Nur die wichtigsten 4 Navigationspunkte sichtbar
const primaryNavItems = [
  { href: '/', label: '\u00DCbersicht', icon: LayoutDashboard },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/goals', label: 'Ziele', icon: Target },
];

// Sekundäre Navigation unter "Mehr"
const secondaryNavItems = [
  { href: '/projects', label: 'Projekte', icon: FolderKanban },
  { href: '/habits', label: 'Gewohnheiten', icon: Repeat },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/notes', label: 'Notizen', icon: StickyNote },
];

function NavLink({ 
  item, 
  isActive, 
  onClick
}: { 
  item: { href: string; label: string; icon: React.ElementType }; 
  isActive: boolean; 
  onClick?: () => void;
}) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? 'bg-violet-600 text-white' 
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
      <span>{item.label}</span>
    </Link>
  );
}

export function MinimalSidebar() {
  const pathname = usePathname();
  const { 
    mobileSidebarOpen, 
    setMobileSidebarOpen,
    toggleZenMode 
  } = useAppStore();
  const { timer } = useTimerStore();
  const { tasks } = useDataStore();
  const { user, signOut } = useAuth();
  
  const [showMore, setShowMore] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setShowMore(false);
  }, [pathname, setMobileSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const openTasksCount = useMemo(() => 
    tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length
  , [tasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Check if current path is in secondary nav
  const isSecondaryActive = secondaryNavItems.some(item => pathname === item.href);

  return (
    <>
      {/* ========== MOBILE HEADER ========== */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur-lg border-b border-zinc-800 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400"
          aria-label="Menü öffnen"
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="font-semibold text-zinc-100">
          Productive
        </Link>

        {timer.isRunning ? (
          <button
            onClick={toggleZenMode}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-violet-600/20 text-violet-400"
          >
            <Timer size={20} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* ========== MOBILE SIDEBAR OVERLAY ========== */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileSidebar}
      />

      {/* ========== MOBILE SIDEBAR ========== */}
      <aside 
        className={`md:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-zinc-900 z-50 flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
          <span className="font-semibold text-zinc-100">Productive</span>
          <button
            onClick={closeMobileSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300"
            aria-label="Menü schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {primaryNavItems.map((item) => (
              <NavLink 
                key={item.href} 
                item={item} 
                isActive={pathname === item.href}
                onClick={closeMobileSidebar}
              />
            ))}
          </div>

          {/* More section */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isSecondaryActive ? 'text-zinc-200' : 'text-zinc-500'
              } hover:bg-zinc-800`}
            >
              <span className="flex items-center gap-3">
                <MoreHorizontal size={18} />
                Mehr
              </span>
              <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            
            {showMore && (
              <div className="mt-1 ml-3 space-y-1">
                {secondaryNavItems.map((item) => (
                  <NavLink 
                    key={item.href} 
                    item={item} 
                    isActive={pathname === item.href}
                    onClick={closeMobileSidebar}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Timer Widget for Mobile */}
        {timer.isRunning && (
          <div 
            onClick={() => { closeMobileSidebar(); toggleZenMode(); }}
            className="mx-3 p-4 bg-green-900/30 border border-green-800/50 rounded-lg cursor-pointer"
          >
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
              <Timer size={16} />
              <span>Fokus aktiv</span>
            </div>
            <div className="font-mono text-2xl font-bold text-green-300">
              {formatTime(timer.secondsRemaining)}
            </div>
          </div>
        )}

        {/* Focus Button */}
        <div className="p-3">
          <button 
            onClick={() => { closeMobileSidebar(); toggleZenMode(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
          >
            <Play size={18} />
            Fokus starten
          </button>
        </div>

        {/* User & Footer */}
        <div className="border-t border-zinc-800 p-3 space-y-1">
          <Link
            href="/archive"
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Archive size={18} />
            <span>Archiv</span>
          </Link>

          <Link
            href="/settings"
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Settings size={18} />
            <span>Einstellungen</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={() => { closeMobileSidebar(); signOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30"
            >
              <LogOut size={18} />
              <span>Abmelden</span>
            </button>
          )}
        </div>
      </aside>

      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] bg-zinc-900 border-r border-zinc-800 flex-col z-50">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-800">
          <Link href="/" className="font-semibold text-zinc-100">
            Productive
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {primaryNavItems.map((item) => (
              <NavLink 
                key={item.href} 
                item={item} 
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* More section */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isSecondaryActive ? 'text-zinc-200' : 'text-zinc-500'
              } hover:bg-zinc-800`}
            >
              <span className="flex items-center gap-3">
                <MoreHorizontal size={18} />
                Mehr
              </span>
              <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            
            {(showMore || isSecondaryActive) && (
              <div className="mt-1 ml-3 space-y-1">
                {secondaryNavItems.map((item) => (
                  <NavLink 
                    key={item.href} 
                    item={item} 
                    isActive={pathname === item.href}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Timer Widget */}
        {timer.isRunning && (
          <div 
            onClick={toggleZenMode}
            className="mx-3 p-3 bg-green-900/30 border border-green-800/50 rounded-lg cursor-pointer hover:bg-green-900/40 transition-colors"
          >
            <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
              <Timer size={14} />
              <span>Fokus aktiv</span>
            </div>
            <div className="font-mono text-lg font-bold text-green-300">
              {formatTime(timer.secondsRemaining)}
            </div>
          </div>
        )}

        {/* Focus Button */}
        {!timer.isRunning && (
          <div className="p-3">
            <button 
              onClick={toggleZenMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play size={16} />
              Fokus starten
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="border-t border-zinc-800 p-3 space-y-0.5">
          <Link
            href="/archive"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Archive size={16} />
            <span>Archiv</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Settings size={16} />
            <span>Einstellungen</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/30"
            >
              <LogOut size={16} />
              <span>Abmelden</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
