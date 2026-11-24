"use client";

import { useSyncExternalStore } from "react";
import { useOffline } from "next/offline";
import { getMessages } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Next's `useOffline` catches failed navigations and server requests (even
 * when the OS still reports a connection). `navigator.onLine` covers the case
 * where the app was opened from the service-worker cache while already
 * offline, before any framework request has failed.
 */
export function useIsOffline(): boolean {
  const frameworkOffline = useOffline();
  const browserOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  return frameworkOffline || browserOffline;
}

export function OfflineIndicator() {
  const offline = useIsOffline();
  const t = getMessages();

  return (
    // Always mounted so the change is announced politely by screen readers.
    <div role="status" aria-live="polite">
      {offline ? (
        <p className="flex items-start gap-2 border-b border-line-strong bg-surface-muted px-4 py-2 text-sm text-ink md:px-8">
          <Icon name="offline" className="mt-0.5 size-4 shrink-0" />
          <span>{t.offline.banner}</span>
        </p>
      ) : null}
    </div>
  );
}
