"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DocumentState, LocalDocument, WriteResult } from "./local-document";

const serverSnapshot = { status: "loading" } as const;

/**
 * Subscribe a component to a local document. Returns `loading` during server
 * render and hydration. `update` applies a change on top of the current value
 * (or `empty` when nothing valid is saved) and writes it.
 */
export function useLocalDocument<T>(document: LocalDocument<T>, empty: T) {
  const state: DocumentState<T> = useSyncExternalStore(document.subscribe, document.read, () => serverSnapshot);

  const update = useCallback(
    (change: (current: T) => T): WriteResult => {
      const current = document.read();
      return document.write(change(current.status === "ready" ? current.value : empty));
    },
    [document, empty],
  );

  const reset = useCallback((): WriteResult => document.clear(), [document]);

  return { state, update, reset };
}
