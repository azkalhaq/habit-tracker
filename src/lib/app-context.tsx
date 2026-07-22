"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ALL_STORAGE_KEYS,
  STORAGE_KEYS,
  storage,
} from "@/lib/storage";
import {
  DEFAULT_ACTIVE_TIMER,
  DEFAULT_SETTINGS,
  DEFAULT_WATER_REMINDER,
  type ActiveTimerState,
  type AppSettings,
  type Habit,
  type HabitCompletion,
  type HabitScheduleType,
  type TimerMode,
  type TimerSession,
  type WaterEntry,
  type WaterReminderState,
  type WaterUnit,
  HABIT_COLORS,
} from "@/lib/types";
import { generateId, todayLocal } from "@/lib/date";
import { reorderHabits as reorderHabitsPure } from "@/lib/habits";

function subscribeStorage(callback: () => void) {
  const unsubs = ALL_STORAGE_KEYS.map((key) => storage.subscribe(key, callback));
  return () => unsubs.forEach((u) => u());
}

const EMPTY_HABITS: Habit[] = [];
const EMPTY_COMPLETIONS: HabitCompletion[] = [];
const EMPTY_SESSIONS: TimerSession[] = [];
const EMPTY_WATER: WaterEntry[] = [];

function getHabitsSnapshot(): Habit[] {
  return storage.get<Habit[]>(STORAGE_KEYS.habits, EMPTY_HABITS);
}
function getCompletionsSnapshot(): HabitCompletion[] {
  return storage.get<HabitCompletion[]>(STORAGE_KEYS.completions, EMPTY_COMPLETIONS);
}
function getTimerSessionsSnapshot(): TimerSession[] {
  return storage.get<TimerSession[]>(STORAGE_KEYS.timerSessions, EMPTY_SESSIONS);
}
function getActiveTimerSnapshot(): ActiveTimerState {
  return storage.get<ActiveTimerState>(STORAGE_KEYS.activeTimer, DEFAULT_ACTIVE_TIMER);
}
function getWaterEntriesSnapshot(): WaterEntry[] {
  return storage.get<WaterEntry[]>(STORAGE_KEYS.waterEntries, EMPTY_WATER);
}
function getWaterReminderSnapshot(): WaterReminderState {
  return storage.get<WaterReminderState>(STORAGE_KEYS.waterReminder, DEFAULT_WATER_REMINDER);
}

let settingsCacheRaw: string | null | undefined;
let settingsCacheValue: AppSettings = DEFAULT_SETTINGS;

function mergeSettings(stored: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    timerDurations: {
      ...DEFAULT_SETTINGS.timerDurations,
      ...(stored.timerDurations ?? {}),
    },
    timerCycle: stored.timerCycle ?? DEFAULT_SETTINGS.timerCycle,
    waterQuickAddsMl: stored.waterQuickAddsMl ?? DEFAULT_SETTINGS.waterQuickAddsMl,
  };
}

function getSettingsSnapshot(): AppSettings {
  const raw = storage.getRaw(STORAGE_KEYS.settings);
  if (settingsCacheRaw === raw) {
    return settingsCacheValue;
  }
  const stored = storage.get<Partial<AppSettings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const merged =
    raw === null ? DEFAULT_SETTINGS : mergeSettings(stored);
  settingsCacheRaw = raw;
  settingsCacheValue = merged;
  return merged;
}

const serverHabits: Habit[] = EMPTY_HABITS;
const serverCompletions: HabitCompletion[] = EMPTY_COMPLETIONS;
const serverSessions: TimerSession[] = EMPTY_SESSIONS;
const serverActiveTimer = DEFAULT_ACTIVE_TIMER;
const serverWater: WaterEntry[] = EMPTY_WATER;
const serverReminder = DEFAULT_WATER_REMINDER;
const serverSettings = DEFAULT_SETTINGS;

