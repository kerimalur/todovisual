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
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

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
  addTask: async (taskData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.TASKS, {
      ...taskData,
      user_id: userId,
      created_at: new Date(),
      status: taskData.status || 'todo',
      tags: taskData.tags || [],
    });
  },

  updateTask: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.TASKS, id, updateData);
  },

  deleteTask: async (id) => {
    await supabaseService.delete(TABLES.TASKS, id);
  },

  completeTask: async (id) => {
    await supabaseService.update(TABLES.TASKS, id, {
      status: 'completed',
      completed_at: new Date(),
      updated_at: new Date(),
    });
  },

  archiveTask: async (id) => {
    await supabaseService.update(TABLES.TASKS, id, {
      status: 'archived',
      archived_at: new Date(),
      updated_at: new Date(),
    });
  },

  reactivateTask: async (id) => {
    await supabaseService.update(TABLES.TASKS, id, {
      status: 'todo',
      archived_at: null,
      updated_at: new Date(),
    });
  },

  deleteCompletedTasks: async () => {
    const completedTasks = get().tasks.filter((t) => t.status === 'completed');
    await Promise.all(
      completedTasks.map((task) => supabaseService.delete(TABLES.TASKS, task.id))
    );
  },

  // === GOAL ACTIONS ===
  addGoal: async (goalData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.GOALS, {
      ...goalData,
      user_id: userId,
      created_at: new Date(),
      progress: goalData.progress || 0,
    });
  },

  updateGoal: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.GOALS, id, updateData);
  },

  deleteGoal: async (id) => {
    await supabaseService.delete(TABLES.GOALS, id);
  },

  // === PROJECT ACTIONS ===
  addProject: async (projectData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.PROJECTS, {
      ...projectData,
      user_id: userId,
      created_at: new Date(),
      status: projectData.status || 'planning',
    });
  },

  updateProject: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.PROJECTS, id, updateData);
  },

  deleteProject: async (id) => {
    await supabaseService.delete(TABLES.PROJECTS, id);
  },

  // === EVENT ACTIONS ===
  addEvent: async (eventData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.EVENTS, {
      ...eventData,
      user_id: userId,
    });
  },

  updateEvent: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.EVENTS, id, updateData);
  },

  deleteEvent: async (id) => {
    await supabaseService.delete(TABLES.EVENTS, id);
  },

  // === JOURNAL ACTIONS ===
  addJournalEntry: async (entryData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.JOURNAL_ENTRIES, {
      ...entryData,
      user_id: userId,
    });
  },

  updateJournalEntry: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.JOURNAL_ENTRIES, id, updateData);
  },

  deleteJournalEntry: async (id) => {
    await supabaseService.delete(TABLES.JOURNAL_ENTRIES, id);
  },

  // === HABIT ACTIONS ===
  addHabit: async (habitData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    await supabaseService.create(TABLES.HABITS, {
      ...habitData,
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      created_at: new Date(),
    });
  },

  updateHabit: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.HABITS, id, updateData);
  },

  deleteHabit: async (id) => {
    await supabaseService.delete(TABLES.HABITS, id);
  },

  completeHabit: async (habitId, date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];

    // Add completion record
    await supabaseService.create(TABLES.HABIT_COMPLETIONS, {
      habit_id: habitId,
      completion_date: dateStr,
      created_at: new Date(),
    });

    // Update habit streak
    const habit = get().habits.find(h => h.id === habitId);
    if (habit) {
      await get().updateHabit(habitId, {
        totalCompletions: (habit.totalCompletions || 0) + 1,
      });
    }
  },

  uncompleteHabit: async (habitId, date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];

    // Delete completion record
    const completions = await supabaseService.readMany<HabitCompletion>(TABLES.HABIT_COMPLETIONS, habitId);
    const completion = completions.find(c => new Date(c.date).toISOString().split('T')[0] === dateStr);
    if (completion) {
      await supabaseService.delete(TABLES.HABIT_COMPLETIONS, completion.id);
    }
  },

  pauseHabit: async (habitId, until) => {
    await supabaseService.update(TABLES.HABITS, habitId, {
      is_paused: true,
      paused_until: until,
      updated_at: new Date(),
    });
  },

  resumeHabit: async (habitId) => {
    await supabaseService.update(TABLES.HABITS, habitId, {
      is_paused: false,
      paused_until: null,
      updated_at: new Date(),
    });
  },

  // === HABIT CATEGORY ACTIONS ===
  addHabitCategory: (category) => {
    const newCategory: HabitCategoryItem = {
      id: uuidv4(),
      userId: '',
      ...category,
    };
    set((state) => ({
      habitCategories: [...state.habitCategories, newCategory],
    }));
    return newCategory;
  },

  deleteHabitCategory: (id) => {
    set((state) => ({
      habitCategories: state.habitCategories.filter(cat => cat.id !== id),
    }));
  },

  // === HABIT HELPER FUNCTIONS ===
  isHabitCompletedToday: (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    return get().habits.some(h => h.id === habitId && h.completions?.some(c => new Date(c.date).toISOString().split('T')[0] === today));
  },

  getHabitCompletionsThisWeek: (habitId) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    return (habit.completions || []).filter(c => {
      const compDate = new Date(c.date);
      return compDate >= weekStart && compDate <= weekEnd;
    }).length;
  },

  calculateStreak: (habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0;

    let streak = 0;
    const sortedCompletions = [...(habit.completions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentDate = new Date();
    for (const completion of sortedCompletions) {
      const compDate = new Date(completion.date);
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

    const noteId = await supabaseService.create(TABLES.NOTES, {
      ...noteData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: noteId,
      userId,
      ...noteData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Note;
  },

  updateNote: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.NOTES, id, updateData);
  },

  deleteNote: async (id) => {
    await supabaseService.delete(TABLES.NOTES, id);
  },

  archiveNote: async (id) => {
    await supabaseService.update(TABLES.NOTES, id, {
      is_archived: true,
      archived_at: new Date(),
      updated_at: new Date(),
    });
  },

  // === BRAINSTORM ACTIONS ===
  addBrainstormSession: async (sessionData) => {
    const userId = get().userId;
    if (!userId) throw new Error('User not authenticated');

    const sessionId = await supabaseService.create(TABLES.BRAINSTORM_SESSIONS, {
      ...sessionData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: sessionId,
      userId,
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      ideas: [],
    } as BrainstormSession;
  },

  updateBrainstormSession: async (id, updates) => {
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };
    await supabaseService.update(TABLES.BRAINSTORM_SESSIONS, id, updateData);
  },

  deleteBrainstormSession: async (id) => {
    await supabaseService.delete(TABLES.BRAINSTORM_SESSIONS, id);
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
        duration_minutes: durationMinutes,
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
