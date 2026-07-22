/** Local calendar date as YYYY-MM-DD (never UTC-normalized). */
export type LocalDate = string;

export type HabitScheduleType = "daily" | "weekdays" | "weekends" | "custom";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  scheduleType: HabitScheduleType;
  /** 0 = Sunday … 6 = Saturday; used when scheduleType is "custom" */
  customDays: number[];
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: LocalDate;
  completedAt: string;
}

export type TimerMode = "sit" | "stand" | "break";

export interface TimerDurations {
  sitMinutes: number;
  standMinutes: number;
  breakMinutes: number;
}

export interface ActiveTimerState {
  mode: TimerMode;
  /** Wall-clock ms when the current interval ends (null when paused/idle) */
  endsAt: number | null;
  /** Remaining ms when paused */
  remainingMs: number | null;
  status: "idle" | "running" | "paused";
  /** Cycle order index for auto-switch */
  cycleIndex: number;
  updatedAt: number;
}

export interface TimerSession {
  id: string;
  mode: TimerMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  date: LocalDate;
}

export type WaterUnit = "ml" | "l" | "fl_oz";

export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: number;
  date: LocalDate;
}

export interface WaterReminderState {
  /** Local date when reminders were snoozed/disabled for the day */
  snoozedUntil: LocalDate | null;
  disabledForDate: LocalDate | null;
  lastNotifiedAt: number | null;
}

export interface AppSettings {
  waterGoalMl: number;
  waterUnit: WaterUnit;
  waterQuickAddsMl: number[];
  waterRemindersEnabled: boolean;
  waterReminderIntervalMinutes: number;
  timerDurations: TimerDurations;
  /** Cycle modes in order, e.g. sit → stand → sit → stand, with optional break */
  timerCycle: TimerMode[];
  timerNotifications: boolean;
  timerSound: boolean;
  timerVibration: boolean;
  theme: "system" | "light" | "dark";
}

export interface AppData {
  version: number;
  habits: Habit[];
  completions: HabitCompletion[];
  timerSessions: TimerSession[];
  activeTimer: ActiveTimerState;
  waterEntries: WaterEntry[];
  waterReminder: WaterReminderState;
  settings: AppSettings;
}

export const STORAGE_VERSION = 1;

export const HABIT_COLORS = [
  "#0D9488",
  "#0284C7",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#475569",
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  waterGoalMl: 2000,
  waterUnit: "ml",
  waterQuickAddsMl: [250, 500, 750],
  waterRemindersEnabled: false,
  waterReminderIntervalMinutes: 60,
  timerDurations: {
    sitMinutes: 30,
    standMinutes: 15,
    breakMinutes: 5,
  },
  timerCycle: ["sit", "stand"],
  timerNotifications: true,
  timerSound: true,
  timerVibration: true,
  theme: "system",
};

export const DEFAULT_ACTIVE_TIMER: ActiveTimerState = {
  mode: "sit",
  endsAt: null,
  remainingMs: null,
  status: "idle",
  cycleIndex: 0,
  updatedAt: 0,
};

export const DEFAULT_WATER_REMINDER: WaterReminderState = {
  snoozedUntil: null,
  disabledForDate: null,
  lastNotifiedAt: null,
};

export function createDefaultAppData(): AppData {
  return {
    version: STORAGE_VERSION,
    habits: [],
    completions: [],
    timerSessions: [],
    activeTimer: { ...DEFAULT_ACTIVE_TIMER },
    waterEntries: [],
    waterReminder: { ...DEFAULT_WATER_REMINDER },
    settings: { ...DEFAULT_SETTINGS, timerDurations: { ...DEFAULT_SETTINGS.timerDurations }, timerCycle: [...DEFAULT_SETTINGS.timerCycle], waterQuickAddsMl: [...DEFAULT_SETTINGS.waterQuickAddsMl] },
  };
}
