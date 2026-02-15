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
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

interface DataStore {
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
  addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  reactivateTask: (id: string) => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;

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

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial State
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

    set({ loading: true });

    // Subscribe to all collections
    const unsubTasks = firestoreService.subscribe<Task>(
      COLLECTIONS.TASKS,
      userId,
      (tasks) => set({ tasks, loading: false })
    );

    const unsubGoals = firestoreService.subscribe<Goal>(
      COLLECTIONS.GOALS,
      userId,
      (goals) => set({ goals })
    );

    const unsubProjects = firestoreService.subscribe<Project>(
      COLLECTIONS.PROJECTS,
      userId,
      (projects) => set({ projects })
    );

    const unsubEvents = firestoreService.subscribe<CalendarEvent>(
      COLLECTIONS.EVENTS,
      userId,
      (events) => set({ events })
    );

    const unsubHabits = firestoreService.subscribe<Habit>(
      COLLECTIONS.HABITS,
      userId,
      (habits) => set({ habits })
    );

    const unsubHabitCategories = firestoreService.subscribe<HabitCategoryItem>(
      COLLECTIONS.HABIT_CATEGORIES,
      userId,
      (habitCategories) => set({ habitCategories })
    );

    const unsubJournal = firestoreService.subscribe<JournalEntry>(
      COLLECTIONS.JOURNAL_ENTRIES,
      userId,
      (journalEntries) => set({ journalEntries })
    );

    const unsubFocus = firestoreService.subscribe<FocusSession>(
      COLLECTIONS.FOCUS_SESSIONS,
      userId,
      (focusSessions) => set({ focusSessions })
    );

    const unsubTags = firestoreService.subscribe<Tag>(
      COLLECTIONS.TAGS,
      userId,
      (tags) => set({ tags })
    );

    const unsubNotes = firestoreService.subscribe<Note>(
      COLLECTIONS.NOTES,
      userId,
      (notes) => set({ notes })
    );

    const unsubTimeEntries = firestoreService.subscribe<TimeEntry>(
      COLLECTIONS.TIME_ENTRIES,
      userId,
      (timeEntries) => {
        const activeEntry = timeEntries.find(e => e.isRunning);
        set({ timeEntries, activeTimeEntry: activeEntry || null });
      }
    );

    const unsubBrainstorm = firestoreService.subscribe<BrainstormSession>(
      COLLECTIONS.BRAINSTORM_SESSIONS,
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
    set({ initialized: false });
  },

