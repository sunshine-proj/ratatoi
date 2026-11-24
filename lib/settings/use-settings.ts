"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DocumentState, WriteResult } from "@/lib/storage/local-document";
import { emptySettings, settingsDocument, type UserSettings } from "./settings";

const serverSnapshot: DocumentState<UserSettings> = { status: "loading" };

/**
 * Reads the saved settings and keeps them in sync across components and tabs.
 * Returns `loading` during server render and hydration.
 */
export function useSettings() {
  const state = useSyncExternalStore(settingsDocument.subscribe, settingsDocument.read, () => serverSnapshot);

  /** Apply a change on top of the current settings (or defaults) and save it. */
  const update = useCallback((change: (current: UserSettings) => UserSettings): WriteResult => {
    const current = settingsDocument.read();
    const base = current.status === "ready" ? current.value : emptySettings;
    return settingsDocument.write(change(base));
  }, []);

  const reset = useCallback((): WriteResult => settingsDocument.clear(), []);

  return { state, update, reset };
}
