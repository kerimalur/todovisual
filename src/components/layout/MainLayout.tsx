'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore, useTimerStore } from '@/store';
import { Sidebar } from './Sidebar';
import { FloatingActionButton } from '../fab/FloatingActionButton';
import { MotivationToast } from '../ui/MotivationToast';
import { CommandPalette } from '../ui/CommandPalette';
import { ZenMode } from '../zen/ZenMode';
import { ZenWorkspace } from '../zen/ZenWorkspace';
import { TaskModal, TaskDetailModal, HabitModal, GoalModal, ProjectModal, EventModal, TimerModal } from '../modals';
import { Task, Goal, Project, CalendarEvent, Habit } from '@/types';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { Search, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Create a context for modal management
import { createContext, useContext } from 'react';

interface ModalContextType {
  openTaskModal: (task?: Task | null) => void;
  openTaskDetailModal: (task: Task) => void;
  openHabitModal: (habit?: Habit | null) => void;
  openGoalModal: (goal?: Goal | null) => void;
  openProjectModal: (project?: Project | null, goalIdOrCategory?: string) => void;
  openEventModal: (event?: CalendarEvent | null, date?: Date) => void;
  openTimerModal: () => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within MainLayout');
  }
  return context;
}

const pageTitles: Record<string, string> = {
  '/': 'Cockpit',
  '/tasks': 'Aufgaben',
  '/habits': 'Gewohnheiten',
  '/goals': 'Ziele',
  '/projects': 'Projekte',
  '/calendar': 'Kalender',
  '/progress': 'Fortschritt',
  '/journal': 'Journal',
  '/notes': 'Notizen',
  '/settings': 'Einstellungen',
  '/archive': 'Archiv',
};

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function TopBar() {
  const pathname = usePathname();
  const { timer } = useTimerStore();
  const { toggleZenMode } = useAppStore();

  const pageTitle = pageTitles[pathname] || 'Productive';
  const todayLabel = format(new Date(), "EEE, d. MMM", { locale: de });

  const handleSearchClick = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 glass-light border-b border-gray-100/80 topbar-shadow">
      <div className="px-6 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: page title + timer badge */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">
            {pageTitle}
          </h1>

          {timer.isRunning && (
            <button
              onClick={toggleZenMode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors animate-fade-in"
              title="Fokus-Modus öffnen"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <Timer size={11} className="flex-shrink-0" />
              {formatTimer(timer.secondsRemaining)}
            </button>
          )}
        </div>

        {/* Right: date + search */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="hidden md:inline text-sm text-gray-400 font-medium">
            {todayLabel}
          </span>

          <button
            onClick={handleSearchClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm text-gray-500 hover:text-gray-700 transition-all duration-150 group"
            title="Suchen (⌘K)"
          >
            <Search size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
              Suchen
            </span>
            <kbd className="hidden lg:inline text-[10px] font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400 leading-none">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { sidebarCollapsed, zenModeActive, zenWorkspaceActive } = useAppStore();

  // Modal states - MUST be before conditional returns
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [preselectedGoalId, setPreselectedGoalId] = useState<string>('');
  const [preselectedCategory, setPreselectedCategory] = useState<string>('');

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();

  const [timerModalOpen, setTimerModalOpen] = useState(false);

  // If on login page, render children without auth protection
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Modal handlers
  const openTaskModal = (task?: Task | null) => {
    setEditingTask(task || null);
    setTaskModalOpen(true);
  };

  const openTaskDetailModal = (task: Task) => {
    setViewingTask(task);
    setTaskDetailModalOpen(true);
  };

  const handleEditFromDetail = (task: Task) => {
    setTaskDetailModalOpen(false);
    setViewingTask(null);
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const openHabitModal = (habit?: Habit | null) => {
    setEditingHabit(habit || null);
    setHabitModalOpen(true);
  };

  const openGoalModal = (goal?: Goal | null) => {
    setEditingGoal(goal || null);
    setGoalModalOpen(true);
  };

  const openProjectModal = (project?: Project | null, goalIdOrCategory?: string) => {
    setEditingProject(project || null);
    const categories = ['trading', 'finance', 'fitness', 'health', 'wealth', 'programming', 'improvement', 'other'];
    if (goalIdOrCategory && categories.includes(goalIdOrCategory)) {
      setPreselectedCategory(goalIdOrCategory);
      setPreselectedGoalId('');
    } else {
      setPreselectedGoalId(goalIdOrCategory || '');
      setPreselectedCategory('');
    }
    setProjectModalOpen(true);
  };

  const openEventModal = (event?: CalendarEvent | null, date?: Date) => {
    setEditingEvent(event || null);
    setPreselectedDate(date);
    setEventModalOpen(true);
  };

  const openTimerModal = () => {
    setTimerModalOpen(true);
  };

  const modalContext: ModalContextType = {
    openTaskModal,
    openTaskDetailModal,
    openHabitModal,
    openGoalModal,
    openProjectModal,
    openEventModal,
    openTimerModal,
  };

  if (zenModeActive) {
    return <ZenMode />;
  }

  if (zenWorkspaceActive) {
    return <ZenWorkspace />;
  }

  return (
    <ProtectedRoute>
      <ModalContext.Provider value={modalContext}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />

          <main
            className={`min-h-screen transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
            }`}
          >
            {/* Sticky top bar */}
            <TopBar />

            {/* Page content */}
            <div className="p-6 md:p-8">
              {children}
            </div>
          </main>

          <FloatingActionButton
            onOpenTaskModal={() => openTaskModal()}
            onOpenGoalModal={() => openGoalModal()}
            onOpenProjectModal={() => openProjectModal()}
            onOpenEventModal={() => openEventModal()}
            onOpenTimerModal={openTimerModal}
          />
          <MotivationToast />

          {/* Modals */}
          <TaskModal
            isOpen={taskModalOpen}
            onClose={() => setTaskModalOpen(false)}
            editTask={editingTask}
          />
          <TaskDetailModal
            isOpen={taskDetailModalOpen}
            onClose={() => {
              setTaskDetailModalOpen(false);
              setViewingTask(null);
            }}
            task={viewingTask}
            onEdit={handleEditFromDetail}
          />
          <HabitModal
            isOpen={habitModalOpen}
            onClose={() => {
              setHabitModalOpen(false);
              setEditingHabit(null);
            }}
            editHabit={editingHabit}
          />
          <GoalModal
            isOpen={goalModalOpen}
            onClose={() => setGoalModalOpen(false)}
            editGoal={editingGoal}
          />
          <ProjectModal
            isOpen={projectModalOpen}
            onClose={() => setProjectModalOpen(false)}
            editProject={editingProject}
            preselectedGoalId={preselectedGoalId}
            preselectedCategory={preselectedCategory}
          />
          <EventModal
            isOpen={eventModalOpen}
            onClose={() => setEventModalOpen(false)}
            editEvent={editingEvent}
            preselectedDate={preselectedDate}
          />
          <TimerModal
            isOpen={timerModalOpen}
            onClose={() => setTimerModalOpen(false)}
          />

          {/* Command Palette (CMD+K) */}
          <CommandPalette
            onOpenTaskModal={() => openTaskModal()}
            onOpenGoalModal={() => openGoalModal()}
            onOpenEventModal={() => openEventModal()}
          />
        </div>
      </ModalContext.Provider>
    </ProtectedRoute>
  );
}
