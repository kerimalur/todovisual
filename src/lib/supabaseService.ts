import { supabase } from './supabase';
import {
  Task,
  Goal,
  Project,
  CalendarEvent,
  JournalEntry,
  FocusSession,
  Habit,
  HabitCompletion,
  HabitCategoryItem,
  Tag,
  Note,
  TimeEntry,
  BrainstormSession,
} from '@/types';
import { snakeToCamel, camelToSnake } from './transformers';

// Table names
export const TABLES = {
  TASKS: 'tasks',
  GOALS: 'goals',
  PROJECTS: 'projects',
  EVENTS: 'calendar_events',
  HABITS: 'habits',
  HABIT_COMPLETIONS: 'habit_completions',
  HABIT_CATEGORIES: 'habit_categories',
  JOURNAL_ENTRIES: 'journal_entries',
  FOCUS_SESSIONS: 'focus_sessions',
  TAGS: 'tags',
  NOTES: 'notes',
  BRAINSTORM_SESSIONS: 'brainstorm_sessions',
  TIME_ENTRIES: 'time_entries',
  SUBTASKS: 'subtasks',
  MILESTONES: 'milestones',
  METRICS: 'metrics',
  BRAINSTORM_IDEAS: 'brainstorm_ideas',
  WEEKLY_REFLECTIONS: 'weekly_reflections',
  DAILY_STATS: 'daily_stats',
} as const;

interface SupabaseError {
  message: string;
  details?: string;
}

export const supabaseService = {
  // Generic CRUD operations
  async create<T>(tableName: string, data: T): Promise<string> {
    const snakeData = camelToSnake(data);
    const { data: result, error } = await supabase
      .from(tableName)
      .insert([snakeData])
      .select('id')
      .single();

    if (error) {
      console.error(`Error creating ${tableName}:`, error);
      throw new Error(error.message);
    }

    return result?.id as string;
  },

  async read<T>(tableName: string, id: string): Promise<T> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error reading from ${tableName}:`, error);
      throw new Error(error.message);
    }

    return snakeToCamel(data) as T;
  },

  async readMany<T>(tableName: string, userId: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`Error reading from ${tableName}:`, error);
      throw new Error(error.message);
    }

    return snakeToCamel(data || []) as T[];
  },

  async update(tableName: string, id: string, data: Partial<any>): Promise<void> {
    const snakeData = camelToSnake(data);
    const { error } = await supabase
      .from(tableName)
      .update(snakeData)
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw new Error(error.message);
    }
  },

  async delete(tableName: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw new Error(error.message);
    }
  },

  // Real-time subscriptions
  subscribe<T>(tableName: string, userId: string, callback: (data: T[]) => void, orderByField?: string): (() => void) {
    const channel = supabase
      .channel(`${tableName}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // When any change occurs, refetch the data
          supabaseService.readMany<T>(tableName, userId).then(callback);
        }
      )
      .subscribe();

    // Initial fetch
    supabaseService.readMany<T>(tableName, userId).then(callback);

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Specific methods for common operations
  async getTasksByUser(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Task[];
  },

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Task[];
  },

  async getGoalsByUser(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from(TABLES.GOALS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Goal[];
  },

  async getProjectsByUser(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Project[];
  },

  async getHabitsByUser(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from(TABLES.HABITS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Habit[];
  },

  async getHabitCompletions(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from(TABLES.HABIT_COMPLETIONS)
      .select('*')
      .eq('habit_id', habitId)
      .gte('completion_date', startDate.toISOString().split('T')[0])
      .lte('completion_date', endDate.toISOString().split('T')[0])
      .order('completion_date', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as HabitCompletion[];
  },

  async getEventsByUser(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as CalendarEvent[];
  },

  async getJournalEntry(userId: string, date: Date): Promise<JournalEntry | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from(TABLES.JOURNAL_ENTRIES)
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', dateStr)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? snakeToCamel(data) as JournalEntry : null;
  },

  async getActiveTimeEntry(userId: string): Promise<TimeEntry | null> {
    const { data, error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .select('*')
      .eq('user_id', userId)
      .eq('is_running', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? snakeToCamel(data) as TimeEntry : null;
  },

  async getNotesByUser(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from(TABLES.NOTES)
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as Note[];
  },

  async getBrainstormSessionsByUser(userId: string): Promise<BrainstormSession[]> {
    const { data, error } = await supabase
      .from(TABLES.BRAINSTORM_SESSIONS)
      .select('*, brainstorm_ideas(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return snakeToCamel(data || []) as BrainstormSession[];
  },

  // Batch operations
  async batchUpdateTasks(ids: string[], updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .update(updates)
      .in('id', ids);

    if (error) throw new Error(error.message);
  },

  async batchDeleteTasks(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .in('id', ids);

    if (error) throw new Error(error.message);
  },

  // Auth-related
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw new Error(error.message);
    return user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};
