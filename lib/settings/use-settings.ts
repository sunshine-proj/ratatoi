"use client";

import { useLocalDocument } from "@/lib/storage/use-local-document";
import { emptySettings, settingsDocument } from "./settings";

/**
 * Reads the saved settings and keeps them in sync across components and tabs.
 * Returns `loading` during server render and hydration.
 */
export function useSettings() {
  return useLocalDocument(settingsDocument, emptySettings);
}
