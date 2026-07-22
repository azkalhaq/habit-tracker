import { describe, it, expect } from "vitest";
import {
  toLocalDate,
  fromLocalDate,
  isValidLocalDate,
  addLocalDays,
  formatMs,
} from "@/lib/date";

describe("date helpers", () => {
  it("formats local dates as YYYY-MM-DD without UTC shift", () => {
    const d = new Date(2026, 6, 22, 23, 30, 0); // Jul 22 local evening
    expect(toLocalDate(d)).toBe("2026-07-22");
  });

  it("parses local dates at local midnight", () => {
    const d = fromLocalDate("2026-07-22");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(0);
  });

  it("validates local date strings", () => {
    expect(isValidLocalDate("2026-07-22")).toBe(true);
    expect(isValidLocalDate("2026-13-01")).toBe(false);
    expect(isValidLocalDate("2026-02-30")).toBe(false);
    expect(isValidLocalDate("not-a-date")).toBe(false);
  });

  it("adds days in local calendar space", () => {
    expect(addLocalDays("2026-07-22", 1)).toBe("2026-07-23");
    expect(addLocalDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("formats milliseconds as mm:ss", () => {
    expect(formatMs(90_000)).toBe("01:30");
    expect(formatMs(0)).toBe("00:00");
  });
});
