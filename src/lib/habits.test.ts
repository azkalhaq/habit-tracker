import { describe, it, expect } from "vitest";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateCompletionRate,
  isHabitScheduledOn,
  reorderHabits,
  filterHabits,
} from "@/lib/habits";
import type { Habit, HabitCompletion } from "@/lib/types";

function habit(partial: Partial<Habit> & Pick<Habit, "id" | "name">): Habit {
  return {
    description: undefined,
    color: "#0D9488",
    scheduleType: "daily",
    customDays: [],
    archived: false,
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function done(habitId: string, date: string): HabitCompletion {
  return {
    id: `${habitId}-${date}`,
    habitId,
    date,
    completedAt: `${date}T12:00:00.000Z`,
  };
}

describe("habit scheduling", () => {
  it("respects weekday and weekend schedules", () => {
    const weekdays = habit({ id: "1", name: "W", scheduleType: "weekdays" });
    const weekends = habit({ id: "2", name: "E", scheduleType: "weekends" });
    // 2026-07-22 is Wednesday
    expect(isHabitScheduledOn(weekdays, "2026-07-22")).toBe(true);
    expect(isHabitScheduledOn(weekends, "2026-07-22")).toBe(false);
    // 2026-07-25 is Saturday
    expect(isHabitScheduledOn(weekdays, "2026-07-25")).toBe(false);
    expect(isHabitScheduledOn(weekends, "2026-07-25")).toBe(true);
  });

  it("supports custom day lists", () => {
    const h = habit({
      id: "c",
      name: "Custom",
      scheduleType: "custom",
      customDays: [1, 3], // Mon, Wed
    });
    expect(isHabitScheduledOn(h, "2026-07-22")).toBe(true); // Wed
    expect(isHabitScheduledOn(h, "2026-07-20")).toBe(true); // Mon
    expect(isHabitScheduledOn(h, "2026-07-21")).toBe(false); // Tue
  });
});

describe("streaks and completion rate", () => {
  it("calculates current streak ending yesterday when today incomplete", () => {
    const h = habit({ id: "s", name: "Streak" });
    const completions = [
      done("s", "2026-07-20"),
      done("s", "2026-07-21"),
    ];
    expect(calculateCurrentStreak(h, completions, "2026-07-22")).toBe(2);
  });

  it("includes today when completed", () => {
    const h = habit({ id: "s", name: "Streak" });
    const completions = [
      done("s", "2026-07-20"),
      done("s", "2026-07-21"),
      done("s", "2026-07-22"),
    ];
    expect(calculateCurrentStreak(h, completions, "2026-07-22")).toBe(3);
  });

  it("calculates longest streak", () => {
    const h = habit({ id: "s", name: "Streak" });
    const completions = [
      done("s", "2026-07-01"),
      done("s", "2026-07-02"),
      done("s", "2026-07-04"),
      done("s", "2026-07-05"),
      done("s", "2026-07-06"),
    ];
    expect(calculateLongestStreak(h, completions)).toBe(3);
  });

  it("calculates completion rate", () => {
    const h = habit({ id: "s", name: "Rate", createdAt: "2026-07-01T00:00:00.000Z" });
    const completions = [done("s", "2026-07-01"), done("s", "2026-07-02")];
    // Jul 1–4 = 4 days, 2 done => 50%
    expect(calculateCompletionRate(h, completions, "2026-07-01", "2026-07-04")).toBe(50);
  });
});

describe("habit list helpers", () => {
  it("reorders habits", () => {
    const habits = [
      habit({ id: "a", name: "A", order: 0 }),
      habit({ id: "b", name: "B", order: 1 }),
      habit({ id: "c", name: "C", order: 2 }),
    ];
    const next = reorderHabits(habits, "c", "a");
    expect(next.sort((x, y) => x.order - y.order).map((h) => h.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("filters by query and archive state", () => {
    const habits = [
      habit({ id: "1", name: "Meditate", archived: false }),
      habit({ id: "2", name: "Run", archived: true }),
    ];
    expect(filterHabits(habits, { query: "med" })).toHaveLength(1);
    expect(filterHabits(habits, { archived: true })).toHaveLength(1);
    expect(filterHabits(habits, { archived: "all" })).toHaveLength(2);
  });
});
