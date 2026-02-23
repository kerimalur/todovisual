'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { Sidebar } from './Sidebar';
import { MinimalSidebar } from './MinimalSidebar';
import { FloatingActionButton } from '../fab/FloatingActionButton';
import { MotivationToast } from '../ui/MotivationToast';
import { CommandPalette } from '../ui/CommandPalette';
import { ZenMode } from '../zen/ZenMode';
import { ZenWorkspace } from '../zen/ZenWorkspace';
import { TaskModal, TaskDetailModal, HabitModal, GoalModal, ProjectModal, EventModal, TimerModal } from '../modals';
import { Task, Goal, Project, CalendarEvent, Habit } from '@/types';
import { ProtectedRoute } from '../auth/ProtectedRoute';

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

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { sidebarCollapsed, zenModeActive, zenWorkspaceActive } = useAppStore();

  // Modal states - MUST be before conditional returns
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Task Detail Modal state
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Habit Modal state
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

  // Open detail view (schlichte Übersicht)
  const openTaskDetailModal = (task: Task) => {
    setViewingTask(task);
    setTaskDetailModalOpen(true);
  };

  // Handler to switch from detail to edit modal
  const handleEditFromDetail = (task: Task) => {
    setTaskDetailModalOpen(false);
    setViewingTask(null);
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  // Habit modal handler
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
    // Check if it's a category (known categories) or goalId
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

  // Focus mode (with task selection and timer)
  if (zenModeActive) {
    return <ZenMode />;
  }

  // Zen workspace mode (relaxed working mode)
  if (zenWorkspaceActive) {
    return <ZenWorkspace />;
  }

  return (
    <ProtectedRoute>
      <ModalContext.Provider value={modalContext}>
        <div className="min-h-screen bg-[var(--background-secondary)]">
          <MinimalSidebar />
          <Sidebar />

          <main
            className={`
              min-h-screen transition-all duration-300 bg-gray-50 pt-14 md:pt-0
              ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'}
            `}
          >
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
