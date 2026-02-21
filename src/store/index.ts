import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TimerState, ModalType } from '@/types';

// ===== APP STATE STORE =====
interface AppState {
  sidebarCollapsed: boolean;
  zenModeActive: boolean;
  zenWorkspaceActive: boolean;
  currentModal: ModalType;
  fabMenuOpen: boolean;
  mobileSidebarOpen: boolean;

  toggleSidebar: () => void;
  toggleZenMode: () => void;
  toggleZenWorkspace: () => void;
  setModal: (modal: ModalType) => void;
  setFabMenuOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  zenModeActive: false,
  zenWorkspaceActive: false,
  currentModal: null,
  fabMenuOpen: false,
  mobileSidebarOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleZenMode: () => set((state) => ({ zenModeActive: !state.zenModeActive })),
  toggleZenWorkspace: () => set((state) => ({ zenWorkspaceActive: !state.zenWorkspaceActive })),
  setModal: (modal) => set({ currentModal: modal }),
  setFabMenuOpen: (open) => set({ fabMenuOpen: open }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}));

// ===== TIMER STORE =====
interface TimerStore {
  timer: TimerState;
  startTimer: (minutes: number, taskId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timer: {
    isRunning: false,
    isPaused: false,
    secondsRemaining: 0,
    totalSeconds: 0,
    currentTaskId: undefined,
    sessionId: undefined,
  },

  startTimer: (minutes, taskId) =>
    set({
      timer: {
        isRunning: true,
        isPaused: false,
        secondsRemaining: minutes * 60,
        totalSeconds: minutes * 60,
        currentTaskId: taskId,
        sessionId: uuidv4(),
      },
    }),

  pauseTimer: () =>
    set((state) => ({
      timer: { ...state.timer, isPaused: true },
    })),

  resumeTimer: () =>
    set((state) => ({
      timer: { ...state.timer, isPaused: false },
    })),

  stopTimer: () =>
    set({
      timer: {
        isRunning: false,
        isPaused: false,
        secondsRemaining: 0,
        totalSeconds: 0,
        currentTaskId: undefined,
        sessionId: undefined,
      },
    }),

  tick: () =>
    set((state) => {
      if (state.timer.secondsRemaining <= 0) {
        return { timer: { ...state.timer, isRunning: false } };
      }
      return {
        timer: { ...state.timer, secondsRemaining: state.timer.secondsRemaining - 1 },
      };
    }),
}));

// ===== MOTIVATION STORE =====
type MotivationType = 'task-complete' | 'goal-progress' | 'streak' | 'focus' | 'zen-mode' | 'timer-done';

interface MotivationStore {
  showToast: boolean;
  currentMessage: string;
  triggerMotivation: (type: MotivationType) => void;
  hideToast: () => void;
}

const motivationMessages = {
  'task-complete': [
    "Großartig! Eine Aufgabe weniger.",
    "Perfekt erledigt! Weiter so!",
    "Du bist auf dem richtigen Weg!",
    "Ausgezeichnet! Momentum aufgebaut.",
    "Super! Dein Fortschritt ist beeindruckend.",
  ],
  'goal-progress': [
    "Schritt für Schritt näher am Ziel!",
    "Dein Ziel rückt näher. Großartig!",
    "Fantastischer Fortschritt!",
    "Du machst echte Fortschritte!",
  ],
  'streak': [
    "Streak läuft! Nicht aufhören jetzt.",
    "Konsistenz zahlt sich aus!",
    "Die Serie geht weiter!",
    "Jeden Tag ein bisschen besser!",
  ],
  'focus': [
    "Zeit für Deep Work. Los geht's!",
    "Konzentration ist deine Superkraft.",
    "Disziplin ist, wenn du es trotzdem machst. Fokus jetzt.",
    "Keine Ablenkungen. Keine Ausreden. Nur du und die Aufgabe.",
  ],
  'zen-mode': [
    "Willkommen in der Ruhe.",
    "Fokussiere dich auf das Wesentliche.",
    "Klarheit beginnt mit Stille.",
    "Dein Zen-Moment.",
  ],
  'timer-done': [
    "Zeit ist um! Gut gemacht!",
    "Pause verdient! Du hast es geschafft.",
    "Session beendet. Großartig!",
    "Timer fertig! Zeit für eine Pause.",
  ],
};

export const useMotivationStore = create<MotivationStore>((set) => ({
  showToast: false,
  currentMessage: '',

  triggerMotivation: (type) => {
    const messages = motivationMessages[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    set({ showToast: true, currentMessage: randomMessage });

    setTimeout(() => {
      set({ showToast: false });
    }, 4000);
  },

  hideToast: () => set({ showToast: false }),
}));

// ===== SETTINGS STORE =====
interface UserSettings {
  // Profile
  name: string;
  email: string;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  compactMode: boolean;

  // Productivity / Timer
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  autoStartFocus: boolean;

  // Audio
  soundEnabled: boolean;
  soundVolume: number;

  // Notifications
  enableNotifications: boolean;
  enableSounds: boolean;
  motivationToastsEnabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string;
  smsRemindersEnabled: boolean;
  smsPhoneNumber: string;
  smsLeadMinutes: number;
  whatsappRemindersEnabled: boolean;
  whatsappPhoneNumber: string;
  whatsappTaskCreatedEnabled: boolean;
  whatsappWeeklyReviewEnabled: boolean;
  whatsappWeeklyReviewTime: string;

  // Calendar
  weekStartsOnMonday: boolean;

  // Zen Mode
  zenShowClock: boolean;
  zenShowStats: boolean;
  zenShowQuotes: boolean;
  zenBackgroundStyle: 'solid' | 'gradient' | 'animated';

  // Tasks
  defaultTaskPriority: 'low' | 'medium' | 'high';
  showCompletedTasks: boolean;
  showTaskDescriptions: boolean;

  // Privacy
  language: 'de' | 'en';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
  name: '',
  email: '',
  theme: 'system',
  accentColor: '#6366f1',
  compactMode: false,
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  defaultFocusMinutes: 25,
  defaultBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsUntilLongBreak: 4,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 50,
  enableNotifications: true,
  enableSounds: true,
  motivationToastsEnabled: true,
  dailyReminderEnabled: false,
  reminderTime: '09:00',
  smsRemindersEnabled: false,
  smsPhoneNumber: '',
  smsLeadMinutes: 30,
  whatsappRemindersEnabled: false,
  whatsappPhoneNumber: '',
  whatsappTaskCreatedEnabled: true,
  whatsappWeeklyReviewEnabled: true,
  whatsappWeeklyReviewTime: '22:00',
  weekStartsOnMonday: true,
  zenShowClock: true,
  zenShowStats: true,
  zenShowQuotes: true,
  zenBackgroundStyle: 'gradient',
  defaultTaskPriority: 'medium',
  showCompletedTasks: true,
  showTaskDescriptions: true,
  language: 'de',
  autoBackup: false,
  backupFrequency: 'weekly',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'settings-storage',
      version: 2,
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<SettingsStore> | undefined;
        return {
          ...currentState,
          ...typedPersistedState,
          settings: {
            ...currentState.settings,
            ...(typedPersistedState?.settings || {}),
          },
        };
      },
    }
  )
);

// ===== DATA STORE =====
// Export the Supabase-based data store
export { useDataStore } from './supbaseStore';
