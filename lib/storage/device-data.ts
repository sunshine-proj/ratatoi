import { planDocument } from "@/lib/planner/store";
import { settingsDocument } from "@/lib/settings/settings";
import { shoppingDocument } from "@/lib/shopping/store";
import type { WriteResult } from "./local-document";

/**
 * Every document the app saves in this browser. Settings → Account uses this
 * to show what is stored and to delete it all, e.g. on a shared device.
 *
 * The service worker's caches are deliberately not touched: they hold only
 * public pages (identical for everyone) and are what make the app work
 * offline. Personal data never goes into them.
 */
export const deviceDocuments = [settingsDocument, planDocument, shoppingDocument] as const;

/** Approximate stored size in bytes (localStorage keeps UTF-16; good enough for "about 4 KB"). */
export function storedBytes(): number {
  try {
    return deviceDocuments.reduce((total, document) => total + (localStorage.getItem(document.key)?.length ?? 0) * 2, 0);
  } catch {
    return 0;
  }
}

/** Remove all of the app's saved data from this browser. Works even when a document can't be read. */
export function deleteAllDeviceData(): WriteResult {
  let result: WriteResult = { ok: true };
  for (const document of deviceDocuments) {
    const cleared = document.clear();
    if (!cleared.ok) result = cleared;
  }
  return result;
}
