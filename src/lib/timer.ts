import type {
  ActiveTimerState,
  TimerDurations,
  TimerMode,
  TimerSession,
} from "./types";
import { generateId, todayLocal } from "./date";

export function durationMsForMode(
  mode: TimerMode,
  durations: TimerDurations,
): number {
  switch (mode) {
    case "sit":
      return durations.sitMinutes * 60_000;
    case "stand":
      return durations.standMinutes * 60_000;
    case "break":
      return durations.breakMinutes * 60_000;
  }
}

export function getRemainingMs(
  state: ActiveTimerState,
  now: number = Date.now(),
): number {
  if (state.status === "running" && state.endsAt != null) {
    return Math.max(0, state.endsAt - now);
  }
  if (state.remainingMs != null) {
    return Math.max(0, state.remainingMs);
  }
  return durationMsForMode(state.mode, {
    sitMinutes: 30,
    standMinutes: 15,
    breakMinutes: 5,
  });
}

export function getRemainingMsWithDurations(
  state: ActiveTimerState,
  durations: TimerDurations,
  now: number = Date.now(),
): number {
  if (state.status === "running" && state.endsAt != null) {
    return Math.max(0, state.endsAt - now);
  }
  if (state.remainingMs != null) {
    return Math.max(0, state.remainingMs);
  }
  return durationMsForMode(state.mode, durations);
}

export function startTimer(
  state: ActiveTimerState,
  durations: TimerDurations,
  cycle: TimerMode[],
  now: number = Date.now(),
): ActiveTimerState {
  const mode = cycle[state.cycleIndex % cycle.length] ?? state.mode;
  const baseMs =
    state.status === "paused" && state.remainingMs != null
      ? state.remainingMs
      : durationMsForMode(mode, durations);

  return {
    mode,
    endsAt: now + baseMs,
    remainingMs: null,
    status: "running",
    cycleIndex: state.cycleIndex,
    updatedAt: now,
  };
}

export function pauseTimer(
  state: ActiveTimerState,
  durations: TimerDurations,
  now: number = Date.now(),
): ActiveTimerState {
  if (state.status !== "running") return state;
  return {
    ...state,
    remainingMs: getRemainingMsWithDurations(state, durations, now),
    endsAt: null,
    status: "paused",
    updatedAt: now,
  };
}

export function resumeTimer(
  state: ActiveTimerState,
  now: number = Date.now(),
): ActiveTimerState {
  if (state.status !== "paused" || state.remainingMs == null) return state;
  return {
    ...state,
    endsAt: now + state.remainingMs,
    remainingMs: null,
    status: "running",
    updatedAt: now,
  };
}

export function resetTimer(
  durations: TimerDurations,
  cycle: TimerMode[],
  now: number = Date.now(),
): ActiveTimerState {
  const mode = cycle[0] ?? "sit";
  return {
    mode,
    endsAt: null,
    remainingMs: durationMsForMode(mode, durations),
    status: "idle",
    cycleIndex: 0,
    updatedAt: now,
  };
}

export function createTimerSession(
  mode: TimerMode,
  originalMs: number,
  endedAt: number = Date.now(),
  actualElapsedMs?: number,
): TimerSession {
  const elapsed = actualElapsedMs ?? originalMs;
  return {
    id: generateId(),
    mode,
    startedAt: endedAt - elapsed,
    endedAt,
    durationMs: elapsed,
    date: todayLocal(),
  };
}

export function completeInterval(
  state: ActiveTimerState,
  durations: TimerDurations,
  cycle: TimerMode[],
  now: number = Date.now(),
): { state: ActiveTimerState; session: TimerSession } {
  const originalMs = durationMsForMode(state.mode, durations);
  const remaining = getRemainingMsWithDurations(state, durations, now);
  const elapsed = Math.max(0, originalMs - remaining);
  const session = createTimerSession(state.mode, originalMs, now, elapsed);

  const nextIndex = (state.cycleIndex + 1) % Math.max(cycle.length, 1);
  const nextMode = cycle[nextIndex] ?? "sit";
  const nextMs = durationMsForMode(nextMode, durations);

  return {
    session,
    state: {
      mode: nextMode,
      endsAt: now + nextMs,
      remainingMs: null,
      status: "running",
      cycleIndex: nextIndex,
      updatedAt: now,
    },
  };
}

export function skipWithSession(
  state: ActiveTimerState,
  durations: TimerDurations,
  cycle: TimerMode[],
  now: number = Date.now(),
): { state: ActiveTimerState; session: TimerSession } {
  const originalMs = durationMsForMode(state.mode, durations);
  const remaining = getRemainingMsWithDurations(state, durations, now);
  const elapsed = Math.max(0, originalMs - remaining);
  const session = createTimerSession(state.mode, originalMs, now, elapsed);
  const wasRunning = state.status === "running";

  const nextIndex = (state.cycleIndex + 1) % Math.max(cycle.length, 1);
  const nextMode = cycle[nextIndex] ?? "sit";
  const nextMs = durationMsForMode(nextMode, durations);

  return {
    session,
    state: wasRunning
      ? {
          mode: nextMode,
          endsAt: now + nextMs,
          remainingMs: null,
          status: "running",
          cycleIndex: nextIndex,
          updatedAt: now,
        }
      : {
          mode: nextMode,
          endsAt: null,
          remainingMs: nextMs,
          status: state.status === "paused" ? "paused" : "idle",
          cycleIndex: nextIndex,
          updatedAt: now,
        },
  };
}

export function dailyTotals(
  sessions: TimerSession[],
  date: string = todayLocal(),
): { sitMs: number; standMs: number; breakMs: number } {
  const day = sessions.filter((s) => s.date === date);
  return {
    sitMs: day.filter((s) => s.mode === "sit").reduce((a, s) => a + s.durationMs, 0),
    standMs: day.filter((s) => s.mode === "stand").reduce((a, s) => a + s.durationMs, 0),
    breakMs: day.filter((s) => s.mode === "break").reduce((a, s) => a + s.durationMs, 0),
  };
}

export function modeLabel(mode: TimerMode): string {
  switch (mode) {
    case "sit":
      return "Sit";
    case "stand":
      return "Stand";
    case "break":
      return "Break";
  }
}
