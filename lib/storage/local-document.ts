import type { z } from "zod";

/**
 * A single versioned JSON document in localStorage, validated with a Zod
 * schema on every read. Invalid or unreadable data is reported, never trusted.
 *
 * Versioning: every document has a top-level `version`. When a schema changes,
 * bump `version` and add a migration that upgrades the previous version by
 * one step (`migrations[1]` turns a v1 document into v2). Older documents are
 * upgraded on read; the upgraded form is saved on the next write.
 *
 * A document saved by a *newer* app version (e.g. another tab already
 * updated while this one runs a cached older version) is reported as
 * `invalid` with reason "newer", so the UI can ask for a reload instead of
 * offering to reset, and nothing overwrites it.
 *
 * Shared-device note: localStorage is readable by anyone using the same
 * browser profile. The UI says so where data is saved, and Settings → Account
 * can delete everything from the device.
 */
export type InvalidReason = "damaged" | "newer";

export type DocumentState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; value: T }
  | { status: "invalid"; reason: InvalidReason };

/** Upgrades a document from version n (the key) to version n + 1. */
export type Migrations = Record<number, (document: Record<string, unknown>) => Record<string, unknown>>;

export type DocumentOptions = { version: number; migrations?: Migrations };

/**
 * `unavailable`: storage blocked or full. `invalid`: the value failed the
 * schema. `unreadable`: the saved document can't be read (damaged, or from a
 * newer version), so an update refused to overwrite it.
 */
export type WriteResult = { ok: true } | { ok: false; reason: "unavailable" | "invalid" | "unreadable" };

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

const DAMAGED = { status: "invalid", reason: "damaged" } as const;
const NEWER = { status: "invalid", reason: "newer" } as const;

/** Parse, migrate, and validate a raw stored string. Pure; exported for tests. */
export function decodeDocument<S extends z.ZodType>(
  raw: string,
  schema: S,
  options: DocumentOptions,
): DocumentState<z.infer<S>> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DAMAGED;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return DAMAGED;
  const version = (data as { version?: unknown }).version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) return DAMAGED;
  if (version > options.version) return NEWER;

  let document = data as Record<string, unknown>;
  for (let from = version; from < options.version; from++) {
    const migrate = options.migrations?.[from];
    if (!migrate) return DAMAGED;
    try {
      document = migrate(document);
    } catch {
      return DAMAGED;
    }
  }
  const parsed = schema.safeParse(document);
  return parsed.success ? { status: "ready", value: parsed.data } : DAMAGED;
}

export function createLocalDocument<S extends z.ZodType>(
  key: string,
  schema: S,
  options: DocumentOptions,
): LocalDocument<z.infer<S>> {
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
    cachedState = raw === null ? EMPTY : decodeDocument(raw, schema, options);
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
