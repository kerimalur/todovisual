import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Goal,
  Project,
  Task,
  CalendarEvent,
  JournalEntry,
  FocusSession,
  Habit,
  HabitCompletion,
  HabitCategoryItem,
  Tag,
  Note,
  TimeEntry,
  BrainstormSession
} from '@/types';
import { supabaseService, TABLES } from '@/lib/supabaseService';
import { addDays, format, isSameDay, startOfDay, startOfWeek, endOfWeek } from 'date-fns';

interface DataStore {
  // User
  userId: string | null;

  // Data
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  events: CalendarEvent[];
  journalEntries: JournalEntry[];
  focusSessions: FocusSession[];
  habits: Habit[];
  habitCategories: HabitCategoryItem[];
  tags: Tag[];
  notes: Note[];
  timeEntries: TimeEntry[];
  brainstormSessions: BrainstormSession[];

  // Loading states
  loading: boolean;
  initialized: boolean;

  // Active time tracking
  activeTimeEntry: TimeEntry | null;

  // Initialize with user ID and set up listeners
  initialize: (userId: string) => void;
  cleanup: () => void;

  // Task Actions
  createTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<Task>;
  addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  reactivateTask: (id: string) => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;
  planInboxTasksForToday: (limit?: number) => Promise<number>;
  rescheduleOverdueTasks: (maxPerDay?: number) => Promise<number>;

  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Event Actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Journal Actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId'>) => Promise<void>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Habit Actions
  addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'completions'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string, date?: Date) => Promise<void>;
  uncompleteHabit: (habitId: string, date?: Date) => Promise<void>;
  pauseHabit: (habitId: string, until?: Date) => Promise<void>;
  resumeHabit: (habitId: string) => Promise<void>;

  // Habit Category Actions
  addHabitCategory: (category: Omit<HabitCategoryItem, 'id' | 'userId'>) => HabitCategoryItem;
  deleteHabitCategory: (id: string) => void;

  // Habit Helper Functions
  isHabitCompletedToday: (habitId: string) => boolean;
  getHabitCompletionsThisWeek: (habitId: string) => number;
  calculateStreak: (habit: Habit) => number;

  // Tag Actions
  addTag: (tag: Omit<Tag, 'id' | 'userId' | 'createdAt'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Note Actions
  addNote: (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;

  // Brainstorm Actions
  addBrainstormSession: (session: Omit<BrainstormSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<BrainstormSession>;
  updateBrainstormSession: (id: string, updates: Partial<BrainstormSession>) => Promise<void>;
  deleteBrainstormSession: (id: string) => Promise<void>;

  // Time Tracking Actions
  startTimeTracking: (taskId: string, description?: string) => Promise<void>;
  stopTimeTracking: () => Promise<void>;
  addManualTimeEntry: (entry: Omit<TimeEntry, 'id' | 'userId' | 'createdAt' | 'isRunning'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  getTimeEntriesForTask: (taskId: string) => TimeEntry[];
  getTotalTimeForTask: (taskId: string) => number; // in Minuten
}

// Unsubscribe functions for cleanup
let unsubscribeFunctions: (() => void)[] = [];
type HabitCompletionRecord = HabitCompletion & { completionDate?: Date | string };

const toDateKey = (value: Date | string) => new Date(value).toISOString().split('T')[0];
const parseCompletionDate = (completion: HabitCompletionRecord): Date | null => {
  const rawDate = completion.date ?? completion.completionDate;
  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate;
};

const getCompletionDateKey = (completion: HabitCompletionRecord): string | null => {
  const parsedDate = parseCompletionDate(completion);
  return parsedDate ? parsedDate.toISOString().split('T')[0] : null;
};

const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const uniqueIds = (ids: Array<string | undefined | null>): string[] =>
  Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)));

const normalizeTaskLinks = <T extends Partial<Task>>(input: T): T => {
  const normalized: T = { ...input };
  const touchesGoalLinks = hasOwn(input, 'goalId') || hasOwn(input, 'goalIds');
  const touchesProjectLinks = hasOwn(input, 'projectId') || hasOwn(input, 'projectIds');

  if (touchesGoalLinks) {
    const goalIds = uniqueIds([...(input.goalIds ?? []), input.goalId]);
    (normalized as Partial<Task>).goalIds = goalIds;
    (normalized as Partial<Task>).goalId = goalIds[0];
  }

  if (touchesProjectLinks) {
    const projectIds = uniqueIds([...(input.projectIds ?? []), input.projectId]);
    (normalized as Partial<Task>).projectIds = projectIds;
    (normalized as Partial<Task>).projectId = projectIds[0];
  }

  return normalized;
};

