'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore, useTimerStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { MinimalSidebar } from './MinimalSidebar';
import { MinimalFAB } from '../fab/MinimalFAB';
import { MotivationToast } from '../ui/MotivationToast';
import { CommandPalette } from '../ui/CommandPalette';
import { ZenMode } from '../zen/ZenMode';
import { ZenWorkspace } from '../zen/ZenWorkspace';
import { TaskModal, TaskDetailModal, HabitModal, GoalModal, ProjectModal, EventModal, TimerModal } from '../modals';
import { Task, Goal, Project, CalendarEvent, Habit } from '@/types';
import { ProtectedRoute } from '../auth/ProtectedRoute';
// Import the ModalContext from MainLayout for compatibility
import { ModalContext } from './MainLayout';

interface MinimalLayoutProps {
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

export const MinimalModalContext = createContext<ModalContextType | null>(null);

export function useMinimalModals() {
  const context = useContext(MinimalModalContext);
  if (!context) {
    throw new Error('useMinimalModals must be used within MinimalLayout');
  }
  return context;
}

export function MinimalLayout({ children }: MinimalLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { zenModeActive, zenWorkspaceActive } = useAppStore();
  const { timer } = useTimerStore();

  // If on login page, render children without auth protection
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Modal states - simplified
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

  // Focus mode
  if (zenModeActive) {
    return <ZenMode />;
  }

  // Zen workspace mode
  if (zenWorkspaceActive) {
    return <ZenWorkspace />;
  }

  return (
    <ProtectedRoute>
      {/* Both contexts for compatibility with existing pages */}
      <ModalContext.Provider value={modalContext}>
      <MinimalModalContext.Provider value={modalContext}>
        <div className="min-h-screen bg-zinc-900">
          <MinimalSidebar />

          {/* Main content - Fixed width sidebar (200px) */}
          <main className="min-h-screen transition-all duration-200 pt-14 md:pt-0 md:ml-[200px]">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>

          {/* Minimal FAB - nur 2 Aktionen */}
          <MinimalFAB onOpenTaskModal={() => openTaskModal()} />
          
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

          {/* Command Palette */}
          <CommandPalette
            onOpenTaskModal={() => openTaskModal()}
            onOpenGoalModal={() => openGoalModal()}
            onOpenEventModal={() => openEventModal()}
          />
        </div>
      </MinimalModalContext.Provider>
      </ModalContext.Provider>
    </ProtectedRoute>
  );
}
