'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Settings,
  ChevronDown,
  Command,
  LayoutDashboard,
  ListTodo,
  Grid3X3,
  Target,
  FolderKanban,
  Calendar,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { useAppStore, useTimerStore } from '@/store';

const navItems = [
  { href: '/', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/tasks', label: 'Aufgaben', icon: ListTodo },
  { href: '/matrix', label: 'Matrix', icon: Grid3X3 },
  { href: '/goals', label: 'Ziele', icon: Target },
  { href: '/projects', label: 'Projekte', icon: FolderKanban },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/progress', label: 'Fortschritt', icon: TrendingUp },
  { href: '/journal', label: 'Journal', icon: BookOpen },
];

interface HeaderProps {
  onOpenCommandPalette?: () => void;
  onOpenTaskModal?: () => void;
  onOpenGoalModal?: () => void;
  onOpenProjectModal?: () => void;
  onOpenEventModal?: () => void;
}

export function Header({ onOpenCommandPalette, onOpenTaskModal, onOpenGoalModal, onOpenProjectModal, onOpenEventModal }: HeaderProps) {
  const pathname = usePathname();
  const { timer } = useTimerStore();
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNewDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <div className="header-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span className="header-logo-text">Productive</span>
        </Link>

        {/* Navigation */}
        <nav className="header-nav">
          {navItems.slice(0, 6).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`header-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="header-nav-more">
            <button className="header-nav-item">
              <span>Mehr</span>
              <ChevronDown size={14} />
            </button>
            <div className="header-nav-dropdown">
              {navItems.slice(6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="header-nav-dropdown-item">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          {/* Timer indicator */}
          {timer.isRunning && (
            <div className="header-timer">
              <div className="header-timer-dot" />
              <span>{formatTime(timer.secondsRemaining)}</span>
            </div>
          )}

          {/* Search */}
          <button
            onClick={onOpenCommandPalette}
            className="header-search"
            title="Suchen (Ctrl+K)"
          >
            <Search size={16} />
            <span>Suchen...</span>
            <kbd className="header-kbd">
              <Command size={10} />K
            </kbd>
          </button>

          {/* New Button */}
          <div className="header-new-container" ref={dropdownRef}>
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="header-new-btn"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Neu</span>
              <ChevronDown size={14} />
            </button>

            {showNewDropdown && (
              <div className="header-new-dropdown">
                <button
                  onClick={() => {
                    onOpenTaskModal?.();
                    setShowNewDropdown(false);
                  }}
                  className="header-new-dropdown-item"
                >
                  <ListTodo size={16} />
                  <div>
                    <div className="header-new-dropdown-title">Neue Aufgabe</div>
                    <div className="header-new-dropdown-desc">Erstelle eine neue Aufgabe</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onOpenGoalModal?.();
                    setShowNewDropdown(false);
                  }}
                  className="header-new-dropdown-item"
                >
                  <Target size={16} />
                  <div>
                    <div className="header-new-dropdown-title">Neues Ziel</div>
                    <div className="header-new-dropdown-desc">Definiere ein neues Ziel</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onOpenProjectModal?.();
                    setShowNewDropdown(false);
                  }}
                  className="header-new-dropdown-item"
                >
                  <FolderKanban size={16} />
                  <div>
                    <div className="header-new-dropdown-title">Neues Projekt</div>
                    <div className="header-new-dropdown-desc">Starte ein neues Projekt</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onOpenEventModal?.();
                    setShowNewDropdown(false);
                  }}
                  className="header-new-dropdown-item"
                >
                  <Calendar size={16} />
                  <div>
                    <div className="header-new-dropdown-title">Neuer Termin</div>
                    <div className="header-new-dropdown-desc">Plane einen Termin ein</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="header-icon-btn" title="Benachrichtigungen">
            <Bell size={18} />
          </button>

          {/* Settings */}
          <Link href="/settings" className="header-icon-btn" title="Einstellungen">
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
