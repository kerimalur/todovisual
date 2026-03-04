'use client';

import { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { Sidebar } from './Sidebar';
import { MinimalSidebar } from './MinimalSidebar';
import { FloatingActionButton } from '../fab/FloatingActionButton';
import { MotivationToast } from '../ui/MotivationToast';
import { CommandPalette } from '../ui/CommandPalette';
import { ZenMode } from '../zen/ZenMode';
import { ZenWorkspace } from '../zen/ZenWorkspace';
import {
  TaskModal,
  TaskDetailModal,
  HabitModal,
  GoalModal,
  ProjectModal,
  EventModal,
  TimerModal,
} from '../modals';
import { Task, Goal, Project, CalendarEvent, Habit } from '@/types';
import { ProtectedRoute } from '../auth/ProtectedRoute';

interface MainLayoutProps {
  children: React.ReactNode;
}

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

  if (isLoginPage) {
    return <>{children}</>;
  }

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
        <div className="min-h-screen bg-page">
          <MinimalSidebar />
          <Sidebar />

          <main
            className={`
              min-h-screen pt-14 md:pt-0 transition-[margin] duration-300
              ${sidebarCollapsed ? 'md:ml-[92px]' : 'md:ml-[228px]'}
            `}
          >
            <div className="mx-auto w-full max-w-[1320px] p-4 md:p-7">
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
          <TimerModal isOpen={timerModalOpen} onClose={() => setTimerModalOpen(false)} />

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