interface AppContextValue {
  hydrated: boolean;
  storageAvailable: boolean;
  habits: Habit[];
  completions: HabitCompletion[];
  timerSessions: TimerSession[];
  activeTimer: ActiveTimerState;
  waterEntries: WaterEntry[];
  waterReminder: WaterReminderState;
  settings: AppSettings;
  addHabit: (input: {
    name: string;
    description?: string;
    color?: string;
    scheduleType?: HabitScheduleType;
    customDays?: number[];
  }) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  archiveHabit: (id: string, archived?: boolean) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (fromId: string, toId: string) => void;
  toggleCompletion: (habitId: string, date?: string) => void;
  setActiveTimer: (state: ActiveTimerState) => void;
  addTimerSession: (session: TimerSession) => void;
  addWater: (amountMl: number) => void;
  removeWater: (id: string) => void;
  setWaterReminder: (patch: Partial<WaterReminderState>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const habits = useSyncExternalStore(subscribeStorage, getHabitsSnapshot, () => serverHabits);
  const completions = useSyncExternalStore(subscribeStorage, getCompletionsSnapshot, () => serverCompletions);
  const timerSessions = useSyncExternalStore(subscribeStorage, getTimerSessionsSnapshot, () => serverSessions);
  const activeTimer = useSyncExternalStore(subscribeStorage, getActiveTimerSnapshot, () => serverActiveTimer);
  const waterEntries = useSyncExternalStore(subscribeStorage, getWaterEntriesSnapshot, () => serverWater);
  const waterReminder = useSyncExternalStore(subscribeStorage, getWaterReminderSnapshot, () => serverReminder);
  const settings = useSyncExternalStore(subscribeStorage, getSettingsSnapshot, () => serverSettings);

  const addHabit = useCallback(
    (input: {
      name: string;
      description?: string;
      color?: string;
      scheduleType?: HabitScheduleType;
      customDays?: number[];
    }) => {
      const now = new Date().toISOString();
      const current = getHabitsSnapshot();
      const habit: Habit = {
        id: generateId(),
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        color: input.color ?? HABIT_COLORS[current.length % HABIT_COLORS.length],
        scheduleType: input.scheduleType ?? "daily",
        customDays: input.customDays ?? [1, 2, 3, 4, 5],
        archived: false,
        order: current.length,
        createdAt: now,
        updatedAt: now,
      };
      storage.set(STORAGE_KEYS.habits, [...current, habit]);
      return habit;
    },
    [],
  );

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    const current = getHabitsSnapshot();
    storage.set(
      STORAGE_KEYS.habits,
      current.map((h) =>
        h.id === id ? { ...h, ...patch, id: h.id, updatedAt: new Date().toISOString() } : h,
      ),
    );
  }, []);

  const archiveHabit = useCallback((id: string, archived = true) => {
    updateHabit(id, { archived });
  }, [updateHabit]);

  const deleteHabit = useCallback((id: string) => {
    storage.set(
      STORAGE_KEYS.habits,
      getHabitsSnapshot().filter((h) => h.id !== id),
    );
    storage.set(
      STORAGE_KEYS.completions,
      getCompletionsSnapshot().filter((c) => c.habitId !== id),
    );
  }, []);

  const reorderHabits = useCallback((fromId: string, toId: string) => {
    storage.set(STORAGE_KEYS.habits, reorderHabitsPure(getHabitsSnapshot(), fromId, toId));
  }, []);

  const toggleCompletion = useCallback((habitId: string, date = todayLocal()) => {
    const current = getCompletionsSnapshot();
    const existing = current.find((c) => c.habitId === habitId && c.date === date);
    if (existing) {
      storage.set(
        STORAGE_KEYS.completions,
        current.filter((c) => c.id !== existing.id),
      );
    } else {
      const entry: HabitCompletion = {
        id: generateId(),
        habitId,
        date,
        completedAt: new Date().toISOString(),
      };
      storage.set(STORAGE_KEYS.completions, [...current, entry]);
    }
  }, []);

  const setActiveTimer = useCallback((state: ActiveTimerState) => {
    storage.set(STORAGE_KEYS.activeTimer, state);
  }, []);

  const addTimerSession = useCallback((session: TimerSession) => {
    storage.set(STORAGE_KEYS.timerSessions, [...getTimerSessionsSnapshot(), session]);
  }, []);

  const addWater = useCallback((amountMl: number) => {
    if (amountMl <= 0) return;
    const entry: WaterEntry = {
      id: generateId(),
      amountMl: Math.round(amountMl),
      timestamp: Date.now(),
      date: todayLocal(),
    };
    storage.set(STORAGE_KEYS.waterEntries, [...getWaterEntriesSnapshot(), entry]);
  }, []);

  const removeWater = useCallback((id: string) => {
    storage.set(
      STORAGE_KEYS.waterEntries,
      getWaterEntriesSnapshot().filter((e) => e.id !== id),
    );
  }, []);

  const setWaterReminder = useCallback((patch: Partial<WaterReminderState>) => {
    storage.set(STORAGE_KEYS.waterReminder, {
      ...getWaterReminderSnapshot(),
      ...patch,
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    const current = getSettingsSnapshot();
    storage.set(STORAGE_KEYS.settings, {
      ...current,
      ...patch,
      timerDurations: {
        ...current.timerDurations,
        ...(patch.timerDurations ?? {}),
      },
      timerCycle: patch.timerCycle ?? current.timerCycle,
      waterQuickAddsMl: patch.waterQuickAddsMl ?? current.waterQuickAddsMl,
    });
  }, []);

  const exportData = useCallback(() => {
    const data = storage.exportKeys(ALL_STORAGE_KEYS);
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), version: 1, data },
      null,
      2,
    );
  }, []);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as { data?: Record<string, unknown> } | Record<string, unknown>;
      const payload =
        parsed && typeof parsed === "object" && "data" in parsed && parsed.data
          ? (parsed.data as Record<string, unknown>)
          : (parsed as Record<string, unknown>);
      storage.importKeys(payload, ALL_STORAGE_KEYS);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, []);

  const resetData = useCallback(() => {
    storage.clearKeys(ALL_STORAGE_KEYS);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      storageAvailable: storage.isAvailable,
      habits,
      completions,
      timerSessions,
      activeTimer,
      waterEntries,
      waterReminder,
      settings,
      addHabit,
      updateHabit,
      archiveHabit,
      deleteHabit,
      reorderHabits,
      toggleCompletion,
      setActiveTimer,
      addTimerSession,
      addWater,
      removeWater,
      setWaterReminder,
      updateSettings,
      exportData,
      importData,
      resetData,
    }),
    [
      hydrated,
      habits,
      completions,
      timerSessions,
      activeTimer,
      waterEntries,
      waterReminder,
      settings,
      addHabit,
      updateHabit,
      archiveHabit,
      deleteHabit,
      reorderHabits,
      toggleCompletion,
      setActiveTimer,
      addTimerSession,
      addWater,
      removeWater,
      setWaterReminder,
      updateSettings,
      exportData,
      importData,
      resetData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { WaterUnit, TimerMode, HabitScheduleType };