const normalizeProjectLinks = <T extends Partial<Project>>(input: T): T => {
  const normalized: T = { ...input };
  const touchesGoalLinks = hasOwn(input, 'goalId') || hasOwn(input, 'goalIds');

  if (touchesGoalLinks) {
    const goalIds = uniqueIds([...(input.goalIds ?? []), input.goalId]);
    (normalized as Partial<Project>).goalIds = goalIds;
    (normalized as Partial<Project>).goalId = goalIds[0];
  }

  return normalized;
};

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial State
  userId: null,
  tasks: [],
  goals: [],
  projects: [],
  events: [],
  journalEntries: [],
  focusSessions: [],
  habits: [],
  habitCategories: [],
  tags: [],
  notes: [],
  timeEntries: [],
  brainstormSessions: [],
  loading: true,
  initialized: false,
  activeTimeEntry: null,

  // Initialize store with user data
  initialize: (userId: string) => {
    if (get().initialized) return;

    set({ loading: true, userId });

    // Subscribe to all collections
    const unsubTasks = supabaseService.subscribe<Task>(
      TABLES.TASKS,
      userId,
      (tasks) => set({ tasks, loading: false })
    );

    const unsubGoals = supabaseService.subscribe<Goal>(
      TABLES.GOALS,
      userId,
      (goals) => set({ goals })
    );

    const unsubProjects = supabaseService.subscribe<Project>(
      TABLES.PROJECTS,
      userId,
      (projects) => set({ projects })
    );

    const unsubEvents = supabaseService.subscribe<CalendarEvent>(
      TABLES.EVENTS,
      userId,
      (events) => set({ events })
    );

    const unsubHabits = supabaseService.subscribe<Habit>(
      TABLES.HABITS,
      userId,
      (habits) => set({ habits })
    );

    const unsubHabitCategories = supabaseService.subscribe<HabitCategoryItem>(
      TABLES.HABIT_CATEGORIES,
      userId,
      (habitCategories) => set({ habitCategories })
    );

    const unsubJournal = supabaseService.subscribe<JournalEntry>(
      TABLES.JOURNAL_ENTRIES,
      userId,
      (journalEntries) => set({ journalEntries })
    );

    const unsubFocus = supabaseService.subscribe<FocusSession>(
      TABLES.FOCUS_SESSIONS,
      userId,
      (focusSessions) => set({ focusSessions })
    );

    const unsubTags = supabaseService.subscribe<Tag>(
      TABLES.TAGS,
      userId,
      (tags) => set({ tags })
    );

    const unsubNotes = supabaseService.subscribe<Note>(
      TABLES.NOTES,
      userId,
      (notes) => set({ notes })
    );

    const unsubTimeEntries = supabaseService.subscribe<TimeEntry>(
      TABLES.TIME_ENTRIES,
      userId,
      (timeEntries) => {
        const activeEntry = timeEntries.find(e => e.isRunning);
        set({ timeEntries, activeTimeEntry: activeEntry || null });
      }
    );

    const unsubBrainstorm = supabaseService.subscribe<BrainstormSession>(
      TABLES.BRAINSTORM_SESSIONS,
      userId,
      (brainstormSessions) => set({ brainstormSessions })
    );

    // Store unsubscribe functions
    unsubscribeFunctions = [
      unsubTasks,
      unsubGoals,
      unsubProjects,
      unsubEvents,
      unsubHabits,
      unsubHabitCategories,
      unsubJournal,
      unsubFocus,
      unsubTags,
      unsubNotes,
      unsubTimeEntries,
      unsubBrainstorm,
    ];

    set({ initialized: true });
  },

  cleanup: () => {
    unsubscribeFunctions.forEach((unsub) => unsub());
    unsubscribeFunctions = [];
    set({ initialized: false, userId: null });
  },

  // === TASK ACTIONS ===
  createTask: async (taskData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');
    const normalizedTaskData = normalizeTaskLinks(taskData);

    const temporaryId = `temp-${uuidv4()}`;
    const createdAt = new Date();
    const optimisticTask: Task = {
      id: temporaryId,
      userId,
      createdAt,
      ...normalizedTaskData,
      status: normalizedTaskData.status ?? 'todo',
      tags: normalizedTaskData.tags ?? [],
    };

    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.TASKS, {
        ...normalizedTaskData,
        user_id: userId,
        created_at: createdAt,
        status: optimisticTask.status,
        tags: optimisticTask.tags,
      });
      const createdTask: Task = {
        ...optimisticTask,
        id: createdId,
      };

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === temporaryId
            ? {
                ...task,
                id: createdId,
              }
            : task
        ),
      }));
      return createdTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== temporaryId),
      }));
      throw error;
    }
  },

  addTask: async (taskData) => {
    await get().createTask(taskData);
  },

  updateTask: async (id, updates) => {
    const normalizedUpdates = normalizeTaskLinks(updates);
    const previousTask = get().tasks.find((task) => task.id === id);
    if (previousTask) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...normalizedUpdates,
              }
            : task
        ),
      }));
    }

    const updateData = {
      ...normalizedUpdates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.TASKS, id, updateData);
    } catch (error) {
      console.error('Failed to update task:', error);
      if (previousTask) {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? previousTask : task)),
        }));
      }
      throw error;
    }
  },

  deleteTask: async (id) => {
    const tasksSnapshot = get().tasks;
    const removedIndex = tasksSnapshot.findIndex((task) => task.id === id);
    const removedTask = removedIndex >= 0 ? tasksSnapshot[removedIndex] : null;

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.TASKS, id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      if (removedTask) {
        set((state) => {
          if (state.tasks.some((task) => task.id === id)) {
            return state;
          }

          const restoredTasks = [...state.tasks];
          const insertAt = Math.min(removedIndex, restoredTasks.length);
          restoredTasks.splice(insertAt, 0, removedTask);
          return { tasks: restoredTasks };
        });
      }
      throw error;
    }
  },

  completeTask: async (id) => {
    const previousTask = get().tasks.find((task) => task.id === id);
    const completedAt = new Date();

    if (previousTask) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: 'completed',
                completedAt,
              }
            : task
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.TASKS, id, {
        status: 'completed',
        completed_at: completedAt,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
      if (previousTask) {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? previousTask : task)),
        }));
      }
      throw error;
    }
  },

  archiveTask: async (id) => {
    const previousTask = get().tasks.find((task) => task.id === id);
    const archivedAt = new Date();

    if (previousTask) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: 'archived',
                archivedAt,
              }
            : task
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.TASKS, id, {
        status: 'archived',
        archived_at: archivedAt,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to archive task:', error);
      if (previousTask) {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? previousTask : task)),
        }));
      }
      throw error;
    }
  },

  reactivateTask: async (id) => {
    const previousTask = get().tasks.find((task) => task.id === id);

    if (previousTask) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: 'todo',
                archivedAt: undefined,
                completedAt: undefined,
              }
            : task
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.TASKS, id, {
        status: 'todo',
        archived_at: null,
        completed_at: null,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to reactivate task:', error);
      if (previousTask) {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? previousTask : task)),
        }));
      }
      throw error;
    }
  },

  deleteCompletedTasks: async () => {
    const previousTasks = get().tasks;
    const completedTaskIds = previousTasks
      .filter((task) => task.status === 'completed')
      .map((task) => task.id);

    if (completedTaskIds.length === 0) return;

    set((state) => ({
      tasks: state.tasks.filter((task) => task.status !== 'completed'),
    }));

    try {
      await supabaseService.batchDeleteTasks(completedTaskIds);
    } catch (error) {
      console.error('Failed to delete completed tasks:', error);
      set({ tasks: previousTasks });
      throw error;
    }
  },

  planInboxTasksForToday: async (limit = 3) => {
    const previousTasks = get().tasks;
    const today = startOfDay(new Date());
    const priorityWeight: Record<Task['priority'], number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const inboxTasks = previousTasks
      .filter((task) => task.status !== 'completed' && task.status !== 'archived' && !task.dueDate)
      .sort((a, b) => {
        const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, limit);

    if (inboxTasks.length === 0) return 0;

    const taskIds = new Set(inboxTasks.map((task) => task.id));
    set((state) => ({
      tasks: state.tasks.map((task) =>
        taskIds.has(task.id)
          ? {
              ...task,
              dueDate: today,
            }
          : task
      ),
    }));

    try {
      await Promise.all(
        inboxTasks.map((task) =>
          supabaseService.update(TABLES.TASKS, task.id, {
            due_date: today,
            updated_at: new Date(),
          })
        )
      );
      return inboxTasks.length;
    } catch (error) {
      console.error('Failed to plan inbox tasks for today:', error);
      set({ tasks: previousTasks });
      throw error;
    }
  },

  rescheduleOverdueTasks: async (maxPerDay = 3) => {
    const previousTasks = get().tasks;
    const today = startOfDay(new Date());
    const priorityWeight: Record<Task['priority'], number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const overdueTasks = previousTasks
      .filter((task) => {
        if (task.status === 'completed' || task.status === 'archived') return false;
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < today;
      })
      .sort((a, b) => {
        const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime();
      });

    if (overdueTasks.length === 0) return 0;

    const dailyLoad = new Map<string, number>();
    previousTasks
      .filter((task) => {
        if (task.status === 'completed' || task.status === 'archived') return false;
        if (!task.dueDate) return false;
        return new Date(task.dueDate) >= today;
      })
      .forEach((task) => {
        const key = format(startOfDay(new Date(task.dueDate as Date)), 'yyyy-MM-dd');
        dailyLoad.set(key, (dailyLoad.get(key) || 0) + 1);
      });

    const assignments = new Map<string, Date>();
    let cursor = new Date(today);
    for (const task of overdueTasks) {
      let guard = 0;
      while (guard < 90) {
        const key = format(cursor, 'yyyy-MM-dd');
        const load = dailyLoad.get(key) || 0;
        if (load < maxPerDay) {
          assignments.set(task.id, new Date(cursor));
          dailyLoad.set(key, load + 1);
          break;
        }
        cursor = addDays(cursor, 1);
        guard += 1;
      }
    }

    if (assignments.size === 0) return 0;

    set((state) => ({
      tasks: state.tasks.map((task) => {
        const nextDate = assignments.get(task.id);
        if (!nextDate) return task;
        return {
          ...task,
          dueDate: nextDate,
        };
      }),
    }));

    try {
      await Promise.all(
        Array.from(assignments.entries()).map(([taskId, dueDate]) =>
          supabaseService.update(TABLES.TASKS, taskId, {
            due_date: dueDate,
            updated_at: new Date(),
          })
        )
      );
      return assignments.size;
    } catch (error) {
      console.error('Failed to reschedule overdue tasks:', error);
      set({ tasks: previousTasks });
      throw error;
    }
  },

  // === GOAL ACTIONS ===
  addGoal: async (goalData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const createdAt = new Date();
    const optimisticGoal: Goal = {
      id: temporaryId,
      userId,
      createdAt,
      ...goalData,
      progress: goalData.progress ?? 0,
    };

    set((state) => ({
      goals: [optimisticGoal, ...state.goals],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.GOALS, {
        ...goalData,
        user_id: userId,
        created_at: createdAt,
        progress: optimisticGoal.progress,
      });

      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === temporaryId
            ? {
                ...goal,
                id: createdId,
              }
            : goal
        ),
      }));
    } catch (error) {
      console.error('Failed to add goal:', error);
      set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    const previousGoal = get().goals.find((goal) => goal.id === id);
    if (previousGoal) {
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id
            ? {
                ...goal,
                ...updates,
              }
            : goal
        ),
      }));
    }

    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.GOALS, id, updateData);
    } catch (error) {
      console.error('Failed to update goal:', error);
      if (previousGoal) {
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === id ? previousGoal : goal)),
        }));
      }
      throw error;
    }
  },

  deleteGoal: async (id) => {
    const goalsSnapshot = get().goals;
    const removedIndex = goalsSnapshot.findIndex((goal) => goal.id === id);
    const removedGoal = removedIndex >= 0 ? goalsSnapshot[removedIndex] : null;

    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.GOALS, id);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      if (removedGoal) {
        set((state) => {
          if (state.goals.some((goal) => goal.id === id)) {
            return state;
          }

          const restoredGoals = [...state.goals];
          const insertAt = Math.min(removedIndex, restoredGoals.length);
          restoredGoals.splice(insertAt, 0, removedGoal);
          return { goals: restoredGoals };
        });
      }
      throw error;
    }
  },

  // === PROJECT ACTIONS ===
  addProject: async (projectData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');
    const normalizedProjectData = normalizeProjectLinks(projectData);

    const temporaryId = `temp-${uuidv4()}`;
    const createdAt = new Date();
    const optimisticProject: Project = {
      id: temporaryId,
      userId,
      createdAt,
      ...normalizedProjectData,
      status: normalizedProjectData.status ?? 'planning',
    };

    set((state) => ({
      projects: [optimisticProject, ...state.projects],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.PROJECTS, {
        ...normalizedProjectData,
        user_id: userId,
        created_at: createdAt,
        status: optimisticProject.status,
      });

      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === temporaryId
            ? {
                ...project,
                id: createdId,
              }
            : project
        ),
      }));
    } catch (error) {
      console.error('Failed to add project:', error);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    const normalizedUpdates = normalizeProjectLinks(updates);
    const previousProject = get().projects.find((project) => project.id === id);
    if (previousProject) {
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id
            ? {
                ...project,
                ...normalizedUpdates,
              }
            : project
        ),
      }));
    }

    const updateData = {
      ...normalizedUpdates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.PROJECTS, id, updateData);
    } catch (error) {
      console.error('Failed to update project:', error);
      if (previousProject) {
        set((state) => ({
          projects: state.projects.map((project) => (project.id === id ? previousProject : project)),
        }));
      }
      throw error;
    }
  },

  deleteProject: async (id) => {
    const projectsSnapshot = get().projects;
    const removedIndex = projectsSnapshot.findIndex((project) => project.id === id);
    const removedProject = removedIndex >= 0 ? projectsSnapshot[removedIndex] : null;

    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.PROJECTS, id);
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (removedProject) {
        set((state) => {
          if (state.projects.some((project) => project.id === id)) {
            return state;
          }

          const restoredProjects = [...state.projects];
          const insertAt = Math.min(removedIndex, restoredProjects.length);
          restoredProjects.splice(insertAt, 0, removedProject);
          return { projects: restoredProjects };
        });
      }
      throw error;
    }
  },

  // === EVENT ACTIONS ===
  addEvent: async (eventData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const optimisticEvent: CalendarEvent = {
      id: temporaryId,
      userId,
      ...eventData,
    };

    set((state) => ({
      events: [optimisticEvent, ...state.events],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.EVENTS, {
        ...eventData,
        user_id: userId,
      });

      set((state) => ({
        events: state.events.map((event) =>
          event.id === temporaryId
            ? {
                ...event,
                id: createdId,
              }
            : event
        ),
      }));
    } catch (error) {
      console.error('Failed to add event:', error);
      set((state) => ({
        events: state.events.filter((event) => event.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    const previousEvent = get().events.find((event) => event.id === id);
    if (previousEvent) {
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id
            ? {
                ...event,
                ...updates,
              }
            : event
        ),
      }));
    }

    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.EVENTS, id, updateData);
    } catch (error) {
      console.error('Failed to update event:', error);
      if (previousEvent) {
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? previousEvent : event)),
        }));
      }
      throw error;
    }
  },

  deleteEvent: async (id) => {
    const eventsSnapshot = get().events;
    const removedIndex = eventsSnapshot.findIndex((event) => event.id === id);
    const removedEvent = removedIndex >= 0 ? eventsSnapshot[removedIndex] : null;

    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.EVENTS, id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      if (removedEvent) {
        set((state) => {
          if (state.events.some((event) => event.id === id)) {
            return state;
          }

          const restoredEvents = [...state.events];
          const insertAt = Math.min(removedIndex, restoredEvents.length);
          restoredEvents.splice(insertAt, 0, removedEvent);
          return { events: restoredEvents };
        });
      }
      throw error;
    }
  },

  // === JOURNAL ACTIONS ===
  addJournalEntry: async (entryData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const optimisticEntry: JournalEntry = {
      id: temporaryId,
      userId,
      ...entryData,
    };

    set((state) => ({
      journalEntries: [optimisticEntry, ...state.journalEntries],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.JOURNAL_ENTRIES, {
        ...entryData,
        user_id: userId,
      });

      set((state) => ({
        journalEntries: state.journalEntries.map((entry) =>
          entry.id === temporaryId
            ? {
                ...entry,
                id: createdId,
              }
            : entry
        ),
      }));
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      set((state) => ({
        journalEntries: state.journalEntries.filter((entry) => entry.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateJournalEntry: async (id, updates) => {
    const previousEntry = get().journalEntries.find((entry) => entry.id === id);
    if (previousEntry) {
      set((state) => ({
        journalEntries: state.journalEntries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...updates,
              }
            : entry
        ),
      }));
    }

    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.JOURNAL_ENTRIES, id, updateData);
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      if (previousEntry) {
        set((state) => ({
          journalEntries: state.journalEntries.map((entry) => (entry.id === id ? previousEntry : entry)),
        }));
      }
      throw error;
    }
  },

  deleteJournalEntry: async (id) => {
    const entriesSnapshot = get().journalEntries;
    const removedIndex = entriesSnapshot.findIndex((entry) => entry.id === id);
    const removedEntry = removedIndex >= 0 ? entriesSnapshot[removedIndex] : null;

    set((state) => ({
      journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.JOURNAL_ENTRIES, id);
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      if (removedEntry) {
        set((state) => {
          if (state.journalEntries.some((entry) => entry.id === id)) {
            return state;
          }

          const restoredEntries = [...state.journalEntries];
          const insertAt = Math.min(removedIndex, restoredEntries.length);
          restoredEntries.splice(insertAt, 0, removedEntry);
          return { journalEntries: restoredEntries };
        });
      }
      throw error;
    }
  },

  // === HABIT ACTIONS ===
  addHabit: async (habitData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const createdAt = new Date();
    const optimisticHabit: Habit = {
      id: temporaryId,
      userId,
      createdAt,
      ...habitData,
      reminderEnabled: habitData.reminderEnabled ?? false,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completions: [],
      isActive: habitData.isActive ?? true,
      isPaused: habitData.isPaused ?? false,
    };

    set((state) => ({
      habits: [optimisticHabit, ...state.habits],
    }));

    try {
      const createdId = await supabaseService.create(TABLES.HABITS, {
        ...habitData,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completions: [],
        created_at: createdAt,
      });

      set((state) => ({
        habits: state.habits.map((habit) =>
          habit.id === temporaryId
            ? {
                ...habit,
                id: createdId,
              }
            : habit
        ),
      }));
    } catch (error) {
      console.error('Failed to add habit:', error);
      set((state) => ({
        habits: state.habits.filter((habit) => habit.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    const previousHabit = get().habits.find((habit) => habit.id === id);
    if (previousHabit) {
      set((state) => ({
        habits: state.habits.map((habit) =>
          habit.id === id
            ? {
                ...habit,
                ...updates,
              }
            : habit
        ),
      }));
    }

    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    try {
      await supabaseService.update(TABLES.HABITS, id, updateData);
    } catch (error) {
      console.error('Failed to update habit:', error);
      if (previousHabit) {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? previousHabit : habit)),
        }));
      }
      throw error;
    }
  },

  deleteHabit: async (id) => {
    const habitsSnapshot = get().habits;
    const removedIndex = habitsSnapshot.findIndex((habit) => habit.id === id);
    const removedHabit = removedIndex >= 0 ? habitsSnapshot[removedIndex] : null;

    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.HABITS, id);
    } catch (error) {
      console.error('Failed to delete habit:', error);
      if (removedHabit) {
        set((state) => {
          if (state.habits.some((habit) => habit.id === id)) {
            return state;
          }

          const restoredHabits = [...state.habits];
          const insertAt = Math.min(removedIndex, restoredHabits.length);
          restoredHabits.splice(insertAt, 0, removedHabit);
          return { habits: restoredHabits };
        });
      }
      throw error;
    }
  },

  completeHabit: async (habitId, date = new Date()) => {
    const previousHabit = get().habits.find((habit) => habit.id === habitId);
    if (!previousHabit) return;

    const dateKey = toDateKey(date);
    const alreadyCompleted = (previousHabit.completions || []).some(
      (completion) => getCompletionDateKey(completion as HabitCompletionRecord) === dateKey
    );
    if (alreadyCompleted) return;

    const temporaryCompletionId = `temp-${uuidv4()}`;
    const optimisticCompletion: HabitCompletion = {
      id: temporaryCompletionId,
      date: new Date(dateKey),
    };
    const optimisticCompletions = [...(previousHabit.completions || []), optimisticCompletion];
    const optimisticHabitBase: Habit = {
      ...previousHabit,
      completions: optimisticCompletions,
      totalCompletions: optimisticCompletions.length,
    };
    const optimisticStreak = get().calculateStreak(optimisticHabitBase);
    const optimisticHabit: Habit = {
      ...optimisticHabitBase,
      currentStreak: optimisticStreak,
      longestStreak: Math.max(previousHabit.longestStreak || 0, optimisticStreak),
    };

    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? optimisticHabit : habit)),
    }));

    try {
      await supabaseService.update(TABLES.HABITS, habitId, {
        completions: optimisticHabit.completions,
        total_completions: optimisticHabit.totalCompletions,
        current_streak: optimisticHabit.currentStreak,
        longest_streak: optimisticHabit.longestStreak,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to complete habit:', error);
      set((state) => ({
        habits: state.habits.map((habit) => (habit.id === habitId ? previousHabit : habit)),
      }));
      throw error;
    }

    try {
      const completionId = await supabaseService.create(TABLES.HABIT_COMPLETIONS, {
        habit_id: habitId,
        completion_date: dateKey,
        created_at: new Date(),
      });

      set((state) => ({
        habits: state.habits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                completions: (habit.completions || []).map((completion) =>
                  completion.id === temporaryCompletionId
                    ? {
                        ...completion,
                        id: completionId,
                      }
                    : completion
                ),
              }
            : habit
        ),
      }));
    } catch (error) {
      console.error('Failed to persist habit completion row:', error);
    }
  },

  uncompleteHabit: async (habitId, date = new Date()) => {
    const previousHabit = get().habits.find((habit) => habit.id === habitId);
    if (!previousHabit) return;

    const dateKey = toDateKey(date);
    const previousCompletions = previousHabit.completions || [];
    const optimisticCompletions = previousCompletions.filter(
      (completion) => getCompletionDateKey(completion as HabitCompletionRecord) !== dateKey
    );
    if (optimisticCompletions.length === previousCompletions.length) return;

    const optimisticHabitBase: Habit = {
      ...previousHabit,
      completions: optimisticCompletions,
      totalCompletions: optimisticCompletions.length,
    };
    const optimisticStreak = get().calculateStreak(optimisticHabitBase);
    const optimisticHabit: Habit = {
      ...optimisticHabitBase,
      currentStreak: optimisticStreak,
      longestStreak: Math.max(previousHabit.longestStreak || 0, optimisticStreak),
    };

    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? optimisticHabit : habit)),
    }));

    try {
      await supabaseService.update(TABLES.HABITS, habitId, {
        completions: optimisticHabit.completions,
        total_completions: optimisticHabit.totalCompletions,
        current_streak: optimisticHabit.currentStreak,
        longest_streak: optimisticHabit.longestStreak,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to uncomplete habit:', error);
      set((state) => ({
        habits: state.habits.map((habit) => (habit.id === habitId ? previousHabit : habit)),
      }));
      throw error;
    }

    try {
      const completionRows = await supabaseService.readByField<HabitCompletionRecord>(
        TABLES.HABIT_COMPLETIONS,
        'habit_id',
        habitId
      );
      const completionRow = completionRows.find((completion) => {
        return getCompletionDateKey(completion) === dateKey;
      });

      if (completionRow) {
        await supabaseService.delete(TABLES.HABIT_COMPLETIONS, completionRow.id);
      }
    } catch (error) {
      console.error('Failed to remove habit completion row:', error);
    }
  },

  pauseHabit: async (habitId, until) => {
    const previousHabit = get().habits.find((habit) => habit.id === habitId);
    if (previousHabit) {
      set((state) => ({
        habits: state.habits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                isPaused: true,
                pausedUntil: until,
              }
            : habit
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.HABITS, habitId, {
        is_paused: true,
        paused_until: until,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to pause habit:', error);
      if (previousHabit) {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? previousHabit : habit)),
        }));
      }
      throw error;
    }
  },

  resumeHabit: async (habitId) => {
    const previousHabit = get().habits.find((habit) => habit.id === habitId);
    if (previousHabit) {
      set((state) => ({
        habits: state.habits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                isPaused: false,
                pausedUntil: undefined,
              }
            : habit
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.HABITS, habitId, {
        is_paused: false,
        paused_until: null,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to resume habit:', error);
      if (previousHabit) {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? previousHabit : habit)),
        }));
      }
      throw error;
    }
  },

  // === HABIT CATEGORY ACTIONS ===
  addHabitCategory: (category) => {
    const userId = get().userId;
    const newCategory: HabitCategoryItem = {
      id: uuidv4(),
      userId: userId || '',
      ...category,
    };

    set((state) => ({
      habitCategories: [...state.habitCategories, newCategory],
    }));

    if (userId) {
      void supabaseService.create(TABLES.HABIT_CATEGORIES, {
        id: newCategory.id,
        user_id: userId,
        name: newCategory.name,
        emoji: newCategory.emoji,
        color: newCategory.color,
      });
    }

    return newCategory;
  },

  deleteHabitCategory: (id) => {
    set((state) => ({
      habitCategories: state.habitCategories.filter(cat => cat.id !== id),
    }));

    void supabaseService.delete(TABLES.HABIT_CATEGORIES, id);
  },

  // === HABIT HELPER FUNCTIONS ===
  isHabitCompletedToday: (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    return get().habits.some(
      (habit) =>
        habit.id === habitId &&
        (habit.completions || []).some(
          (completion) => getCompletionDateKey(completion as HabitCompletionRecord) === today
        )
    );
  },

  getHabitCompletionsThisWeek: (habitId) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    return (habit.completions || []).filter((completion) => {
      const completionDate = parseCompletionDate(completion as HabitCompletionRecord);
      if (!completionDate) return false;
      return completionDate >= weekStart && completionDate <= weekEnd;
    }).length;
  },

  calculateStreak: (habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0;

    let streak = 0;
    const sortedCompletions = [...(habit.completions || [])].sort((a, b) => {
      const dateA = parseCompletionDate(a as HabitCompletionRecord)?.getTime() || 0;
      const dateB = parseCompletionDate(b as HabitCompletionRecord)?.getTime() || 0;
      return dateB - dateA;
    });

    let currentDate = new Date();
    for (const completion of sortedCompletions) {
      const compDate = parseCompletionDate(completion as HabitCompletionRecord);
      if (!compDate) continue;

      if (isSameDay(currentDate, compDate) || isSameDay(new Date(currentDate.getTime() - 86400000), compDate)) {
        streak++;
        currentDate = compDate;
      } else {
        break;
      }
    }

    return streak;
  },

  // === TAG ACTIONS ===
  addTag: async (tagData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const tagId = await supabaseService.create(TABLES.TAGS, {
      ...tagData,
      user_id: userId,
      created_at: new Date(),
    });

    return {
      id: tagId,
      userId,
      ...tagData,
      createdAt: new Date(),
    } as Tag;
  },

  updateTag: async (id, updates) => {
    await supabaseService.update(TABLES.TAGS, id, updates);
  },

  deleteTag: async (id) => {
    await supabaseService.delete(TABLES.TAGS, id);
  },

  // === NOTE ACTIONS ===
  addNote: async (noteData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const now = new Date();
    const optimisticNote: Note = {
      id: temporaryId,
      userId,
      ...noteData,
      tags: noteData.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      notes: [optimisticNote, ...state.notes],
    }));

    try {
      const noteId = await supabaseService.create(TABLES.NOTES, {
        ...noteData,
        user_id: userId,
        created_at: now,
        updated_at: now,
      });

      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === temporaryId
            ? {
                ...note,
                id: noteId,
              }
            : note
        ),
      }));

      return {
        ...optimisticNote,
        id: noteId,
      };
    } catch (error) {
      console.error('Failed to add note:', error);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    const previousNote = get().notes.find((note) => note.id === id);
    const updatedAt = new Date();

    if (previousNote) {
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id
            ? {
                ...note,
                ...updates,
                updatedAt,
              }
            : note
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.NOTES, id, {
        ...updates,
        updated_at: updatedAt,
      });
    } catch (error) {
      console.error('Failed to update note:', error);
      if (previousNote) {
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? previousNote : note)),
        }));
      }
      throw error;
    }
  },

  deleteNote: async (id) => {
    const notesSnapshot = get().notes;
    const removedIndex = notesSnapshot.findIndex((note) => note.id === id);
    const removedNote = removedIndex >= 0 ? notesSnapshot[removedIndex] : null;

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.NOTES, id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      if (removedNote) {
        set((state) => {
          if (state.notes.some((note) => note.id === id)) {
            return state;
          }

          const restoredNotes = [...state.notes];
          const insertAt = Math.min(removedIndex, restoredNotes.length);
          restoredNotes.splice(insertAt, 0, removedNote);
          return { notes: restoredNotes };
        });
      }
      throw error;
    }
  },

  archiveNote: async (id) => {
    const previousNote = get().notes.find((note) => note.id === id);
    const archivedAt = new Date();

    if (previousNote) {
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id
            ? {
                ...note,
                archivedAt,
                updatedAt: archivedAt,
              }
            : note
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.NOTES, id, {
        is_archived: true,
        archived_at: archivedAt,
        updated_at: archivedAt,
      });
    } catch (error) {
      console.error('Failed to archive note:', error);
      if (previousNote) {
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? previousNote : note)),
        }));
      }
      throw error;
    }
  },

  // === BRAINSTORM ACTIONS ===
  addBrainstormSession: async (sessionData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const temporaryId = `temp-${uuidv4()}`;
    const now = new Date();
    const optimisticSession: BrainstormSession = {
      id: temporaryId,
      userId,
      ...sessionData,
      ideas: sessionData.ideas ?? [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      brainstormSessions: [optimisticSession, ...state.brainstormSessions],
    }));

    try {
      const sessionId = await supabaseService.create(TABLES.BRAINSTORM_SESSIONS, {
        ...sessionData,
        user_id: userId,
        created_at: now,
        updated_at: now,
      });

      set((state) => ({
        brainstormSessions: state.brainstormSessions.map((session) =>
          session.id === temporaryId
            ? {
                ...session,
                id: sessionId,
              }
            : session
        ),
      }));

      return {
        ...optimisticSession,
        id: sessionId,
      };
    } catch (error) {
      console.error('Failed to add brainstorm session:', error);
      set((state) => ({
        brainstormSessions: state.brainstormSessions.filter((session) => session.id !== temporaryId),
      }));
      throw error;
    }
  },

  updateBrainstormSession: async (id, updates) => {
    const previousSession = get().brainstormSessions.find((session) => session.id === id);
    const updatedAt = new Date();

    if (previousSession) {
      set((state) => ({
        brainstormSessions: state.brainstormSessions.map((session) =>
          session.id === id
            ? {
                ...session,
                ...updates,
                updatedAt,
              }
            : session
        ),
      }));
    }

    try {
      await supabaseService.update(TABLES.BRAINSTORM_SESSIONS, id, {
        ...updates,
        updated_at: updatedAt,
      });
    } catch (error) {
      console.error('Failed to update brainstorm session:', error);
      if (previousSession) {
        set((state) => ({
          brainstormSessions: state.brainstormSessions.map((session) => (session.id === id ? previousSession : session)),
        }));
      }
      throw error;
    }
  },

  deleteBrainstormSession: async (id) => {
    const sessionsSnapshot = get().brainstormSessions;
    const removedIndex = sessionsSnapshot.findIndex((session) => session.id === id);
    const removedSession = removedIndex >= 0 ? sessionsSnapshot[removedIndex] : null;

    set((state) => ({
      brainstormSessions: state.brainstormSessions.filter((session) => session.id !== id),
    }));

    try {
      await supabaseService.delete(TABLES.BRAINSTORM_SESSIONS, id);
    } catch (error) {
      console.error('Failed to delete brainstorm session:', error);
      if (removedSession) {
        set((state) => {
          if (state.brainstormSessions.some((session) => session.id === id)) {
            return state;
          }

          const restoredSessions = [...state.brainstormSessions];
          const insertAt = Math.min(removedIndex, restoredSessions.length);
          restoredSessions.splice(insertAt, 0, removedSession);
          return { brainstormSessions: restoredSessions };
        });
      }
      throw error;
    }
  },

  // === TIME TRACKING ACTIONS ===
  startTimeTracking: async (taskId, description) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    // Stop any active time entry first
    const activeEntry = get().activeTimeEntry;
    if (activeEntry) {
      await get().stopTimeTracking();
    }

    // Create new time entry
    await supabaseService.create(TABLES.TIME_ENTRIES, {
      user_id: userId,
      task_id: taskId,
      description,
      start_time: new Date(),
      is_running: true,
      created_at: new Date(),
    });
  },

  stopTimeTracking: async () => {
    if (get().activeTimeEntry) {
      const endTime = new Date();
      const startTime = new Date(get().activeTimeEntry!.startTime);
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

      await supabaseService.update(TABLES.TIME_ENTRIES, get().activeTimeEntry!.id, {
        end_time: endTime,
        duration: durationMinutes,
        is_running: false,
        updated_at: new Date(),
      });
    }
  },

  addManualTimeEntry: async (entryData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.TIME_ENTRIES, {
      ...entryData,
      user_id: userId,
      is_running: false,
      created_at: new Date(),
    });
  },

  deleteTimeEntry: async (id) => {
    await supabaseService.delete(TABLES.TIME_ENTRIES, id);
  },

  getTimeEntriesForTask: (taskId) => {
    return get().timeEntries.filter(te => te.taskId === taskId);
  },

  getTotalTimeForTask: (taskId) => {
    return get().timeEntries
      .filter(te => te.taskId === taskId)
      .reduce((total, te) => total + (te.duration || 0), 0);
  },
}));
