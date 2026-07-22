/**
 * Reusable LocalStorage service with graceful fallbacks for
 * unavailable or corrupted storage.
 */

export type StorageListener<T> = (value: T) => void;

export class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function getBackend(): Storage {
  if (typeof window === "undefined") {
    return new MemoryStorage();
  }
  try {
    const testKey = "__habit_tracker_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return new MemoryStorage();
  }
}

export class StorageService {
  private backend: Storage;
  private memoryFallback: MemoryStorage;
  private usingMemory: boolean;
  private listeners = new Map<string, Set<StorageListener<unknown>>>();
  /** Cache parsed values so useSyncExternalStore getSnapshot stays referentially stable. */
  private cache = new Map<string, { raw: string | null; value: unknown }>();

  constructor(backend?: Storage) {
    this.memoryFallback = new MemoryStorage();
    if (backend) {
      this.backend = backend;
      this.usingMemory = backend instanceof MemoryStorage;
    } else {
      this.backend = getBackend();
      this.usingMemory = this.backend instanceof MemoryStorage;
    }
  }

  get isAvailable(): boolean {
    return !this.usingMemory;
  }

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.backend.getItem(key);
      const cached = this.cache.get(key);
      if (cached && cached.raw === raw) {
        return cached.value as T;
      }
      if (raw === null) {
        this.cache.set(key, { raw: null, value: fallback });
        return fallback;
      }
      const value = JSON.parse(raw) as T;
      this.cache.set(key, { raw, value });
      return value;
    } catch {
      try {
        this.backend.removeItem(key);
      } catch {
        /* ignore */
      }
      this.cache.set(key, { raw: null, value: fallback });
      return fallback;
    }
  }

  /** Raw string currently stored for a key (for snapshot memoization). */
  getRaw(key: string): string | null {
    try {
      return this.backend.getItem(key);
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      this.backend.setItem(key, serialized);
      this.cache.set(key, { raw: serialized, value });
      this.notify(key, value);
      return true;
    } catch {
      try {
        const serialized = JSON.stringify(value);
        this.memoryFallback.setItem(key, serialized);
        this.backend = this.memoryFallback;
        this.usingMemory = true;
        this.cache.set(key, { raw: serialized, value });
        this.notify(key, value);
        return false;
      } catch {
        return false;
      }
    }
  }

  remove(key: string): void {
    try {
      this.backend.removeItem(key);
    } catch {
      /* ignore */
    }
    this.cache.delete(key);
    this.notify(key, null);
  }

  subscribe<T>(key: string, listener: StorageListener<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener as StorageListener<unknown>);
    return () => {
      this.listeners.get(key)?.delete(listener as StorageListener<unknown>);
    };
  }

  private notify<T>(key: string, value: T): void {
    const set = this.listeners.get(key);
    if (!set) return;
    set.forEach((listener) => {
      try {
        listener(value);
      } catch {
        /* ignore listener errors */
      }
    });
  }

  /** Export all known keys as a JSON-serializable object. */
  exportKeys(keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      try {
        const raw = this.backend.getItem(key);
        if (raw !== null) {
          result[key] = JSON.parse(raw);
        }
      } catch {
        /* skip corrupted */
      }
    }
    return result;
  }

  /** Import key/value pairs; skips invalid entries. */
  importKeys(data: Record<string, unknown>, allowedKeys: string[]): string[] {
    const imported: string[] = [];
    for (const key of allowedKeys) {
      if (key in data) {
        const ok = this.set(key, data[key]);
        if (ok || this.usingMemory) imported.push(key);
      }
    }
    return imported;
  }

  clearKeys(keys: string[]): void {
    for (const key of keys) {
      this.remove(key);
    }
  }
}

export const STORAGE_KEYS = {
  habits: "habit-tracker:habits",
  completions: "habit-tracker:completions",
  timerSessions: "habit-tracker:timer-sessions",
  activeTimer: "habit-tracker:active-timer",
  waterEntries: "habit-tracker:water-entries",
  waterReminder: "habit-tracker:water-reminder",
  settings: "habit-tracker:settings",
} as const;

export const ALL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

export const storage = new StorageService();
