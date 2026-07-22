import type { Habit, HabitCompletion, HabitScheduleType, LocalDate } from "./types";
import {
  dayOfWeek,
  isWeekendDate,
  todayLocal,
  addLocalDays,
  fromLocalDate,
} from "./date";
import { isBefore, isEqual, startOfDay } from "date-fns";

export function isHabitScheduledOn(habit: Habit, date: LocalDate): boolean {
  if (habit.archived) return false;
  switch (habit.scheduleType) {
    case "daily":
      return true;
    case "weekdays":
      return !isWeekendDate(date);
    case "weekends":
      return isWeekendDate(date);
    case "custom":
      return habit.customDays.includes(dayOfWeek(date));
    default:
      return false;
  }
}

export function isCompletedOn(
  completions: HabitCompletion[],
  habitId: string,
  date: LocalDate,
): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

export function getCompletionsForHabit(
  completions: HabitCompletion[],
  habitId: string,
): HabitCompletion[] {
  return completions
    .filter((c) => c.habitId === habitId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Current streak: consecutive scheduled days ending at `endDate`
 * (or the most recent scheduled day if today isn't scheduled / not yet done).
 */
export function calculateCurrentStreak(
  habit: Habit,
  completions: HabitCompletion[],
  endDate: LocalDate = todayLocal(),
): number {
  const completed = new Set(
    getCompletionsForHabit(completions, habit.id).map((c) => c.date),
  );

  let cursor = endDate;
  // If today is scheduled but not completed, start from yesterday
  if (isHabitScheduledOn(habit, cursor) && !completed.has(cursor)) {
    cursor = addLocalDays(cursor, -1);
  }

  let streak = 0;
  // Walk back up to 2 years
  for (let i = 0; i < 730; i++) {
    if (!isHabitScheduledOn(habit, cursor)) {
      cursor = addLocalDays(cursor, -1);
      continue;
    }
    if (!completed.has(cursor)) break;
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return streak;
}

export function calculateLongestStreak(
  habit: Habit,
  completions: HabitCompletion[],
): number {
  const dates = getCompletionsForHabit(completions, habit.id)
    .map((c) => c.date)
    .filter((d) => isHabitScheduledOn(habit, d));

  if (dates.length === 0) return 0;

  const set = new Set(dates);
  let longest = 0;
  let current = 0;

  const start = dates[0];
  const end = dates[dates.length - 1];
  let cursor = start;

  while (cursor <= end) {
    if (isHabitScheduledOn(habit, cursor)) {
      if (set.has(cursor)) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    cursor = addLocalDays(cursor, 1);
  }

  return longest;
}

export function calculateCompletionRate(
  habit: Habit,
  completions: HabitCompletion[],
  fromDate: LocalDate,
  toDate: LocalDate = todayLocal(),
): number {
  const completed = new Set(
    getCompletionsForHabit(completions, habit.id).map((c) => c.date),
  );

  let scheduled = 0;
  let done = 0;
  let cursor = fromDate;
  const habitStart = habit.createdAt.slice(0, 10);
  const effectiveFrom =
    habitStart > fromDate ? habitStart : fromDate;

  cursor = effectiveFrom;
  while (cursor <= toDate) {
    if (isHabitScheduledOn(habit, cursor)) {
      scheduled += 1;
      if (completed.has(cursor)) done += 1;
    }
    cursor = addLocalDays(cursor, 1);
  }

  if (scheduled === 0) return 0;
  return Math.round((done / scheduled) * 100);
}

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits
    .filter((h) => !h.archived)
    .sort((a, b) => a.order - b.order);
}

export function filterHabits(
  habits: Habit[],
  options: {
    query?: string;
    archived?: boolean | "all";
    scheduleType?: HabitScheduleType | "all";
  },
): Habit[] {
  const { query = "", archived = false, scheduleType = "all" } = options;
  const q = query.trim().toLowerCase();

  return habits
    .filter((h) => {
      if (archived === false && h.archived) return false;
      if (archived === true && !h.archived) return false;
      if (scheduleType !== "all" && h.scheduleType !== scheduleType) return false;
      if (q) {
        const hay = `${h.name} ${h.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

export function reorderHabits(habits: Habit[], fromId: string, toId: string): Habit[] {
  const active = getActiveHabits(habits);
  const fromIdx = active.findIndex((h) => h.id === fromId);
  const toIdx = active.findIndex((h) => h.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return habits;

  const reordered = [...active];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  const orderMap = new Map(reordered.map((h, i) => [h.id, i]));
  return habits.map((h) =>
    orderMap.has(h.id) ? { ...h, order: orderMap.get(h.id)!, updatedAt: new Date().toISOString() } : h,
  );
}

export function habitsDueOn(habits: Habit[], date: LocalDate): Habit[] {
  return getActiveHabits(habits).filter((h) => isHabitScheduledOn(h, date));
}

export function wasCreatedOnOrBefore(habit: Habit, date: LocalDate): boolean {
  const created = startOfDay(new Date(habit.createdAt));
  const target = startOfDay(fromLocalDate(date));
  return isBefore(created, target) || isEqual(created, target);
}
