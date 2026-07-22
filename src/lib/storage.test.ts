import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorage, StorageService, STORAGE_KEYS } from "@/lib/storage";

describe("StorageService", () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService(new MemoryStorage());
  });

  it("stores and retrieves JSON values", () => {
    expect(service.set("k", { a: 1 })).toBe(true);
    expect(service.get("k", null)).toEqual({ a: 1 });
  });

  it("returns fallback for missing keys", () => {
    expect(service.get("missing", { ok: true })).toEqual({ ok: true });
  });

  it("handles corrupted JSON gracefully", () => {
    const mem = new MemoryStorage();
    mem.setItem("bad", "{not-json");
    const s = new StorageService(mem);
    expect(s.get("bad", "fallback")).toBe("fallback");
  });

  it("notifies subscribers on set", () => {
    const values: unknown[] = [];
    service.subscribe("x", (v) => values.push(v));
    service.set("x", 42);
    expect(values).toEqual([42]);
  });

  it("returns a stable reference when underlying data is unchanged", () => {
    service.set("k", { a: 1 });
    const first = service.get("k", null);
    const second = service.get("k", null);
    expect(first).toBe(second);
  });

  it("exports and imports allowed keys", () => {
    service.set(STORAGE_KEYS.habits, [{ id: "1" }]);
    service.set(STORAGE_KEYS.settings, { waterGoalMl: 3000 });
    const exported = service.exportKeys([STORAGE_KEYS.habits, STORAGE_KEYS.settings]);
    const other = new StorageService(new MemoryStorage());
    const imported = other.importKeys(exported, [STORAGE_KEYS.habits, STORAGE_KEYS.settings]);
    expect(imported).toContain(STORAGE_KEYS.habits);
    expect(other.get(STORAGE_KEYS.habits, [])).toEqual([{ id: "1" }]);
  });
});
