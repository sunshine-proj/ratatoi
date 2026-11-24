import type { z } from "zod";

/**
 * A single JSON document in localStorage, validated with a Zod schema on
 * every read. Invalid or unreadable data is reported, never trusted.
 *
 * Shared-device note: localStorage is readable by anyone using the same
 * browser profile. The UI says so where data is saved.
 */
export type DocumentState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; value: T }
  | { status: "invalid" };

export type WriteResult = { ok: true } | { ok: false; reason: "unavailable" | "invalid" };

export type LocalDocument<T> = {
  key: string;
  read: () => DocumentState<T>;
  write: (value: T) => WriteResult;
  clear: () => WriteResult;
  subscribe: (onChange: () => void) => () => void;
};

const CHANGE_EVENT = "protein-plate:storage";

// Shared constant: useSyncExternalStore requires identical snapshots when nothing changed.
const EMPTY = { status: "empty" } as const;

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Access can throw when storage is disabled by browser settings.
    return null;
  }
}

export function createLocalDocument<S extends z.ZodType>(key: string, schema: S): LocalDocument<z.infer<S>> {
  type T = z.infer<S>;

  // useSyncExternalStore needs a stable snapshot: cache by the raw string.
  let cachedRaw: string | null | undefined;
  let cachedState: DocumentState<T> = { status: "loading" };

  function read(): DocumentState<T> {
    const storage = getStorage();
    if (!storage) return EMPTY;

    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return EMPTY;
    }
    if (raw === cachedRaw) return cachedState;

    cachedRaw = raw;
    if (raw === null) {
      cachedState = EMPTY;
    } else {
      try {
        const parsed = schema.safeParse(JSON.parse(raw));
        cachedState = parsed.success ? { status: "ready", value: parsed.data } : { status: "invalid" };
      } catch {
        cachedState = { status: "invalid" };
      }
    }
    return cachedState;
  }

  function notify() {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
  }

  function write(value: T): WriteResult {
    const parsed = schema.safeParse(value);
    if (!parsed.success) return { ok: false, reason: "invalid" };
    const storage = getStorage();
    if (!storage) return { ok: false, reason: "unavailable" };
    try {
      storage.setItem(key, JSON.stringify(parsed.data));
    } catch {
      // Quota exceeded or storage blocked.
      return { ok: false, reason: "unavailable" };
    }
    notify();
    return { ok: true };
  }

  function clear(): WriteResult {
    const storage = getStorage();
    if (!storage) return { ok: false, reason: "unavailable" };
    try {
      storage.removeItem(key);
    } catch {
      return { ok: false, reason: "unavailable" };
    }
    notify();
    return { ok: true };
  }

  function subscribe(onChange: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) onChange();
    };
    const onLocal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) onChange();
    };
    window.addEventListener("storage", onStorage); // other tabs
    window.addEventListener(CHANGE_EVENT, onLocal); // this tab
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onLocal);
    };
  }

  return { key, read, write, clear, subscribe };
}
