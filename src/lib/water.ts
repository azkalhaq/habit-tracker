import type { WaterEntry, WaterUnit, LocalDate } from "./types";
import { todayLocal, getWeekDates } from "./date";

const ML_PER_FL_OZ = 29.5735;

export function toMl(amount: number, unit: WaterUnit): number {
  switch (unit) {
    case "ml":
      return Math.round(amount);
    case "l":
      return Math.round(amount * 1000);
    case "fl_oz":
      return Math.round(amount * ML_PER_FL_OZ);
  }
}

export function fromMl(ml: number, unit: WaterUnit): number {
  switch (unit) {
    case "ml":
      return ml;
    case "l":
      return Math.round((ml / 1000) * 1000) / 1000;
    case "fl_oz":
      return Math.round((ml / ML_PER_FL_OZ) * 10) / 10;
  }
}

export function formatWater(ml: number, unit: WaterUnit): string {
  const value = fromMl(ml, unit);
  switch (unit) {
    case "ml":
      return `${Math.round(value)} ml`;
    case "l":
      return `${value} L`;
    case "fl_oz":
      return `${value} fl oz`;
  }
}

export function unitLabel(unit: WaterUnit): string {
  switch (unit) {
    case "ml":
      return "ml";
    case "l":
      return "L";
    case "fl_oz":
      return "fl oz";
  }
}

export function dailyTotalMl(
  entries: WaterEntry[],
  date: LocalDate = todayLocal(),
): number {
  return entries
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + e.amountMl, 0);
}

export function weeklyTotalsMl(
  entries: WaterEntry[],
  anchor: LocalDate = todayLocal(),
): { date: LocalDate; totalMl: number }[] {
  return getWeekDates(anchor).map((date) => ({
    date,
    totalMl: dailyTotalMl(entries, date),
  }));
}

export function progressPercent(totalMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(100, Math.round((totalMl / goalMl) * 100));
}

export function createWaterEntry(
  amountMl: number,
  timestamp: number = Date.now(),
  id?: string,
): WaterEntry {
  return {
    id: id ?? `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
    amountMl,
    timestamp,
    date: todayLocal(),
  };
}

/**
 * Whether water reminders should fire right now.
 * Reminders only work while the browser/tab can run JS — not when fully closed.
 */
export function shouldRemind(options: {
  enabled: boolean;
  intervalMinutes: number;
  lastNotifiedAt: number | null;
  snoozedUntil: LocalDate | null;
  disabledForDate: LocalDate | null;
  now?: number;
  today?: LocalDate;
}): boolean {
  const {
    enabled,
    intervalMinutes,
    lastNotifiedAt,
    snoozedUntil,
    disabledForDate,
    now = Date.now(),
    today = todayLocal(),
  } = options;

  if (!enabled) return false;
  if (disabledForDate === today) return false;
  if (snoozedUntil === today) return false;
  if (intervalMinutes <= 0) return false;

  if (lastNotifiedAt == null) return true;
  return now - lastNotifiedAt >= intervalMinutes * 60_000;
}
