import { describe, it, expect } from "vitest";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  completeInterval,
  skipWithSession,
  getRemainingMsWithDurations,
  dailyTotals,
  durationMsForMode,
} from "@/lib/timer";
import type { ActiveTimerState, TimerDurations, TimerSession } from "@/lib/types";
import { DEFAULT_ACTIVE_TIMER } from "@/lib/types";

const durations: TimerDurations = {
  sitMinutes: 30,
  standMinutes: 15,
  breakMinutes: 5,
};

const cycle = ["sit", "stand"] as const;

describe("timer engine", () => {
  it("computes mode durations", () => {
    expect(durationMsForMode("sit", durations)).toBe(30 * 60_000);
    expect(durationMsForMode("stand", durations)).toBe(15 * 60_000);
  });

  it("starts with endsAt based on wall clock", () => {
    const now = 1_000_000;
    const state = startTimer(DEFAULT_ACTIVE_TIMER, durations, [...cycle], now);
    expect(state.status).toBe("running");
    expect(state.endsAt).toBe(now + 30 * 60_000);
    expect(getRemainingMsWithDurations(state, durations, now)).toBe(30 * 60_000);
  });

  it("pauses and resumes preserving remaining time", () => {
    const t0 = 1_000_000;
    let state = startTimer(DEFAULT_ACTIVE_TIMER, durations, [...cycle], t0);
    const t1 = t0 + 10 * 60_000;
    state = pauseTimer(state, durations, t1);
    expect(state.status).toBe("paused");
    expect(state.remainingMs).toBe(20 * 60_000);
    expect(state.endsAt).toBeNull();

    const t2 = t1 + 60_000;
    state = resumeTimer(state, t2);
    expect(state.status).toBe("running");
    expect(state.endsAt).toBe(t2 + 20 * 60_000);
  });

  it("remains accurate after simulated refresh using endsAt", () => {
    const t0 = 5_000_000;
    const state = startTimer(DEFAULT_ACTIVE_TIMER, durations, [...cycle], t0);
    // Persist & reload: only endsAt matters
    const restored: ActiveTimerState = { ...state };
    const later = t0 + 12 * 60_000;
    expect(getRemainingMsWithDurations(restored, durations, later)).toBe(18 * 60_000);
  });

  it("auto-switches mode on complete", () => {
    const t0 = 2_000_000;
    const state = startTimer(DEFAULT_ACTIVE_TIMER, durations, [...cycle], t0);
    const end = t0 + 30 * 60_000;
    const result = completeInterval(state, durations, [...cycle], end);
    expect(result.session.mode).toBe("sit");
    expect(result.state.mode).toBe("stand");
    expect(result.state.status).toBe("running");
    expect(result.state.endsAt).toBe(end + 15 * 60_000);
  });

  it("skips to next interval", () => {
    const t0 = 3_000_000;
    const state = startTimer(DEFAULT_ACTIVE_TIMER, durations, [...cycle], t0);
    const { state: next } = skipWithSession(state, durations, [...cycle], t0 + 1000);
    expect(next.mode).toBe("stand");
  });

  it("resets to idle sit", () => {
    const state = resetTimer(durations, [...cycle], 100);
    expect(state.status).toBe("idle");
    expect(state.mode).toBe("sit");
    expect(state.cycleIndex).toBe(0);
  });

  it("sums daily totals by mode", () => {
    const sessions: TimerSession[] = [
      {
        id: "1",
        mode: "sit",
        startedAt: 1,
        endedAt: 2,
        durationMs: 10_000,
        date: "2026-07-22",
      },
      {
        id: "2",
        mode: "stand",
        startedAt: 3,
        endedAt: 4,
        durationMs: 5_000,
        date: "2026-07-22",
      },
      {
        id: "3",
        mode: "sit",
        startedAt: 5,
        endedAt: 6,
        durationMs: 7_000,
        date: "2026-07-21",
      },
    ];
    expect(dailyTotals(sessions, "2026-07-22")).toEqual({
      sitMs: 10_000,
      standMs: 5_000,
      breakMs: 0,
    });
  });
});
