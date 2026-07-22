import { describe, it, expect } from "vitest";
import {
  toMl,
  fromMl,
  dailyTotalMl,
  progressPercent,
  shouldRemind,
  createWaterEntry,
} from "@/lib/water";
import type { WaterEntry } from "@/lib/types";

describe("water conversions", () => {
  it("converts litres and fl oz to ml", () => {
    expect(toMl(1, "l")).toBe(1000);
    expect(toMl(250, "ml")).toBe(250);
    expect(toMl(1, "fl_oz")).toBe(30); // rounded
  });

  it("converts from ml for display", () => {
    expect(fromMl(1000, "l")).toBe(1);
    expect(fromMl(500, "ml")).toBe(500);
  });

  it("stores entries in ml and totals by local date", () => {
    const entries: WaterEntry[] = [
      { id: "1", amountMl: 250, timestamp: 1, date: "2026-07-22" },
      { id: "2", amountMl: 500, timestamp: 2, date: "2026-07-22" },
      { id: "3", amountMl: 300, timestamp: 3, date: "2026-07-21" },
    ];
    expect(dailyTotalMl(entries, "2026-07-22")).toBe(750);
    expect(progressPercent(750, 2000)).toBe(38);
    expect(progressPercent(2500, 2000)).toBe(100);
  });

  it("creates entries with local date field", () => {
    const entry = createWaterEntry(250, Date.now(), "x");
    expect(entry.amountMl).toBe(250);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("water reminders", () => {
  it("does not remind when disabled or snoozed", () => {
    expect(
      shouldRemind({
        enabled: false,
        intervalMinutes: 60,
        lastNotifiedAt: null,
        snoozedUntil: null,
        disabledForDate: null,
        today: "2026-07-22",
      }),
    ).toBe(false);

    expect(
      shouldRemind({
        enabled: true,
        intervalMinutes: 60,
        lastNotifiedAt: null,
        snoozedUntil: "2026-07-22",
        disabledForDate: null,
        today: "2026-07-22",
      }),
    ).toBe(false);
  });

  it("reminds when interval elapsed", () => {
    expect(
      shouldRemind({
        enabled: true,
        intervalMinutes: 60,
        lastNotifiedAt: 1_000_000,
        snoozedUntil: null,
        disabledForDate: null,
        now: 1_000_000 + 60 * 60_000,
        today: "2026-07-22",
      }),
    ).toBe(true);

    expect(
      shouldRemind({
        enabled: true,
        intervalMinutes: 60,
        lastNotifiedAt: 1_000_000,
        snoozedUntil: null,
        disabledForDate: null,
        now: 1_000_000 + 30 * 60_000,
        today: "2026-07-22",
      }),
    ).toBe(false);
  });
});