  // === TASK ACTIONS ===
  addTask: async (taskData) => {
    const userId = get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.TASKS, {
      ...taskData,
      userId,
      createdAt: new Date(),
      status: taskData.status || 'todo',
      tags: taskData.tags || [],
    });
  },

  updateTask: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.TASKS, id, updates);
  },

  deleteTask: async (id) => {
    await firestoreService.delete(COLLECTIONS.TASKS, id);
  },

  completeTask: async (id) => {
    await firestoreService.update(COLLECTIONS.TASKS, id, {
      status: 'completed',
      completedAt: new Date(),
    });
  },

  archiveTask: async (id) => {
    await firestoreService.update(COLLECTIONS.TASKS, id, {
      status: 'archived',
      archivedAt: new Date(),
    });
  },

  reactivateTask: async (id) => {
    await firestoreService.update(COLLECTIONS.TASKS, id, {
      status: 'todo',
      archivedAt: undefined,
    });
  },

  deleteCompletedTasks: async () => {
    const completedTasks = get().tasks.filter((t) => t.status === 'completed');
    await Promise.all(
      completedTasks.map((task) => firestoreService.delete(COLLECTIONS.TASKS, task.id))
    );
  },

  // === GOAL ACTIONS ===
  addGoal: async (goalData) => {
    const userId = get().goals[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.GOALS, {
      ...goalData,
      userId,
      createdAt: new Date(),
      progress: goalData.progress || 0,
    });
  },

  updateGoal: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.GOALS, id, updates);
  },

  deleteGoal: async (id) => {
    await firestoreService.delete(COLLECTIONS.GOALS, id);
  },

  // === PROJECT ACTIONS ===
  addProject: async (projectData) => {
    const userId = get().projects[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.PROJECTS, {
      ...projectData,
      userId,
      createdAt: new Date(),
      status: projectData.status || 'planning',
    });
  },

  updateProject: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.PROJECTS, id, updates);
  },

  deleteProject: async (id) => {
    await firestoreService.delete(COLLECTIONS.PROJECTS, id);
  },

  // === EVENT ACTIONS ===
  addEvent: async (eventData) => {
    const userId = get().events[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.EVENTS, {
      ...eventData,
      userId,
    });
  },

  updateEvent: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.EVENTS, id, updates);
  },

  deleteEvent: async (id) => {
    await firestoreService.delete(COLLECTIONS.EVENTS, id);
  },

  // === JOURNAL ACTIONS ===
  addJournalEntry: async (entryData) => {
    const userId = get().journalEntries[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.JOURNAL_ENTRIES, {
      ...entryData,
      userId,
      tags: entryData.tags || [],
    });
  },

  updateJournalEntry: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.JOURNAL_ENTRIES, id, updates);
  },

  deleteJournalEntry: async (id) => {
    await firestoreService.delete(COLLECTIONS.JOURNAL_ENTRIES, id);
  },

  // === HABIT ACTIONS ===
  addHabit: async (habitData) => {
    const userId = get().habits[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    await firestoreService.create(COLLECTIONS.HABITS, {
      ...habitData,
      userId,
      createdAt: new Date(),
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completions: [],
      isActive: true,
      reminderEnabled: habitData.reminderEnabled || false,
    });
  },

  updateHabit: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.HABITS, id, updates);
  },

  deleteHabit: async (id) => {
    await firestoreService.delete(COLLECTIONS.HABITS, id);
  },

  completeHabit: async (habitId, date = new Date()) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const completionDate = new Date(date);
    completionDate.setHours(0, 0, 0, 0);

    // Check if already completed
    const alreadyCompleted = habit.completions.some((c) =>
      isSameDay(new Date(c.date), completionDate)
    );
    if (alreadyCompleted) return;

    const newCompletion: HabitCompletion = {
      id: uuidv4(),
      date: completionDate,
    };

    const updatedCompletions = [...habit.completions, newCompletion];
    const newStreak = get().calculateStreak({ ...habit, completions: updatedCompletions });

    await firestoreService.update(COLLECTIONS.HABITS, habitId, {
      completions: updatedCompletions,
      currentStreak: newStreak,
      longestStreak: Math.max(habit.longestStreak, newStreak),
      totalCompletions: habit.totalCompletions + 1,
    });
  },

  uncompleteHabit: async (habitId, date = new Date()) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const completionDate = new Date(date);
    completionDate.setHours(0, 0, 0, 0);

    const updatedCompletions = habit.completions.filter(
      (c) => !isSameDay(new Date(c.date), completionDate)
    );

    const newStreak = get().calculateStreak({ ...habit, completions: updatedCompletions });

    await firestoreService.update(COLLECTIONS.HABITS, habitId, {
      completions: updatedCompletions,
      currentStreak: newStreak,
      totalCompletions: Math.max(0, habit.totalCompletions - 1),
    });
  },

  pauseHabit: async (habitId, until) => {
    await firestoreService.update(COLLECTIONS.HABITS, habitId, {
      isPaused: true,
      pausedUntil: until,
    });
  },

  resumeHabit: async (habitId) => {
    await firestoreService.update(COLLECTIONS.HABITS, habitId, {
      isPaused: false,
      pausedUntil: undefined,
    });
  },

  // === HABIT CATEGORY ACTIONS ===
  addHabitCategory: (categoryData) => {
    const userId = get().habits[0]?.userId || get().tasks[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    const newCategory: HabitCategoryItem = {
      id: uuidv4(),
      userId,
      ...categoryData,
    };

    firestoreService.create(COLLECTIONS.HABIT_CATEGORIES, newCategory);

    return newCategory;
  },

  deleteHabitCategory: async (id) => {
    await firestoreService.delete(COLLECTIONS.HABIT_CATEGORIES, id);
  },

  // === HABIT HELPER FUNCTIONS ===
  isHabitCompletedToday: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return false;

    return habit.completions.some((c) => isSameDay(new Date(c.date), new Date()));
  },

  getHabitCompletionsThisWeek: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return habit.completions.filter((c) => {
      const date = new Date(c.date);
      return date >= weekStart && date <= weekEnd;
    }).length;
  },

  calculateStreak: (habit) => {
    if (habit.completions.length === 0) return 0;

    const sortedCompletions = [...habit.completions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestCompletion = new Date(sortedCompletions[0].date);
    latestCompletion.setHours(0, 0, 0, 0);

    // Streak broken if last completion is more than 1 day ago
    if (latestCompletion < yesterday) return 0;

    let streak = 0;
    let checkDate = new Date(today);

    for (const completion of sortedCompletions) {
      const compDate = new Date(completion.date);
      compDate.setHours(0, 0, 0, 0);

      while (checkDate > compDate) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      if (isSameDay(checkDate, compDate)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  // === TAG ACTIONS ===
  addTag: async (tagData) => {
    const userId = get().tasks[0]?.userId || get().goals[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    const newTag: Tag = {
      id: uuidv4(),
      userId,
      ...tagData,
      createdAt: new Date(),
    };

    await firestoreService.create(COLLECTIONS.TAGS, newTag);
    return newTag;
  },

  updateTag: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.TAGS, id, updates);
  },

  deleteTag: async (id) => {
    await firestoreService.delete(COLLECTIONS.TAGS, id);
  },

  // === NOTE ACTIONS ===
  addNote: async (noteData) => {
    const userId = get().tasks[0]?.userId || get().goals[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    const newNote: Note = {
      id: uuidv4(),
      userId,
      ...noteData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreService.create(COLLECTIONS.NOTES, newNote);
    return newNote;
  },

  updateNote: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.NOTES, id, { ...updates, updatedAt: new Date() });
  },

  deleteNote: async (id) => {
    await firestoreService.delete(COLLECTIONS.NOTES, id);
  },

  archiveNote: async (id) => {
    await firestoreService.update(COLLECTIONS.NOTES, id, { archivedAt: new Date() });
  },

  // === BRAINSTORM ACTIONS ===
  addBrainstormSession: async (sessionData) => {
    const userId = get().tasks[0]?.userId || get().goals[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    const newSession: BrainstormSession = {
      id: uuidv4(),
      userId,
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreService.create(COLLECTIONS.BRAINSTORM_SESSIONS, newSession);
    return newSession;
  },

  updateBrainstormSession: async (id, updates) => {
    await firestoreService.update(COLLECTIONS.BRAINSTORM_SESSIONS, id, { ...updates, updatedAt: new Date() });
  },

  deleteBrainstormSession: async (id) => {
    await firestoreService.delete(COLLECTIONS.BRAINSTORM_SESSIONS, id);
  },

  // === TIME TRACKING ACTIONS ===
  startTimeTracking: async (taskId, description) => {
    const userId = get().tasks[0]?.userId || get().goals[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    // Stop any currently running time entry
    const currentActive = get().activeTimeEntry;
    if (currentActive) {
      await get().stopTimeTracking();
    }

    const newEntry: TimeEntry = {
      id: uuidv4(),
      userId,
      taskId,
      description,
      startTime: new Date(),
      isRunning: true,
      createdAt: new Date(),
    };

    await firestoreService.create(COLLECTIONS.TIME_ENTRIES, newEntry);
    set({ activeTimeEntry: newEntry });
  },

  stopTimeTracking: async () => {
    const activeEntry = get().activeTimeEntry;
    if (!activeEntry) return;

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - new Date(activeEntry.startTime).getTime()) / 60000); // in Minuten

    await firestoreService.update(COLLECTIONS.TIME_ENTRIES, activeEntry.id, {
      endTime,
      duration,
      isRunning: false,
    });

    // Update task's actualMinutes
    const task = get().tasks.find(t => t.id === activeEntry.taskId);
    if (task) {
      const totalTime = get().getTotalTimeForTask(activeEntry.taskId);
      await firestoreService.update(COLLECTIONS.TASKS, activeEntry.taskId, {
        actualMinutes: totalTime + duration,
      });
    }

    set({ activeTimeEntry: null });
  },

  addManualTimeEntry: async (entryData) => {
    const userId = get().tasks[0]?.userId || get().goals[0]?.userId;
    if (!userId) throw new Error('User not authenticated');

    const newEntry: TimeEntry = {
      id: uuidv4(),
      userId,
      ...entryData,
      isRunning: false,
      createdAt: new Date(),
    };

    await firestoreService.create(COLLECTIONS.TIME_ENTRIES, newEntry);
  },

  deleteTimeEntry: async (id) => {
    await firestoreService.delete(COLLECTIONS.TIME_ENTRIES, id);
  },

  getTimeEntriesForTask: (taskId) => {
    return get().timeEntries.filter(e => e.taskId === taskId);
  },

  getTotalTimeForTask: (taskId) => {
    const entries = get().timeEntries.filter(e => e.taskId === taskId && !e.isRunning);
    return entries.reduce((total, e) => total + (e.duration || 0), 0);
  },
}));
