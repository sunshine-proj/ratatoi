"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DocumentState, LocalDocument, WriteResult } from "./local-document";

const serverSnapshot = { status: "loading" } as const;

/**
 * Subscribe a component to a local document. Returns `loading` during server
 * render and hydration. `update` applies a change on top of the current value
 * (or `empty` when nothing is saved) and writes it; it refuses to overwrite a
 * document that can't be read.
 */
export function useLocalDocument<T>(document: LocalDocument<T>, empty: T) {
  const state: DocumentState<T> = useSyncExternalStore(document.subscribe, document.read, () => serverSnapshot);

  const update = useCallback(
    (change: (current: T) => T): WriteResult => {
      const current = document.read();
      // Never replace data we couldn't read: it may be damaged (the user can
      // reset it explicitly) or saved by a newer version (a reload fixes it).
      if (current.status === "invalid") return { ok: false, reason: "unreadable" };
      return document.write(change(current.status === "ready" ? current.value : empty));
    },
    [document, empty],
  );

  const reset = useCallback((): WriteResult => document.clear(), [document]);

  return { state, update, reset };
}
