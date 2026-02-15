// Types for the Productivity Suite

export type GoalCategory = 'health' | 'career' | 'finance' | 'relationships' | 'personal' | 'education' | 'creative' | 'other';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

// Spezialisierte Projekt-Kategorien
export type ProjectCategory = 
  | 'trading'      // Trading & Investment
  | 'finance'      // Finanzen & Budgetierung
  | 'fitness'      // Gym & Körperliche Fitness
  | 'health'       // Gesundheit & Wellness
  | 'wealth'       // Vermögensaufbau
  | 'programming'  // Programmieren & Tech
  | 'improvement'  // Stetige Verbesserung
  | 'other';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Milestone {
  id: string;
  title: string;
  targetDate?: Date;
  completed: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ProjectMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  lastUpdated: Date;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: Date;
  createdAt: Date;
  progress: number; // 0-100
  color: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  milestones?: Milestone[];
  motivation?: string; // Warum ist dieses Ziel wichtig?
  reward?: string; // Belohnung bei Erreichen
}

export interface Project {
  id: string;
  userId: string;
  goalId?: string; // Optional - Projects can be independent
  title: string;
  description: string;
  deadline?: Date;
  createdAt: Date;
  startDate?: Date;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  category: ProjectCategory;
  priority: ProjectPriority;
  color?: string;
  milestones?: ProjectMilestone[];
  metrics?: ProjectMetric[];
  tags?: string[];
  notes?: string;
  // Kategorie-spezifische Felder
  tradingData?: {
    strategy?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    targetReturn?: number;
    currentReturn?: number;
  };
  fitnessData?: {
    workoutDays?: number[];
    exerciseType?: string;
    targetWeight?: number;
    currentWeight?: number;
  };
  financeData?: {
    budget?: number;
    spent?: number;
    savingsTarget?: number;
    currentSavings?: number;
  };
  programmingData?: {
    techStack?: string[];
    repository?: string;
    deploymentUrl?: string;
  };
}

export type TaskImpact = 'goal-advancing' | 'maintenance' | 'filler' | 'urgent-important' | 'urgent-not-important';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  archivedAt?: Date; // Für Archivierung
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'archived';
  estimatedMinutes?: number;
  actualMinutes?: number; // Tatsächlich aufgewendete Zeit
  tags: string[];
  impact?: TaskImpact; // Bringt die Aufgabe dem Ziel näher?
  energyLevel?: 'low' | 'medium' | 'high'; // Benötigte Energie
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 für Montag-Sonntag
    interval?: number; // Alle N Tage/Wochen/Monate
    endDate?: Date;
    nextOccurrence?: Date; // Auto-berechnet
    isActive: boolean; // Kann pausiert werden
  };
  // Für Future Features (optional)
  parentTaskId?: string; // Sub-tasks
  subtasks?: SubTask[];
  focusSessionIds?: string[]; // Link zu Focus Sessions
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  color?: string;
  taskId?: string; // Link to task if applicable
  // Time Blocking
  eventType?: 'event' | 'time-block' | 'focus-time' | 'meeting' | 'break';
  isTimeBlock?: boolean;
  linkedTaskId?: string; // Für Time-Blocks mit verlinkter Aufgabe
  // Google Calendar Sync
  googleEventId?: string; // ID vom Google Calendar Event
  isFromGoogleCalendar?: boolean;
  lastSyncedAt?: Date;
}

export interface DailyReflection {
  productivity: 1 | 2 | 3 | 4 | 5; // 1-5 Sterne
  energy: 1 | 2 | 3 | 4 | 5;
  focus: 1 | 2 | 3 | 4 | 5;
  wentWell?: string;
  couldImprove?: string;
  gratitude?: string;
  tomorrowPriority?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  content: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags: string[];
  reflection?: DailyReflection;
  completedTasks?: number;
  focusMinutes?: number;
  // Weekly Reflection (für Sonntag)
  isWeeklyReflection?: boolean;
  weeklyReflection?: WeeklyReflection;
}

