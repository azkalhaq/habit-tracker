import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isWeekend,
  getDay,
  subDays,
  isValid,
} from "date-fns";
import type { LocalDate } from "./types";

/** Format a Date as local YYYY-MM-DD (no UTC conversion). */
export function toLocalDate(date: Date = new Date()): LocalDate {
  return format(date, "yyyy-MM-dd");
}

/** Parse YYYY-MM-DD as a local Date at midnight. */
export function fromLocalDate(dateStr: LocalDate): Date {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  if (!isValid(d)) {
    throw new Error(`Invalid local date: ${dateStr}`);
  }
  return d;
}

export function isValidLocalDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  return isValid(d) && format(d, "yyyy-MM-dd") === dateStr;
}

export function todayLocal(): LocalDate {
  return toLocalDate(new Date());
}

export function addLocalDays(dateStr: LocalDate, days: number): LocalDate {
  const d = fromLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

export function getWeekDates(anchor: LocalDate = todayLocal()): LocalDate[] {
  const date = fromLocalDate(anchor);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => toLocalDate(d));
}

export function getMonthDates(anchor: LocalDate = todayLocal()): LocalDate[] {
  const date = fromLocalDate(anchor);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map((d) => toLocalDate(d));
}

export function getLastNDays(n: number, end: LocalDate = todayLocal()): LocalDate[] {
  const endDate = fromLocalDate(end);
  return Array.from({ length: n }, (_, i) => toLocalDate(subDays(endDate, n - 1 - i)));
}

export function dayOfWeek(dateStr: LocalDate): number {
  return getDay(fromLocalDate(dateStr));
}

export function isWeekendDate(dateStr: LocalDate): boolean {
  return isWeekend(fromLocalDate(dateStr));
}

export function formatDisplayDate(dateStr: LocalDate, pattern = "EEE, MMM d"): string {
  return format(fromLocalDate(dateStr), pattern);
}

export function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDurationMinutes(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