export interface WeeklyReflection {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  // Rückblick
  wentWell: string;
  couldImprove: string;
  lessonsLearned?: string;
  proudOf?: string;
  // Statistiken (auto-berechnet)
  completedTasks: number;
  focusMinutes: number;
  habitsCompleted?: number;
  goalsProgress?: { goalId: string; progress: number }[];
  // Planung
  nextWeekPriorities?: string[];
  nextWeekGoals?: string[];
  nextWeekPlan: string;
  // Ratings
  productivityRating?: 1 | 2 | 3 | 4 | 5;
  energyRating?: 1 | 2 | 3 | 4 | 5;
  satisfactionRating?: 1 | 2 | 3 | 4 | 5;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  plannedMinutes: number;
  actualMinutes?: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  currentTaskId?: string;
  sessionId?: string;
}

export type ModalType = 
  | 'new-task' 
  | 'new-goal' 
  | 'new-project' 
  | 'new-event' 
  | 'timer-settings'
  | null;

// ===== HABITS/GEWOHNHEITEN =====

export type HabitFrequency = 'daily' | 'weekly' | 'specific-days';

// Custom habit category (user-defined)
export interface HabitCategoryItem {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
}

export interface HabitCompletion {
  id: string;
  date: Date; // Datum der Erledigung
  value?: number; // Optionaler Wert (z.B. Anzahl Seiten, Schritte, etc.)
  notes?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string; // User-defined category ID
  icon?: string; // Emoji oder Icon-Name
  color?: string;

  // Verknüpfungen
  goalId?: string;
  projectId?: string;
  
  // Frequenz-Einstellungen
  frequency: HabitFrequency;
  targetPerWeek?: number; // Für 'weekly': Ziel pro Woche (z.B. 4x Gym)
  specificDays?: number[]; // Für 'specific-days': 0=Mo, 1=Di, etc.
  
  // Tracking
  targetValue?: number; // Optionales Ziel (z.B. 10000 Schritte, 15 Seiten)
  targetUnit?: string; // Einheit (z.B. "Schritte", "Seiten", "Minuten")
  
  // Erinnerungen
  reminderTime?: string; // z.B. "08:00"
  reminderEnabled: boolean;
  
  // Energie-Level
  energyLevel?: 'low' | 'medium' | 'high';
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  
  // Streak & Statistiken
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  
  // Historie
  completions: HabitCompletion[];
  
  // Meta
  createdAt: Date;
  isActive: boolean;
  isPaused: boolean;
  pausedUntil?: Date;
  
  // Motivation
  motivation?: string; // Warum diese Gewohnheit?
  cue?: string; // Auslöser/Trigger
  reward?: string; // Belohnung nach Erledigung
  
  // Notizen für Habit-Stacking
  stackBefore?: string; // "Nach dem Aufstehen"
  stackAfter?: string; // "Vor dem Frühstück"
}

// ===== TAGS/LABELS =====

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
}

// ===== NOTIZEN & BRAINSTORMING =====

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'note' | 'brainstorm' | 'idea' | 'meeting-notes' | 'quick-capture';
  tags: string[];
  color?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  linkedTaskIds?: string[];
  linkedGoalIds?: string[];
  linkedProjectIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface BrainstormIdea {
  id: string;
  content: string;
  color?: string;
  position?: { x: number; y: number }; // Für Mind-Map
  parentId?: string; // Für verschachtelte Ideen
  createdAt: Date;
}

export interface BrainstormSession {
  id: string;
  userId: string;
  title: string;
  description?: string;
  ideas: BrainstormIdea[];
  linkedGoalId?: string;
  linkedProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== ZEITERFASSUNG =====

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in Minuten (berechnet oder manuell)
  isRunning: boolean;
  createdAt: Date;
}

// ===== STATISTIKEN =====

export interface DailyStats {
  date: Date;
  completedTasks: number;
  focusMinutes: number;
  habitsCompleted: number;
  habitsTotal: number;
  tasksCreated: number;
  productivityScore?: number; // 0-100
}

export interface WeeklyStats {
  weekStart: Date;
  weekEnd: Date;
  totalCompletedTasks: number;
  totalFocusMinutes: number;
  avgProductivityScore: number;
  avgHabitCompletion: number;
  mostProductiveDay?: string;
  topCategories?: { category: string; count: number }[];
}
